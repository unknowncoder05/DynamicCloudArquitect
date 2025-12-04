# Cloud Hierarchy - Integration Guide

## ✅ What's Already Done

### Backend (100%)
- ✅ TerraformResource model with parent_resource field
- ✅ Hierarchy validation (CONTAINER_RULES, REQUIRES_PARENT)
- ✅ Serializer with hierarchy fields
- ✅ Helper methods (get_hierarchy_path, is_container, etc.)

### Frontend (80%)
- ✅ TypeScript types updated with hierarchy fields
- ✅ Utility functions (canContain, getValidParents, etc.)
- ✅ ContainerNode component for visualizing containers
- ✅ TerraformDiagram updated to support parent nodes
- ✅ Node types configured for containers
- ✅ ParentResourceSelector component

## 📋 Integration Steps

### Step 1: Run Migrations

```bash
cd BackEndApi
python src/manage.py makemigrations terraform
python src/manage.py migrate
```

Expected migration:
- Adds `parent_resource` field to TerraformResource
- Adds `availability_zone` field
- Adds index on parent_resource

### Step 2: Test Backend Validation

```python
# Django shell
from api.terraform.models import TerraformResource, TerraformProject

# Try to create EC2 without subnet (should fail)
ec2 = TerraformResource(
    project=project,
    resource_type='aws_instance',
    resource_name='test-instance',
    # Missing parent_resource - should fail validation
)
ec2.clean()  # ValidationError: aws_instance must have a parent resource
```

### Step 3: Update Existing Resource Creation Forms

If you have existing forms for creating resources, update them to include ParentResourceSelector.

**Example: CreateResourceModal.tsx**

```tsx
import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { createResource, selectResources } from '../../store/terraformSlice';
import ParentResourceSelector from './ParentResourceSelector';
import { requiresParent, getResourceDisplayName } from '../../types/terraform';

const CreateResourceModal: React.FC<{ projectId: string }> = ({ projectId }) => {
  const dispatch = useAppDispatch();
  const resources = useAppSelector(selectResources);

  const [resourceType, setResourceType] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [parentResourceId, setParentResourceId] = useState<string | null>(null);
  const [configuration, setConfiguration] = useState<Record<string, any>>({});

  const canSubmit = resourceName && resourceType &&
    (!requiresParent(resourceType) || parentResourceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await dispatch(createResource({
      project: projectId,
      resource_type: resourceType,
      resource_name: resourceName,
      parent_resource: parentResourceId,
      configuration,
    }));

    // Close modal
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Resource</h2>

      {/* Resource Type Selection */}
      <div>
        <label>Resource Type *</label>
        <select
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
          required
        >
          <option value="">Select type...</option>
          <optgroup label="Network Containers">
            <option value="aws_vpc">VPC</option>
            <option value="aws_subnet">Subnet</option>
          </optgroup>
          <optgroup label="Compute">
            <option value="aws_instance">EC2 Instance</option>
            <option value="aws_lambda_function">Lambda Function</option>
          </optgroup>
          <optgroup label="Database">
            <option value="aws_db_instance">RDS Instance</option>
          </optgroup>
        </select>
      </div>

      {/* Resource Name */}
      <div>
        <label>Resource Name *</label>
        <input
          type="text"
          value={resourceName}
          onChange={(e) => setResourceName(e.target.value)}
          required
          placeholder="e.g., my-vpc, web-server"
        />
      </div>

      {/* Parent Resource Selector (shows only if applicable) */}
      <ParentResourceSelector
        resourceType={resourceType}
        selectedParentId={parentResourceId}
        onParentSelect={setParentResourceId}
        availableResources={resources}
      />

      {/* Configuration Fields (based on resource type) */}
      {resourceType === 'aws_vpc' && (
        <div>
          <label>CIDR Block *</label>
          <input
            type="text"
            value={configuration.cidr_block || ''}
            onChange={(e) => setConfiguration({ ...configuration, cidr_block: e.target.value })}
            placeholder="10.0.0.0/16"
            required
          />
        </div>
      )}

      {resourceType === 'aws_subnet' && (
        <>
          <div>
            <label>CIDR Block *</label>
            <input
              type="text"
              value={configuration.cidr_block || ''}
              onChange={(e) => setConfiguration({ ...configuration, cidr_block: e.target.value })}
              placeholder="10.0.1.0/24"
              required
            />
          </div>
          <div>
            <label>Availability Zone</label>
            <select
              value={configuration.availability_zone || ''}
              onChange={(e) => setConfiguration({ ...configuration, availability_zone: e.target.value })}
            >
              <option value="">Select AZ...</option>
              <option value="us-east-1a">us-east-1a</option>
              <option value="us-east-1b">us-east-1b</option>
              <option value="us-east-1c">us-east-1c</option>
            </select>
          </div>
        </>
      )}

      {resourceType === 'aws_instance' && (
        <>
          <div>
            <label>Instance Type *</label>
            <select
              value={configuration.instance_type || ''}
              onChange={(e) => setConfiguration({ ...configuration, instance_type: e.target.value })}
              required
            >
              <option value="">Select type...</option>
              <option value="t3.micro">t3.micro</option>
              <option value="t3.small">t3.small</option>
              <option value="t3.medium">t3.medium</option>
            </select>
          </div>
          <div>
            <label>AMI ID *</label>
            <input
              type="text"
              value={configuration.ami || ''}
              onChange={(e) => setConfiguration({ ...configuration, ami: e.target.value })}
              placeholder="ami-12345678"
              required
            />
          </div>
        </>
      )}

      <button type="submit" disabled={!canSubmit}>
        Create Resource
      </button>
    </form>
  );
};

export default CreateResourceModal;
```

### Step 4: Update Redux Slice

Make sure your Redux slice includes the hierarchy fields when creating resources:

```typescript
// terraformSlice.ts

export const createResource = createAsyncThunk(
  'terraform/createResource',
  async (data: {
    project: string;
    resource_type: string;
    resource_name: string;
    parent_resource?: string | null;  // ADD THIS
    configuration: Record<string, any>;
    availability_zone?: string;  // ADD THIS
  }) => {
    const response = await resourcesApi.create(data);
    return response.data;
  }
);
```

### Step 5: Test the Hierarchy

**Test Scenario 1: Create VPC → Subnet → Instance**

1. Create VPC:
   - Type: aws_vpc
   - Name: my-vpc
   - CIDR: 10.0.0.0/16
   - Parent: None (VPCs are root containers)

2. Create Subnet:
   - Type: aws_subnet
   - Name: public-subnet
   - CIDR: 10.0.1.0/24
   - Parent: my-vpc ← **REQUIRED**

3. Create EC2:
   - Type: aws_instance
   - Name: web-server
   - Instance Type: t3.micro
   - Parent: public-subnet ← **REQUIRED**

**Expected Result:**
```
┌──────────────────────────────────┐
│ 🌐 my-vpc (10.0.0.0/16)         │
│                                  │
│  ┌────────────────────────────┐ │
│  │ 🔷 public-subnet           │ │
│  │ 10.0.1.0/24 - us-east-1a   │ │
│  │                            │ │
│  │  ┌──────────────────────┐ │ │
│  │  │ 🖥️ web-server        │ │ │
│  │  │ t3.micro             │ │ │
│  │  └──────────────────────┘ │ │
│  └────────────────────────────┘ │
└──────────────────────────────────┘
```

**Test Scenario 2: Try to Create EC2 Without Subnet (Should Fail)**

1. Try to create EC2 directly
2. ParentResourceSelector shows warning
3. Submit button disabled until subnet selected
4. Backend validation will also catch this

### Step 6: Update Component Palette (Optional)

If you have a drag-and-drop component palette, update it to be context-aware:

```tsx
// ComponentPalette.tsx
import { requiresParent, getValidParents, canContain } from '../../types/terraform';

const ComponentPalette: React.FC = () => {
  const selectedResource = useAppSelector(selectSelectedResource);

  const resourceCategories = {
    'Network Containers': [
      {
        type: 'aws_vpc',
        label: 'VPC',
        icon: '🌐',
        canDrag: true, // Always draggable (root container)
      },
      {
        type: 'aws_subnet',
        label: 'Subnet',
        icon: '🔷',
        canDrag: selectedResource && canContain(selectedResource.resource_type, 'aws_subnet'),
        tooltip: 'Select a VPC first',
      },
    ],
    'Compute': [
      {
        type: 'aws_instance',
        label: 'EC2 Instance',
        icon: '🖥️',
        canDrag: selectedResource && canContain(selectedResource.resource_type, 'aws_instance'),
        tooltip: 'Select a subnet first',
      },
    ],
  };

  return (
    <div className="component-palette">
      {Object.entries(resourceCategories).map(([category, items]) => (
        <div key={category}>
          <h3>{category}</h3>
          {items.map(item => (
            <div
              key={item.type}
              draggable={item.canDrag}
              className={item.canDrag ? '' : 'disabled'}
              title={item.canDrag ? item.label : item.tooltip}
            >
              {item.icon} {item.label}
              {requiresParent(item.type) && <span className="required">*</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
```

## 🧪 Testing Checklist

### Backend Tests

```bash
cd BackEndApi
python src/manage.py test api.terraform.tests.test_hierarchy
```

Create `test_hierarchy.py`:

```python
from django.test import TestCase
from django.core.exceptions import ValidationError
from api.terraform.models import TerraformResource, TerraformProject
from api.users.models import User

class HierarchyTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@example.com', password='test')
        self.project = TerraformProject.objects.create(user=self.user, name='Test')

    def test_cannot_create_instance_without_subnet(self):
        """EC2 instance requires a subnet parent"""
        instance = TerraformResource(
            project=self.project,
            resource_type='aws_instance',
            resource_name='test-instance',
            terraform_address='aws_instance.test'
        )
        with self.assertRaises(ValidationError):
            instance.clean()

    def test_can_create_vpc_without_parent(self):
        """VPC can be created without a parent"""
        vpc = TerraformResource(
            project=self.project,
            resource_type='aws_vpc',
            resource_name='test-vpc',
            terraform_address='aws_vpc.test'
        )
        vpc.clean()  # Should not raise

    def test_hierarchy_path(self):
        """Test hierarchy path generation"""
        vpc = TerraformResource.objects.create(
            project=self.project,
            resource_type='aws_vpc',
            resource_name='my-vpc',
            terraform_address='aws_vpc.my_vpc'
        )
        subnet = TerraformResource.objects.create(
            project=self.project,
            resource_type='aws_subnet',
            resource_name='public-subnet',
            terraform_address='aws_subnet.public',
            parent_resource=vpc
        )
        instance = TerraformResource.objects.create(
            project=self.project,
            resource_type='aws_instance',
            resource_name='web-server',
            terraform_address='aws_instance.web',
            parent_resource=subnet
        )

        self.assertEqual(instance.get_hierarchy_path(), 'my-vpc > public-subnet > web-server')

    def test_cascading_delete(self):
        """Deleting VPC deletes all children"""
        vpc = TerraformResource.objects.create(
            project=self.project,
            resource_type='aws_vpc',
            resource_name='my-vpc',
            terraform_address='aws_vpc.my_vpc'
        )
        subnet = TerraformResource.objects.create(
            project=self.project,
            resource_type='aws_subnet',
            resource_name='subnet',
            terraform_address='aws_subnet.subnet',
            parent_resource=vpc
        )

        vpc.delete()

        # Subnet should also be deleted
        self.assertEqual(TerraformResource.objects.filter(id=subnet.id).count(), 0)
```

### Frontend Tests

Test ParentResourceSelector component:

```typescript
import { render, screen } from '@testing-library/react';
import ParentResourceSelector from './ParentResourceSelector';

test('shows warning when required parent not available', () => {
  render(
    <ParentResourceSelector
      resourceType="aws_instance"
      selectedParentId={null}
      onParentSelect={() => {}}
      availableResources={[]}
    />
  );

  expect(screen.getByText(/Missing Parent/i)).toBeInTheDocument();
});

test('hides when resource does not need parent', () => {
  const { container } = render(
    <ParentResourceSelector
      resourceType="aws_vpc"  // VPC doesn't need parent
      selectedParentId={null}
      onParentSelect={() => {}}
      availableResources={[]}
    />
  );

  expect(container.firstChild).toBeNull();
});
```

## 📚 Common Patterns

### Pattern 1: VPC with Multi-AZ Subnets

```
VPC (10.0.0.0/16)
├── Public Subnet A (10.0.1.0/24, us-east-1a)
│   ├── Web Server 1
│   └── Web Server 2
├── Public Subnet B (10.0.2.0/24, us-east-1b)
│   └── Web Server 3
├── Private Subnet A (10.0.10.0/24, us-east-1a)
│   └── App Server 1
└── Private Subnet B (10.0.11.0/24, us-east-1b)
    ├── App Server 2
    └── Database Server
```

### Pattern 2: Auto Scaling Group

```
VPC
└── Subnet
    └── Auto Scaling Group
        ├── Instance 1
        ├── Instance 2
        └── Instance 3
```

### Pattern 3: ECS Cluster

```
ECS Cluster
├── ECS Service A
│   └── Task Definition
└── ECS Service B
    └── Task Definition
```

## 🚀 Next Steps

1. ✅ Run migrations
2. ✅ Test backend validation
3. ✅ Integrate ParentResourceSelector into your forms
4. ✅ Test the full workflow
5. ⬜ Add user documentation
6. ⬜ Create video tutorial/demo
7. ⬜ Consider adding drag-and-drop restrictions

## 💡 Tips

- **Start Simple**: Begin by testing VPC → Subnet → EC2
- **Use Console Logs**: Add console.logs to see hierarchy in action
- **Check Network Tab**: Verify parent_resource is sent to API
- **Backend First**: Test backend validation in Django shell first
- **Incremental**: Add one container type at a time

## 🐛 Troubleshooting

**Issue: Nodes not showing as nested**
- Check that `parentNode` is set correctly
- Verify ReactFlow version supports parent nodes
- Check `extent: 'parent'` is set for children

**Issue: Validation not working**
- Run migrations
- Check `clean()` is being called
- Verify CONTAINER_RULES match your use case

**Issue: Layout looks wrong**
- Adjust container min sizes in ContainerNode
- Tweak spacing in getLayoutedElements
- Consider manual positioning for complex layouts

## 📖 Documentation

See also:
- `CLOUD_HIERARCHY_IMPLEMENTATION.md` - Full implementation details
- `HIERARCHY_IMPLEMENTATION_SUMMARY.md` - What's done/pending
- Backend model docstrings for field descriptions
- ReactFlow docs: https://reactflow.dev/examples/nodes/parent-node
