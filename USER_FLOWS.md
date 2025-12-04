# Terraform Platform - User Interaction Flows

## Overview
This document defines intuitive user flows for all key interactions in the Terraform Cloud Architecture Platform.

---

## 1. First-Time User Onboarding

### Flow: New User Setup
```
[Landing Page]
    ↓
[Sign Up Form]
    ↓ (account created)
[Welcome Screen]
    - Quick tour overlay
    - "Create First Project" button (primary)
    - "Import Existing Project" button (secondary)
    ↓ (user chooses)
[Project Creation Wizard] OR [Import Wizard]
```

### Welcome Screen Components
- **Header**: "Welcome to Terraform Cloud Architect!"
- **3 Quick Tips**:
  1. "Visualize your infrastructure in real-time"
  2. "Drag and drop resources to design"
  3. "Deploy with confidence using validation"
- **CTAs**:
  - Large blue button: "Create New Project"
  - Outlined button: "Import from Git"
  - Link: "View Example Projects"

---

## 2. Project Creation Flow

### Option A: Create from Scratch
```
[Projects Page]
    → Click "New Project" button
    ↓
[Modal: New Project]
    - Name* (text input)
    - Description (textarea)
    - Terraform Version (dropdown, default: 1.6.0)
    - Cloud Provider (multi-select: AWS, Azure, GCP)
    → Click "Create Project"
    ↓
[Empty Canvas View]
    - Welcome message: "Start by adding resources from the palette"
    - Component palette visible on left
    - Empty canvas in center
```

### Option B: Import from Git
```
[Projects Page]
    → Click "Import from Git"
    ↓
[Modal: Import Project]
    - Git Repository URL* (text input with validation)
    - Branch (text input, default: main)
    - Authentication (tabs: Public, SSH Key, Token)
    → Click "Import"
    ↓
[Loading Screen]
    - "Cloning repository..."
    - "Parsing Terraform files..."
    - Progress indicator
    ↓
[Canvas with Imported Resources]
    - Success toast: "Successfully imported X resources"
    - Auto-layout applied
    - Resources displayed with connections
```

### Option C: Upload Terraform Files
```
[Projects Page]
    → Click "Upload Files"
    ↓
[Modal: Upload Terraform Files]
    - Drag & drop zone (or file picker)
    - Accepts: .tf, .tf.json, .zip
    → User uploads files
    ↓
[Parsing Screen]
    - "Analyzing Terraform configuration..."
    ↓
[Canvas with Parsed Resources]
    - Success message
    - Resources visualized
```

---

## 3. Visual Resource Editing Flow

### Adding Resources (Drag & Drop)
```
[Diagram Canvas]
    ↓
[User Opens Component Palette]
    - Search bar: "Search resources..."
    - Categories: Compute, Networking, Storage, Database, etc.
    - Resource cards with icons
    ↓
[User Drags EC2 Instance to Canvas]
    - Ghost preview follows cursor
    - Drop zones highlight
    ↓
[Resource Dropped on Canvas]
    - Node appears at drop location
    - Automatic naming: "aws_instance_1"
    ↓
[Properties Panel Opens Automatically]
    - Pre-filled with required fields highlighted in red
    - Optional fields collapsible
    ↓
[User Fills Required Fields]
    - Instance type (dropdown)
    - AMI ID (searchable dropdown with common AMIs)
    - Subnet (dropdown of available subnets in project)
    → Click "Save" or press Enter
    ↓
[Resource Created]
    - Node shows green checkmark
    - HCL code generated in background
    - Git status shows "1 uncommitted change"
```

### Connecting Resources (Dependencies)
```
[User Selects EC2 Instance]
    - Node highlights with blue border
    - Handles appear on edges
    ↓
[User Drags from EC2's Right Handle]
    - Connection line follows cursor
    - Valid target nodes highlight green
    - Invalid targets stay dimmed
    ↓
[User Drops on Security Group]
    - Edge created with arrow
    - Label: "security_groups"
    ↓
[Automatic Configuration Update]
    - EC2's config updated: security_group_ids = [sg.id]
    - Properties panel shows new reference
    - Validation runs automatically
```

### Editing Existing Resources
```
[User Clicks Resource Node]
    ↓
[Properties Panel Opens]
    - Current configuration displayed
    - Editable fields
    - "Advanced" accordion for all attributes
    ↓
[User Modifies Field]
    - Real-time validation
    - Invalid values show error message immediately
    ↓
[User Clicks "Save"]
    - Validation runs
    - If valid: Node updates, change tracked
    - If invalid: Error message, field highlighted red
```

---

## 4. Terraform Execution Flow

### Plan Workflow
```
[Diagram Canvas]
    → User clicks "Plan" button in toolbar
    ↓
[Pre-flight Checks Modal]
    - Validating configuration...
    - Checking for errors...
    ↓ (if errors found)
[Validation Errors Panel]
    - List of errors with resource names
    - Click error → jumps to resource on canvas
    - "Fix Errors" stays on page
    ↓ (if validation passes)
[Plan Execution Modal]
    - "Running terraform plan..."
    - Live log stream
    - Cancel button
    ↓
[Plan Results Modal]
    - Summary: "5 to add, 2 to change, 0 to destroy"
    - Detailed diff view (expandable per resource)
    - Resources highlighted on canvas:
        - Green border: to add
        - Yellow border: to change
        - Red border: to destroy
    - Actions:
        - "Apply Changes" (primary button)
        - "Cancel" (secondary)
        - "Save Plan" (download .plan file)
```

### Apply Workflow
```
[Plan Results Modal]
    → User clicks "Apply Changes"
    ↓
[Confirmation Modal]
    - "You are about to apply these changes:"
    - Summary displayed again
    - Checkbox: "I understand this will modify real infrastructure"
    - Text input: "Type 'apply' to confirm"
    ↓
[User Types 'apply' and Confirms]
    ↓
[Apply Execution Modal]
    - "Applying changes..."
    - Progress bar based on resource count
    - Live logs
    - Real-time status updates per resource
    ↓ (on success)
[Success Screen]
    - "Infrastructure deployed successfully!"
    - Outputs displayed (if any)
    - Canvas nodes update to "created" status (green)
    - Option to "View Outputs" or "Close"
    ↓ (on failure)
[Error Screen]
    - "Apply failed"
    - Error message and logs
    - Failed resource highlighted in red on canvas
    - Actions:
        - "Retry"
        - "Rollback" (if partial apply)
        - "View Logs"
```

### Destroy Workflow
```
[Diagram Canvas]
    → User selects resource(s)
    → Clicks "Destroy" button
    ↓
[Destroy Warning Modal]
    - Big red warning icon
    - "⚠️ Warning: This will permanently delete resources"
    - List of resources to destroy
    - Dependent resources highlighted (will also be affected)
    - Checkbox: "I understand this cannot be undone"
    - Text input: "Type the project name to confirm"
    ↓
[User Confirms]
    ↓
[Destroy Execution]
    - Progress indicator
    - Live logs
    ↓
[Resources Removed]
    - Nodes fade out and disappear from canvas
    - Success toast
```

---

## 5. Git Operations Flow

### Committing Changes
```
[Diagram Canvas - User has made changes]
    - Git status indicator shows: "3 uncommitted changes"
    ↓
[User Clicks Git Status Indicator]
    ↓
[Git Panel Slides In from Right]
    - Changed files list:
        ✏️ main.tf (modified)
        ➕ ec2.tf (new)
        ➖ old_resource.tf (deleted)
    - Diff preview (syntax highlighted)
    - Commit message input (bottom)
    ↓
[User Writes Commit Message]
    - Placeholder: "Add EC2 instance and security group"
    ↓
[User Clicks "Commit"]
    - Validation: message not empty
    - Commits locally
    - Success toast: "Changes committed"
    - Option to "Push to Remote"
```

### Branch Management
```
[Top Navbar - Branch Dropdown]
    - Current: "main" (with green dot)
    - Click to open
    ↓
[Branch Menu]
    - List of branches with indicators:
        • main (current, green dot)
        • feature/new-vpc (2 commits ahead)
        • staging (remote only)
    - Search bar
    - "Create New Branch" button
    ↓
[User Clicks "Create New Branch"]
    ↓
[Create Branch Modal]
    - Name input
    - "Create from" dropdown (select base branch)
    - Checkbox: "Switch to this branch"
    - "Create" button
    ↓
[Branch Created]
    - Navbar updates to show new branch
    - Toast: "Switched to feature/my-branch"
```

### Viewing History
```
[Git Panel]
    → Click "History" tab
    ↓
[Commit History List]
    - Chronological list of commits
    - Each commit shows:
        - Short hash (clickable)
        - Message
        - Author
        - Timestamp
        - Files changed count
    ↓
[User Clicks a Commit]
    ↓
[Commit Details View]
    - Full diff
    - Files changed list
    - Commit metadata
    - Actions:
        - "Revert" button
        - "Cherry-pick" button
        - "View at this point" (time travel)
```

---

## 6. Resource Discovery & Search

### Finding Resources on Canvas
```
[Large Project with 50+ Resources]
    ↓
[User Uses Search Bar in Toolbar]
    - Types: "vpc"
    ↓
[Search Results]
    - Canvas dims except matching resources
    - Matching resources highlighted with pulse
    - Sidebar shows list:
        • aws_vpc.main
        • aws_vpc.secondary
        • module.networking.aws_vpc.app
    ↓
[User Clicks Result]
    - Canvas pans and zooms to resource
    - Resource selected
    - Properties panel opens
```

### Filtering by Type/Status
```
[Toolbar]
    → Click "Filters" button
    ↓
[Filter Panel]
    - Resource Type (multi-select)
        ☑ Compute (10)
        ☐ Networking (15)
        ☑ Storage (3)
    - Status
        ☑ Created (20)
        ☐ Planning (5)
        ☐ Error (0)
    - Provider
        ☑ AWS (25)
        ☐ Azure (3)
    - Apply button
    ↓
[Filtered Canvas]
    - Only matching resources visible
    - Others faded or hidden
    - Clear filters button visible
```

---

## 7. Real-Time Collaboration (Phase 6)

### Multi-User Editing
```
[User A is on Canvas]
    ↓
[User B Joins Same Project]
    - User B's avatar appears in top-right
    - Toast: "John joined"
    ↓
[User B Selects a Resource]
    - Resource shows User B's colored border
    - User A sees: "John is editing aws_instance.web"
    ↓
[Both Users Edit Different Resources]
    - Changes sync in real-time
    - No conflicts
    ↓
[User B Tries to Edit User A's Resource]
    - Lock icon appears
    - Tooltip: "Sarah is currently editing this"
    - Read-only view for User B
```

---

## 8. Error Handling & Validation

### Real-Time Validation
```
[User Edits Resource]
    ↓
[Invalid Value Entered]
    - Field border turns red immediately
    - Error message below field: "Instance type must start with t, m, c, or r"
    ↓
[User Hovers Over Error Icon]
    - Tooltip with detailed explanation
    - Link: "View valid instance types"
    ↓
[User Fixes Error]
    - Border turns green
    - Checkmark appears
    - "Save" button enabled
```

### Dependency Errors
```
[User Tries to Delete VPC]
    ↓
[System Detects Dependencies]
    ↓
[Dependency Warning Modal]
    - "⚠️ Cannot delete: 5 resources depend on this VPC"
    - List of dependent resources (clickable)
    - Options:
        - "Delete All" (VPC + dependencies)
        - "Cancel"
    ↓
[User Clicks Dependent Resource]
    - Modal stays open
    - Canvas pans to show dependent resource
    - Resource highlights
```

---

## 9. Export & Documentation

### Export HCL Code
```
[Canvas View]
    → Click "Export" in toolbar
    ↓
[Export Menu]
    - Export as Terraform (.tf files)
    - Export as Diagram (PNG, SVG)
    - Export as Documentation (Markdown)
    ↓
[User Selects "Export as Terraform"]
    ↓
[Export Options Modal]
    - Format: Multiple files OR Single file
    - Include: Variables, Outputs, Providers
    - Organize by: Resource type OR Module
    - "Download" button
    ↓
[Download Starts]
    - .zip file with organized .tf files
    - README.md included with instructions
```

---

## Key UX Principles

### 1. Progressive Disclosure
- Show simple options first
- "Advanced" accordions for complex settings
- Tooltips for additional context

### 2. Immediate Feedback
- Real-time validation
- Instant visual updates
- Loading indicators for async operations

### 3. Safety & Reversibility
- Confirmations for destructive actions
- Undo/redo support
- Git-based history (always recoverable)

### 4. Contextual Help
- Inline tooltips
- Links to Terraform documentation
- Example values shown

### 5. Clear Visual Hierarchy
- Primary actions prominent (blue, large)
- Destructive actions red
- Secondary actions outlined
- Disabled states clearly indicated

---

## Navigation Structure

```
Main Layout:
┌─────────────────────────────────────────────┐
│ [Logo] [Projects▼] [Branch▼]    [User▼]   │ ← Top Navbar
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Resource │        Diagram Canvas            │
│ Palette  │                                  │
│          │                                  │
│ [Search] │                                  │
│          │                                  │
│ Compute  │                                  │
│ Network  │                                  │
│ Storage  │                                  │
│          │                                  │
├──────────┴──────────────────────────────────┤
│ [Auto-Layout] [Zoom] [Export] [Plan] [Apply]│ ← Toolbar
└─────────────────────────────────────────────┘
```

**Right Panel (Toggleable)**:
- Properties (when resource selected)
- Git Panel (when git button clicked)
- Execution Logs (when running terraform)

---

**Last Updated**: 2025-12-02
