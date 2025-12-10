# Nested Container Event Handling Fix

## Problem
When trying to add an EC2 instance to a Subnet that's inside a VPC, the event was bubbling up to the VPC container, causing the instance to be attempted to be added to the VPC instead of the Subnet.

## Root Causes
1. **Event Bubbling**: Drag/drop and click events were propagating from child containers (Subnet) to parent containers (VPC)
2. **Z-Index Issues**: Parent and child containers had the same z-index, causing ambiguity about which should receive events
3. **Poor Event Handling**: dragLeave events were triggering on child element transitions

## Solutions Implemented

### 1. Event Propagation Control
**File**: `frontend/src/components/terraform/nodes/ContainerNode.tsx`

#### Drag Over Handler
```typescript
const handleDragOver = (e: React.DragEvent) => {
  e.stopPropagation(); // ← CRITICAL: Prevents parent from receiving event
  // ... rest of logic
};
```

#### Drop Handler
```typescript
const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  e.stopPropagation(); // ← CRITICAL: Only innermost container handles drop
  // ... rest of logic
};
```

#### Button Click Handler
```typescript
<button
  onClick={(e) => {
    e.stopPropagation();  // ← Prevents VPC from receiving subnet button clicks
    e.preventDefault();
    // ... trigger modal
  }}
  onMouseDown={(e) => {
    e.stopPropagation(); // ← Also stop on mouse down
  }}
>
```

### 2. Z-Index Based on Hierarchy Depth
**Files**:
- `frontend/src/components/terraform/nodes/ContainerNode.tsx`
- `frontend/src/components/terraform/TerraformDiagram.tsx`

Child containers now have higher z-index than parents:
- VPC (depth 0): z-index = 0
- Subnet in VPC (depth 1): z-index = 1
- EC2 in Subnet (depth 2): z-index = 2

```typescript
// In ContainerNode.tsx
const hierarchyDepth = data.hierarchyPath ? data.hierarchyPath.split('/').length : 0;
const zIndex = 1 + hierarchyDepth;

// In TerraformDiagram.tsx (node creation)
const hierarchyDepth = resource.hierarchy_path ? resource.hierarchy_path.split('/').length : 0;
const zIndex = hierarchyDepth;

return {
  // ...
  zIndex,
  style: {
    zIndex,
    pointerEvents: 'auto',
  },
};
```

### 3. Improved Drag Leave Detection
**File**: `frontend/src/components/terraform/nodes/ContainerNode.tsx`

Now properly detects when the drag actually leaves the container vs just moving to a child element:

```typescript
const handleDragLeave = (e: React.DragEvent) => {
  e.stopPropagation();

  const relatedTarget = e.relatedTarget as HTMLElement;
  const currentTarget = e.currentTarget as HTMLElement;

  // Only reset if truly leaving, not just moving to a child
  if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
    setIsDragOver(false);
    setCanDrop(false);
  }
};
```

### 4. Debug Logging
Added console logs to help identify which container is receiving events:

```typescript
console.log(`✅ Dropping ${resourceType} into ${data.resourceType} (${label})`);
console.warn(`❌ Cannot add ${resourceType} to ${data.resourceType} (${label}). ...`);
```

## How It Works Now

### Scenario: Adding EC2 to Subnet inside VPC

1. **User drags EC2 from palette**
   - Drag data contains `resourceType: 'aws_instance'`

2. **Hover over VPC**
   - VPC's `handleDragOver` checks if EC2 is valid child
   - EC2 is NOT valid for VPC (needs Subnet)
   - VPC shows **red border** ❌
   - Event is stopped from propagating further

3. **Hover over Subnet (inside VPC)**
   - Subnet's `handleDragOver` fires INSTEAD of VPC's (due to z-index + stopPropagation)
   - Subnet checks if EC2 is valid child
   - EC2 IS valid for Subnet ✅
   - Subnet shows **green border** ✅

4. **Drop on Subnet**
   - Subnet's `handleDrop` fires ONLY (not VPC's)
   - Console logs: `✅ Dropping aws_instance into aws_subnet (my-subnet)`
   - Modal opens with:
     - Parent: Subnet ID
     - Resource Type: EC2
   - User fills in instance details → Create
   - EC2 appears inside Subnet ✅

### Scenario: Using "+ Add Resource" Button

1. **User clicks "+ Add Resource" on Subnet**
   - Button's `onClick` has `e.stopPropagation()`
   - VPC's click handler does NOT fire
   - Only Subnet's modal opens with correct parent

2. **User selects EC2**
   - Modal shows EC2 configuration form
   - Parent is already set to Subnet

3. **User creates EC2**
   - Redux action creates with `parent_resource: subnet.id`
   - EC2 appears inside Subnet ✅

## Visual Hierarchy

```
┌─────────────────────────────────────────┐
│ VPC (z-index: 1)                        │
│ Handles: Subnet, IGW, NAT, etc.         │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Subnet (z-index: 2)               │ │
│  │ Handles: EC2, RDS, Lambda, etc.   │ │
│  │                                   │ │
│  │  ┌─────────────────────────────┐ │ │
│  │  │ EC2 (z-index: 3)            │ │ │
│  │  │ No children                  │ │ │
│  │  └─────────────────────────────┘ │ │
│  │                                   │ │
│  │  [+ Add Resource] ← Only adds    │ │
│  │                     to SUBNET    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [+ Add Resource] ← Only adds to VPC   │
└─────────────────────────────────────────┘
```

## Testing Checklist

- [x] Drag Subnet to VPC → Works
- [x] Click "+ Add Resource" on VPC → Opens with VPC as parent
- [x] Drag EC2 to VPC → Shows red border (invalid)
- [x] Drag EC2 to Subnet → Shows green border (valid)
- [x] Drop EC2 on Subnet → Creates inside Subnet, not VPC
- [x] Click "+ Add Resource" on Subnet → Opens with Subnet as parent
- [x] Create EC2 via Subnet button → Appears inside Subnet
- [x] Multiple Subnets in VPC → Each handles its own events

## Files Modified

1. `frontend/src/components/terraform/nodes/ContainerNode.tsx`
   - Added `e.stopPropagation()` to all event handlers
   - Improved `handleDragLeave` logic
   - Added z-index calculation based on hierarchy depth
   - Added debug console logs

2. `frontend/src/components/terraform/TerraformDiagram.tsx`
   - Added z-index to ReactFlow node configuration
   - Added `pointerEvents: 'auto'` style

3. `frontend/src/types/terraform.ts`
   - Already had `CONTAINER_RULES` defined correctly

4. `frontend/src/components/terraform/AddChildResourceModal.tsx`
   - Already handles `preselectedType` from drag-and-drop

## Key Takeaways

✅ **Always call `e.stopPropagation()`** in nested interactive elements
✅ **Use z-index based on hierarchy depth** for proper stacking
✅ **Check `relatedTarget` in dragLeave** to avoid false triggers
✅ **Add debug logs** to verify which element receives events
✅ **Test with 3+ levels of nesting** to catch edge cases

## Performance Notes

- Event propagation stopping happens in O(1) time
- Z-index calculation is cached in component render
- No performance impact from these changes
- Console logs can be removed in production if needed
