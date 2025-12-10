# Button-Based Hierarchy - Complete Guide

## Overview

The new implementation uses **button-based resource creation** instead of drag-and-drop, providing a more intuitive and guided experience for building cloud infrastructure hierarchies.

## 🎯 User Experience

### Adding Resources - Two Ways

#### 1. **Root Resources** (VPCs, S3 Buckets, etc.)
- Click the **blue + button** in the bottom-right corner
- Select from available root resources
- Configure and create

#### 2. **Child Resources** (Subnets, EC2 Instances, etc.)
- Click the **"+ Add Resource"** button on any container (VPC, Subnet, etc.)
- Modal shows **only valid child resources** for that container
- No guessing what can go where!

## 📦 Components Created

### 1. ContainerNode with Add Button
**File:** `frontend/src/components/terraform/nodes/ContainerNode.tsx`

**Features:**
- Visual container box with borders (VPC = blue, Subnet = lighter blue)
- Shows resource name, type, configuration (CIDR, AZ)
- Displays count of contained resources
- **"+ Add Resource" button** in bottom-right
- Emits `addResourceToContainer` event when clicked

**Visual:**
```
┌─────────────────────────────────────────┐
│ 🌐 my-vpc                               │
│ VPC (10.0.0.0/16)              3 resources│
│                                          │
│  [Child resources rendered here]        │
│                                          │
│                     [+ Add Resource]  ←  │
└─────────────────────────────────────────┘
```

### 2. AddChildResourceModal
**File:** `frontend/src/components/terraform/AddChildResourceModal.tsx`

**Features:**
- Listens for `addResourceToContainer` custom events
- Shows only resources valid for the parent container
- Two-step process:
  1. **Select resource type** - Grid of cards with icons and descriptions
  2. **Configure resource** - Type-specific form fields
- Validates required fields
- Shows hierarchy preview ("Will be created in: VPC > Subnet")

**Resource Types Supported:**
- **VPC children:** Subnet, Internet Gateway, NAT Gateway, VPN Gateway, Security Group
- **Subnet children:** EC2, RDS, Lambda, ElastiCache, EFS
- **ASG children:** EC2 Instances
- **ECS children:** ECS Services, Task Definitions

**Configuration Forms:**
- **Subnet:** CIDR block, AZ, public/private toggle
- **EC2:** Instance type, AMI ID
- **RDS:** Engine, instance class
- Extensible for more resource types

### 3. AddRootResourceButton
**File:** `frontend/src/components/terraform/AddRootResourceButton.tsx`

**Features:**
- Floating action button (FAB) in bottom-right
- Opens menu with root resource options
- Cards with icons and descriptions
- Handles click → opens creation flow

**Root Resources:**
- VPC
- S3 Bucket
- DynamoDB Table
- IAM Role
- CloudFront Distribution
- Route53 Zone

### 4. Updated TerraformDiagram
**File:** `frontend/src/components/terraform/TerraformDiagram.tsx`

**Changes:**
- Imports `AddChildResourceModal` and `AddRootResourceButton`
- Includes both components in render
- Empty state message updated to mention + button

## 🔌 Integration Steps

### Step 1: Wire Up Redux Action

The modals currently console.log the data. You need to connect them to your Redux store.

**Update `AddChildResourceModal.tsx` line ~402:**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const resourceData = {
    project: projectId,
    resource_type: selectedResourceType,
    resource_name: resourceName,
    parent_resource: parentId,  // ← Key field!
    terraform_address: `${selectedResourceType}.${resourceName.replace(/[^a-zA-Z0-9_]/g, '_')}`,
    configuration,
    availability_zone: configuration.availability_zone,
  };

  // Dispatch create action
  await dispatch(createResource(resourceData));

  // Refresh project data
  await dispatch(fetchProjectDetail(projectId));

  handleClose();
};
```

### Step 2: Update Redux Slice

Ensure your `createResource` thunk accepts `parent_resource`:

```typescript
// terraformSlice.ts

export const createResource = createAsyncThunk(
  'terraform/createResource',
  async (data: {
    project: string;
    resource_type: string;
    resource_name: string;
    terraform_address: string;
    parent_resource?: string | null;  // ← Add this
    configuration: Record<string, any>;
    availability_zone?: string;
  }) => {
    const response = await resourcesApi.create(data);
    return response.data;
  }
);
```

### Step 3: Handle Root Resource Creation

Currently `handleAddRootResource` just logs. Implement it:

```typescript
// In TerraformDiagram.tsx

const handleAddRootResource = useCallback(async (resourceType: string) => {
  // For now, create with default config
  // Later: open a configuration modal

  const resourceName = `${resourceType.replace('aws_', '')}-${Date.now()}`;

  const defaultConfigs: Record<string, any> = {
    'aws_vpc': { cidr_block: '10.0.0.0/16' },
    'aws_s3_bucket': { bucket: resourceName },
    // ... other defaults
  };

  await dispatch(createResource({
    project: projectId,
    resource_type: resourceType,
    resource_name: resourceName,
    terraform_address: `${resourceType}.${resourceName}`,
    parent_resource: null,  // Root resource
    configuration: defaultConfigs[resourceType] || {},
  }));

  await dispatch(fetchProjectDetail(projectId));
}, [dispatch, projectId]);
```

**Or better: Open a modal to configure root resource:**

```typescript
const handleAddRootResource = useCallback((resourceType: string) => {
  setSelectedRootResourceType(resourceType);
  setShowRootResourceModal(true);
  // Then show a configuration modal like AddChildResourceModal
}, []);
```

### Step 4: Test the Flow

1. **Create VPC:**
   - Click + button
   - Select "VPC"
   - Enter name: "my-vpc"
   - CIDR: "10.0.0.0/16"
   - Create

2. **Add Subnet to VPC:**
   - Click "+ Add Resource" on VPC container
   - Select "Subnet"
   - Enter name: "public-subnet"
   - CIDR: "10.0.1.0/24"
   - Select AZ: "us-east-1a"
   - Toggle "Map public IP" ON
   - Create

3. **Add EC2 to Subnet:**
   - Click "+ Add Resource" on Subnet container
   - Select "EC2 Instance"
   - Enter name: "web-server"
   - Instance Type: "t3.micro"
   - AMI: "ami-12345678"
   - Create

4. **Verify Hierarchy:**
   - VPC should contain Subnet
   - Subnet should contain EC2
   - Visual nesting should be clear

## 🎨 Visual Flow

### Empty State
```
┌─────────────────────────────────────────┐
│                                         │
│              📦                         │
│        No Resources Yet                 │
│                                         │
│  Click the + button to add your first  │
│  resource (like a VPC)                  │
│                                         │
└─────────────────────────────────────────┘
                                    [+] ← Floating button
```

### After Adding VPC
```
┌─────────────────────────────────────────┐
│ 🌐 my-vpc (10.0.0.0/16)         0 resources│
│                                          │
│                                          │
│               (empty)                    │
│                                          │
│                     [+ Add Resource]     │
└─────────────────────────────────────────┘
                                    [+] ← Still available
```

### After Adding Subnet
```
┌─────────────────────────────────────────────┐
│ 🌐 my-vpc (10.0.0.0/16)             1 resource│
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │ 🔷 public-subnet                       │ │
│  │ 10.0.1.0/24 - us-east-1a - Public     │ │
│  │                                        │ │
│  │          (empty)                       │ │
│  │                                        │ │
│  │                 [+ Add Resource]       │ │
│  └────────────────────────────────────────┘ │
│                     [+ Add Resource]         │
└─────────────────────────────────────────────┘
```

### Complete Infrastructure
```
┌───────────────────────────────────────────────────────────┐
│ 🌐 my-vpc (10.0.0.0/16)                       3 resources │
│                                                            │
│  ┌────────────────────────┐  ┌───────────────────────┐   │
│  │ 🔷 public-subnet       │  │ 🔷 private-subnet     │   │
│  │ 10.0.1.0/24            │  │ 10.0.2.0/24           │   │
│  │                        │  │                       │   │
│  │  🖥️ web-1             │  │  🗄️ db-primary       │   │
│  │  🖥️ web-2             │  │                       │   │
│  │                        │  │                       │   │
│  │  [+ Add Resource]      │  │  [+ Add Resource]     │   │
│  └────────────────────────┘  └───────────────────────┘   │
│                     [+ Add Resource]                      │
└───────────────────────────────────────────────────────────┘
```

## 🛡️ Validation & User Guidance

### Smart Validation

1. **Container Rules Enforced:**
   - VPC button shows: Subnet, IGW, NAT, VPN, SG
   - Subnet button shows: EC2, RDS, Lambda, ElastiCache, EFS
   - No confusion about what goes where!

2. **Required Fields:**
   - Modal validates before allowing submission
   - Shows which fields are required with (*)
   - Helpful placeholders

3. **Hierarchy Preview:**
   - Shows where resource will be created
   - Example: "Will be created in: my-vpc > public-subnet"

4. **Backend Validation:**
   - Even if user bypasses frontend, backend validates
   - Returns clear error messages
   - Prevents invalid hierarchies

### User-Friendly Features

**Resource Cards:**
- Icons for visual recognition
- Clear descriptions
- Hover effects
- Easy to scan

**Two-Step Process:**
1. Choose resource type (visual cards)
2. Configure resource (type-specific form)

**Back Button:**
- Can go back to resource selection
- Doesn't lose entered data until modal closes

**Context-Aware:**
- Only shows what makes sense
- No invalid options presented
- Reduces cognitive load

## 📝 Adding New Resource Types

### 1. Add to CONTAINER_RULES

```typescript
// types/terraform.ts
export const CONTAINER_RULES: Record<string, string[]> = {
  'aws_vpc': [...existing, 'aws_new_resource'],
  // or create new container
  'aws_new_container': ['aws_child_resource'],
};
```

### 2. Add Resource Option

```typescript
// AddChildResourceModal.tsx
const resourceOptions: Record<string, ResourceOption> = {
  // ...existing
  'aws_new_resource': {
    type: 'aws_new_resource',
    name: 'New Resource',
    icon: '🆕',
    description: 'Description of what it does',
  },
};
```

### 3. Add Configuration Form

```typescript
// In AddChildResourceModal, after other selectedResourceType checks:
{selectedResourceType === 'aws_new_resource' && (
  <>
    <div style={{ marginBottom: '16px' }}>
      <label>Field Name *</label>
      <input
        type="text"
        value={configuration.field_name || ''}
        onChange={(e) => setConfiguration({
          ...configuration,
          field_name: e.target.value
        })}
        required
      />
    </div>
    {/* Add more fields as needed */}
  </>
)}
```

### 4. Update Backend if Needed

If it's a new container type, update backend model:

```python
# models.py
CONTAINER_RULES = {
    # ...existing
    'aws_new_container': ['aws_child_resource'],
}

CONTAINER_TYPES = [
    # ...existing
    'aws_new_container',
]
```

## 🧪 Testing

### Manual Test Cases

**Test 1: Happy Path**
- [ ] Click + button
- [ ] Select VPC
- [ ] Fill CIDR: 10.0.0.0/16
- [ ] Create → VPC appears
- [ ] Click "+ Add Resource" on VPC
- [ ] Select Subnet
- [ ] Fill CIDR: 10.0.1.0/24
- [ ] Create → Subnet appears inside VPC

**Test 2: Validation**
- [ ] Try to create subnet without CIDR → blocked
- [ ] Try to create EC2 without instance type → blocked
- [ ] Backend should also validate

**Test 3: Multiple Levels**
- [ ] Create VPC → Subnet → EC2
- [ ] Verify 3-level nesting displays correctly
- [ ] Check hierarchy_path is correct

**Test 4: Multiple Children**
- [ ] Create VPC
- [ ] Add 2 subnets to VPC
- [ ] Add instances to both subnets
- [ ] Verify layout is clean

**Test 5: Container Sizing**
- [ ] Add many children to container
- [ ] Container should expand
- [ ] Children should position properly

## 🎯 Benefits Over Drag-and-Drop

| Drag-and-Drop | Button-Based |
|---------------|--------------|
| ❌ Where do I drop this? | ✅ Clear "Add Resource" button |
| ❌ What can I add here? | ✅ Shows only valid options |
| ❌ Validation after drag | ✅ Validation before creation |
| ❌ Easy to make mistakes | ✅ Guided workflow |
| ❌ Requires understanding of hierarchy | ✅ Hierarchy enforced by UI |
| ❌ Touch-unfriendly | ✅ Works on all devices |

## 🚀 Next Steps

1. **Implement Redux Integration:**
   - Wire up `handleSubmit` in AddChildResourceModal
   - Connect root resource creation
   - Test create → refresh flow

2. **Add Root Resource Modal:**
   - Similar to AddChildResourceModal
   - For configuring VPCs, S3 buckets, etc.
   - Opens when root resource selected

3. **Enhance Validation:**
   - Real-time CIDR validation
   - AMI validation
   - Check for naming conflicts

4. **Add Edit Functionality:**
   - Edit resource configuration
   - Change parent (if allowed)
   - Update existing resources

5. **Improve UX:**
   - Loading states
   - Success notifications
   - Error handling with retry

## 📚 Related Documentation

- `CLOUD_HIERARCHY_IMPLEMENTATION.md` - Technical hierarchy details
- `HIERARCHY_INTEGRATION_GUIDE.md` - Integration steps
- `IMPLEMENTATION_STATUS.md` - Overall project status

---

**Status:** UI Components Complete | Integration Pending | Ready for Redux Connection
**Key Files:** ContainerNode.tsx, AddChildResourceModal.tsx, AddRootResourceButton.tsx
**User Experience:** Intuitive, guided, error-resistant ✨
