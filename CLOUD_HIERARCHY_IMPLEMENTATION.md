# Cloud Infrastructure Hierarchy - Implementation Plan

## Problem Statement

Cloud resources have strict parent-child containment relationships that must be enforced:

- **VPC** (Virtual Private Cloud) contains **Subnets**
- **Subnet** contains **EC2 instances**, **RDS databases**, **Lambda functions**, etc.
- **Auto Scaling Groups** contain **EC2 instances**
- **Security Groups** attach to resources but aren't containers
- **Load Balancers** connect to resources across subnets

You cannot create:
- An EC2 instance without a subnet
- A subnet without a VPC
- Resources floating independently

## Required Changes

### 1. Backend Model Updates

#### Add Containment Field to TerraformResource

```python
class TerraformResource(models.Model):
    # ... existing fields ...

    # NEW: Parent resource for containment hierarchy
    parent_resource = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='contained_resources'
    )

    # NEW: Availability zone (for AWS resources)
    availability_zone = models.CharField(max_length=50, blank=True)
```

#### Add Resource Hierarchy Validation

```python
class TerraformResource(models.Model):
    # ... existing fields ...

    # Define containment rules
    CONTAINER_RULES = {
        'aws_vpc': ['aws_subnet', 'aws_internet_gateway', 'aws_nat_gateway', 'aws_vpn_gateway'],
        'aws_subnet': ['aws_instance', 'aws_db_instance', 'aws_elasticache_cluster', 'aws_efs_mount_target'],
        'aws_autoscaling_group': ['aws_instance'],
        'aws_ecs_cluster': ['aws_ecs_service'],
        'aws_ecs_service': ['aws_ecs_task_definition'],
    }

    # Define resources that MUST have a parent
    REQUIRES_PARENT = [
        'aws_instance',
        'aws_db_instance',
        'aws_elasticache_cluster',
        'aws_lambda_function',
        'aws_efs_mount_target',
    ]

    # Define container resources (can contain others)
    CONTAINER_TYPES = [
        'aws_vpc',
        'aws_subnet',
        'aws_autoscaling_group',
        'aws_ecs_cluster',
        'aws_ecs_service',
    ]

    def clean(self):
        """Validate parent-child relationships."""
        super().clean()

        # Check if resource requires a parent
        if self.resource_type in self.REQUIRES_PARENT and not self.parent_resource:
            raise ValidationError(
                f"{self.resource_type} must have a parent resource (e.g., subnet)"
            )

        # Validate parent-child compatibility
        if self.parent_resource:
            parent_type = self.parent_resource.resource_type
            allowed_children = self.CONTAINER_RULES.get(parent_type, [])

            if self.resource_type not in allowed_children:
                raise ValidationError(
                    f"{parent_type} cannot contain {self.resource_type}. "
                    f"Allowed children: {', '.join(allowed_children)}"
                )

        # Check circular reference
        if self.parent_resource:
            current = self.parent_resource
            while current:
                if current.id == self.id:
                    raise ValidationError("Circular parent-child relationship detected")
                current = current.parent_resource

    def get_hierarchy_path(self):
        """Get full hierarchy path (e.g., VPC > Subnet > Instance)."""
        path = [self.resource_name]
        current = self.parent_resource

        while current:
            path.insert(0, current.resource_name)
            current = current.parent_resource

        return ' > '.join(path)

    def get_all_children(self):
        """Recursively get all contained resources."""
        children = list(self.contained_resources.all())
        for child in list(children):
            children.extend(child.get_all_children())
        return children

    @property
    def is_container(self):
        """Check if this resource can contain others."""
        return self.resource_type in self.CONTAINER_TYPES
```

### 2. Serializer Updates

```python
class TerraformResourceSerializer(serializers.ModelSerializer):
    # ... existing fields ...

    parent_resource = serializers.PrimaryKeyRelatedField(
        queryset=TerraformResource.objects.all(),
        required=False,
        allow_null=True
    )
    parent_resource_name = serializers.CharField(
        source='parent_resource.resource_name',
        read_only=True,
        allow_null=True
    )
    parent_resource_type = serializers.CharField(
        source='parent_resource.resource_type',
        read_only=True,
        allow_null=True
    )
    contained_resources_count = serializers.SerializerMethodField()
    hierarchy_path = serializers.SerializerMethodField()
    is_container = serializers.ReadOnlyField()

    class Meta:
        model = TerraformResource
        fields = [
            # ... existing fields ...
            'parent_resource',
            'parent_resource_name',
            'parent_resource_type',
            'contained_resources_count',
            'hierarchy_path',
            'is_container',
            'availability_zone',
        ]

    def get_contained_resources_count(self, obj):
        return obj.contained_resources.count()

    def get_hierarchy_path(self, obj):
        return obj.get_hierarchy_path()
```

### 3. Frontend Type Updates

```typescript
// Add to terraform.ts

export interface TerraformResource {
  // ... existing fields ...
  parent_resource?: string;  // UUID
  parent_resource_name?: string;
  parent_resource_type?: string;
  contained_resources_count: number;
  hierarchy_path: string;
  is_container: boolean;
  availability_zone?: string;
}

// Resource hierarchy configuration
export const CONTAINER_RULES: Record<string, string[]> = {
  'aws_vpc': ['aws_subnet', 'aws_internet_gateway', 'aws_nat_gateway', 'aws_vpn_gateway'],
  'aws_subnet': ['aws_instance', 'aws_db_instance', 'aws_elasticache_cluster', 'aws_efs_mount_target'],
  'aws_autoscaling_group': ['aws_instance'],
  'aws_ecs_cluster': ['aws_ecs_service'],
  'aws_ecs_service': ['aws_ecs_task_definition'],
};

export const REQUIRES_PARENT = [
  'aws_instance',
  'aws_db_instance',
  'aws_elasticache_cluster',
  'aws_lambda_function',
  'aws_efs_mount_target',
];

export const CONTAINER_TYPES = [
  'aws_vpc',
  'aws_subnet',
  'aws_autoscaling_group',
  'aws_ecs_cluster',
  'aws_ecs_service',
];

// Helper to check if a resource can be a parent of another
export function canContain(parentType: string, childType: string): boolean {
  return CONTAINER_RULES[parentType]?.includes(childType) || false;
}

// Helper to get valid parents for a resource type
export function getValidParents(resourceType: string): string[] {
  return Object.entries(CONTAINER_RULES)
    .filter(([_, children]) => children.includes(resourceType))
    .map(([parent]) => parent);
}
```

### 4. ReactFlow Visualization with Parent Nodes

ReactFlow supports parent nodes natively. Update the diagram component:

```typescript
// TerraformDiagram.tsx

const convertResourcesToNodes = useCallback((resources: TerraformResource[]): Node[] => {
  return resources.map((resource) => {
    const savedPosition = resource.metadata?.position;

    // Calculate extent for container nodes (bounding box)
    const extent: [number, number] | 'parent' | undefined = resource.parent_resource
      ? 'parent'  // Child nodes are constrained to parent
      : undefined;

    // Set node style based on whether it's a container
    const style: React.CSSProperties = resource.is_container
      ? {
          backgroundColor: 'rgba(240, 240, 255, 0.3)',
          border: '2px solid #4a90e2',
          borderRadius: '8px',
          padding: '20px',
          minWidth: '600px',
          minHeight: '400px',
        }
      : {
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
        };

    return {
      id: resource.id,
      type: resource.is_container ? 'container' : resource.resource_type,
      position: savedPosition || { x: 0, y: 0 },
      data: {
        resource,
        label: resource.resource_name,
        resourceType: resource.resource_type,
        provider: resource.provider_name || 'unknown',
        status: resource.status,
        configuration: resource.configuration,
        hierarchyPath: resource.hierarchy_path,
        containedCount: resource.contained_resources_count,
      },
      style,
      parentNode: resource.parent_resource || undefined,
      extent,
      expandParent: true,  // Automatically expand parent to fit children
    };
  });
}, []);

// Update layout algorithm to respect hierarchy
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  // Group nodes by parent
  const rootNodes = nodes.filter(n => !n.parentNode);
  const childNodesByParent = new Map<string, Node[]>();

  nodes.forEach(node => {
    if (node.parentNode) {
      if (!childNodesByParent.has(node.parentNode)) {
        childNodesByParent.set(node.parentNode, []);
      }
      childNodesByParent.get(node.parentNode)!.push(node);
    }
  });

  // Layout root nodes first
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 150, ranksep: 200 });

  rootNodes.forEach(node => {
    const childCount = childNodesByParent.get(node.id)?.length || 0;
    const width = Math.max(600, childCount * 300);
    const height = Math.max(400, Math.ceil(childCount / 2) * 250);

    dagreGraph.setNode(node.id, { width, height });
  });

  // Layout children within each parent
  childNodesByParent.forEach((children, parentId) => {
    children.forEach((child, index) => {
      const cols = Math.ceil(Math.sqrt(children.length));
      const row = Math.floor(index / cols);
      const col = index % cols;

      child.position = {
        x: 50 + col * 280,
        y: 80 + row * 220,
      };
    });
  });

  // Layout root nodes
  dagre.layout(dagreGraph);
  rootNodes.forEach(node => {
    const positioned = dagreGraph.node(node.id);
    node.position = {
      x: positioned.x - 300,
      y: positioned.y - 200,
    };
  });

  return { nodes, edges };
};
```

### 5. Container Node Component

Create a special node for containers:

```typescript
// frontend/src/components/terraform/nodes/ContainerNode.tsx

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const ContainerNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="container-node">
      <Handle type="target" position={Position.Top} />

      <div className="container-header">
        <div className="container-icon">
          {data.resourceType === 'aws_vpc' && '🌐'}
          {data.resourceType === 'aws_subnet' && '🔷'}
          {data.resourceType === 'aws_autoscaling_group' && '📊'}
        </div>
        <div className="container-title">
          <h3>{data.label}</h3>
          <span className="resource-type">{data.resourceType}</span>
        </div>
        <div className="contained-count">
          {data.containedCount} resources
        </div>
      </div>

      {/* Configuration details */}
      <div className="container-config">
        {data.resourceType === 'aws_vpc' && (
          <div>CIDR: {data.configuration.cidr_block}</div>
        )}
        {data.resourceType === 'aws_subnet' && (
          <div>
            <div>CIDR: {data.configuration.cidr_block}</div>
            <div>AZ: {data.configuration.availability_zone}</div>
          </div>
        )}
      </div>

      {/* Status indicator */}
      <div className={`status-indicator status-${data.status}`}>
        {data.status}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default ContainerNode;
```

### 6. Resource Creation Workflow

Update resource creation to enforce hierarchy:

```typescript
// CreateResourceModal.tsx

const CreateResourceModal: React.FC = () => {
  const [resourceType, setResourceType] = useState('');
  const [parentResource, setParentResource] = useState<string | null>(null);
  const resources = useAppSelector(selectResources);

  // Get valid parents based on selected resource type
  const validParents = useMemo(() => {
    if (!resourceType) return [];

    const parentTypes = getValidParents(resourceType);
    return resources.filter(r => parentTypes.includes(r.resource_type));
  }, [resourceType, resources]);

  // Check if resource requires a parent
  const requiresParent = REQUIRES_PARENT.includes(resourceType);

  return (
    <div className="modal">
      <h2>Create Resource</h2>

      {/* Resource Type Selection */}
      <select value={resourceType} onChange={e => setResourceType(e.target.value)}>
        <option value="">Select Resource Type</option>
        <option value="aws_vpc">VPC</option>
        <option value="aws_subnet">Subnet</option>
        <option value="aws_instance">EC2 Instance</option>
        {/* ... more types */}
      </select>

      {/* Parent Selection (if applicable) */}
      {validParents.length > 0 && (
        <div>
          <label>
            Parent Resource {requiresParent && <span className="required">*</span>}
          </label>
          <select
            value={parentResource || ''}
            onChange={e => setParentResource(e.target.value || null)}
            required={requiresParent}
          >
            <option value="">None</option>
            {validParents.map(parent => (
              <option key={parent.id} value={parent.id}>
                {parent.resource_name} ({parent.resource_type})
              </option>
            ))}
          </select>

          {validParents.length === 0 && requiresParent && (
            <p className="error">
              This resource requires a parent. Please create a{' '}
              {getValidParents(resourceType).join(' or ')} first.
            </p>
          )}
        </div>
      )}

      {/* Resource Configuration */}
      {/* ... configuration fields based on resource type ... */}

      {/* Hierarchy Preview */}
      {parentResource && (
        <div className="hierarchy-preview">
          <strong>Will be created in:</strong>
          <div className="hierarchy-path">
            {resources.find(r => r.id === parentResource)?.hierarchy_path}
            {' > '}
            <span className="new-resource">New {resourceType}</span>
          </div>
        </div>
      )}
    </div>
  );
};
```

### 7. Component Palette Updates

```typescript
// ComponentPalette.tsx

const ComponentPalette: React.FC = () => {
  const selectedResource = useAppSelector(selectSelectedResource);

  // Group resources by category
  const resourceCategories = {
    'Network Containers': [
      { type: 'aws_vpc', label: 'VPC', icon: '🌐', requiresParent: false },
      { type: 'aws_subnet', label: 'Subnet', icon: '🔷', requiresParent: true, parentTypes: ['aws_vpc'] },
    ],
    'Compute': [
      { type: 'aws_instance', label: 'EC2 Instance', icon: '🖥️', requiresParent: true, parentTypes: ['aws_subnet'] },
      { type: 'aws_lambda_function', label: 'Lambda', icon: 'λ', requiresParent: true, parentTypes: ['aws_subnet'] },
    ],
    'Database': [
      { type: 'aws_db_instance', label: 'RDS Instance', icon: '🗄️', requiresParent: true, parentTypes: ['aws_subnet'] },
    ],
    'Containers': [
      { type: 'aws_autoscaling_group', label: 'Auto Scaling Group', icon: '📊', requiresParent: false },
    ],
  };

  return (
    <div className="component-palette">
      {Object.entries(resourceCategories).map(([category, items]) => (
        <div key={category} className="category">
          <h3>{category}</h3>
          {items.map(item => {
            const canDrop = !item.requiresParent || (
              selectedResource &&
              item.parentTypes?.includes(selectedResource.resource_type)
            );

            return (
              <div
                key={item.type}
                className={`palette-item ${!canDrop ? 'disabled' : ''}`}
                draggable={canDrop}
                title={
                  !canDrop
                    ? `Select a ${item.parentTypes?.join(' or ')} first`
                    : item.label
                }
              >
                <span className="icon">{item.icon}</span>
                <span className="label">{item.label}</span>
                {item.requiresParent && <span className="requires-parent">*</span>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
```

## Migration Plan

### Step 1: Database Migration

```python
# migration file
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('terraform', 'previous_migration'),
    ]

    operations = [
        migrations.AddField(
            model_name='terraformresource',
            name='parent_resource',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.CASCADE,
                related_name='contained_resources',
                to='terraform.terraformresource'
            ),
        ),
        migrations.AddField(
            model_name='terraformresource',
            name='availability_zone',
            field=models.CharField(blank=True, max_length=50),
        ),
    ]
```

### Step 2: Data Migration (Optional)

If you have existing resources, create a data migration to establish parent-child relationships:

```python
def establish_hierarchy(apps, schema_editor):
    TerraformResource = apps.get_model('terraform', 'TerraformResource')

    # Get all VPCs, Subnets, Instances
    vpcs = TerraformResource.objects.filter(resource_type='aws_vpc')
    subnets = TerraformResource.objects.filter(resource_type='aws_subnet')
    instances = TerraformResource.objects.filter(resource_type='aws_instance')

    # Link subnets to VPCs based on configuration
    for subnet in subnets:
        vpc_id = subnet.configuration.get('vpc_id')
        if vpc_id:
            try:
                vpc = vpcs.get(configuration__id=vpc_id)
                subnet.parent_resource = vpc
                subnet.save()
            except:
                pass

    # Link instances to subnets
    for instance in instances:
        subnet_id = instance.configuration.get('subnet_id')
        if subnet_id:
            try:
                subnet = subnets.get(configuration__id=subnet_id)
                instance.parent_resource = subnet
                instance.save()
            except:
                pass
```

## Testing Checklist

- [ ] Cannot create EC2 instance without selecting a subnet
- [ ] Cannot create subnet without selecting a VPC
- [ ] VPC displays as a large container box
- [ ] Subnet displays inside VPC container
- [ ] EC2 instances display inside subnet container
- [ ] Dragging a child within parent works
- [ ] Cannot drag child outside parent boundary
- [ ] Deleting VPC cascades to subnets and instances
- [ ] Component palette disables incompatible resources
- [ ] Hierarchy path shows correctly (VPC > Subnet > Instance)

## Visual Reference

```
┌─────────────────────────────────────────────────────────────┐
│ VPC: my-vpc (10.0.0.0/16)                                   │
│                                                             │
│  ┌────────────────────────────┐  ┌────────────────────────┐│
│  │ Subnet: public-subnet      │  │ Subnet: private-subnet ││
│  │ (10.0.1.0/24) - us-east-1a │  │ (10.0.2.0/24) - us-e-1b││
│  │                            │  │                        ││
│  │  ┌──────────┐  ┌─────────┐│  │  ┌──────────┐         ││
│  │  │ instance │  │ instance││  │  │ rds-db   │         ││
│  │  │ web-1    │  │ web-2   ││  │  │ primary  │         ││
│  │  └──────────┘  └─────────┘│  │  └──────────┘         ││
│  └────────────────────────────┘  └────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Next Steps

1. Add `parent_resource` field to model
2. Implement validation logic
3. Create container node component
4. Update diagram layout algorithm
5. Update resource creation forms
6. Add hierarchy validation on frontend
7. Test with real AWS infrastructure patterns
