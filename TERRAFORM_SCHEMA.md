# Terraform Database Schema Design

## Overview
This schema supports Terraform infrastructure visualization, management, and version control.

## Core Models

### 1. TerraformProject
**Purpose**: Top-level container for a Terraform infrastructure project

**Fields**:
- `id` (UUID, PK)
- `user` (FK → User)
- `name` (CharField, max=200, indexed)
- `description` (TextField, optional)
- `git_repository_url` (URLField, optional)
- `git_branch` (CharField, default='main')
- `git_commit_hash` (CharField, max=40, optional)
- `terraform_version` (CharField, max=20, default='1.6.0')
- `metadata` (JSONField) - stores UI preferences, canvas position, zoom level
- `created_at` (DateTimeField, auto_now_add)
- `updated_at` (DateTimeField, auto_now)

**Relationships**:
- OneToMany → TerraformModule
- OneToMany → TerraformResource
- OneToMany → TerraformVariable
- OneToMany → TerraformOutput
- OneToMany → GitBranch

**Indexes**: name, user

---

### 2. GitBranch
**Purpose**: Track Git branches within a project

**Fields**:
- `id` (UUID, PK)
- `project` (FK → TerraformProject, on_delete=CASCADE)
- `name` (CharField, max=200)
- `is_default` (BooleanField, default=False)
- `last_commit_hash` (CharField, max=40, optional)
- `last_commit_message` (TextField, optional)
- `last_commit_author` (CharField, max=200, optional)
- `last_commit_date` (DateTimeField, optional)
- `created_at` (DateTimeField, auto_now_add)
- `updated_at` (DateTimeField, auto_now)

**Constraints**: Unique together (project, name)

---

### 3. TerraformProvider
**Purpose**: Cloud provider configuration (AWS, Azure, GCP, etc.)

**Fields**:
- `id` (UUID, PK)
- `project` (FK → TerraformProject, on_delete=CASCADE)
- `name` (CharField) - e.g., "aws", "azurerm", "google"
- `alias` (CharField, optional) - for multiple provider instances
- `version` (CharField, optional) - provider version constraint
- `region` (CharField, optional) - default region
- `configuration` (JSONField) - provider-specific config (encrypted credentials, etc.)
- `created_at` (DateTimeField, auto_now_add)
- `updated_at` (DateTimeField, auto_now)

**Constraints**: Unique together (project, name, alias)

---

### 4. TerraformModule
**Purpose**: Reusable Terraform modules

**Fields**:
- `id` (UUID, PK)
- `project` (FK → TerraformProject, on_delete=CASCADE)
- `parent_module` (FK → TerraformModule, null=True, self-referential) - for nested modules
- `name` (CharField, max=200)
- `source` (CharField) - module source (path, registry, git, etc.)
- `version` (CharField, optional)
- `path` (CharField) - relative path in project
- `metadata` (JSONField) - visual properties (position, color, collapsed)
- `created_at` (DateTimeField, auto_now_add)
- `updated_at` (DateTimeField, auto_now)

**Relationships**:
- OneToMany → TerraformResource
- OneToMany → TerraformModule (children)

---

### 5. TerraformResource
**Purpose**: Individual Terraform resources (EC2, S3, VPC, etc.)

**Fields**:
- `id` (UUID, PK)
- `project` (FK → TerraformProject, on_delete=CASCADE)
- `module` (FK → TerraformModule, null=True, on_delete=CASCADE)
- `resource_type` (CharField, max=200, indexed) - e.g., "aws_instance", "aws_s3_bucket"
- `resource_name` (CharField, max=200, indexed) - Terraform resource name
- `provider` (FK → TerraformProvider, null=True)
- `configuration` (JSONField) - resource attributes and arguments
- `metadata` (JSONField) - visual properties (position, color, icon, custom labels)
- `status` (CharField, max=20, choices) - 'unknown', 'planning', 'applying', 'created', 'updating', 'error', 'destroyed'
- `terraform_address` (CharField, unique) - full Terraform address (e.g., "module.vpc.aws_vpc.main")
- `state_id` (CharField, optional) - ID from Terraform state file
- `created_at` (DateTimeField, auto_now_add)
- `updated_at` (DateTimeField, auto_now)

**Choices for status**:
- UNKNOWN = 'unknown'
- PLANNING = 'planning'
- APPLYING = 'applying'
- CREATED = 'created'
- UPDATING = 'updating'
- ERROR = 'error'
- DESTROYED = 'destroyed'

**Indexes**: resource_type, resource_name, terraform_address

---

### 6. ResourceDependency
**Purpose**: Track dependencies between resources

**Fields**:
- `id` (UUID, PK)
- `from_resource` (FK → TerraformResource, related_name='dependencies_from')
- `to_resource` (FK → TerraformResource, related_name='dependencies_to')
- `dependency_type` (CharField, choices) - 'implicit', 'explicit', 'data'
- `created_at` (DateTimeField, auto_now_add)

**Choices for dependency_type**:
- IMPLICIT = 'implicit' - Inferred from attribute references
- EXPLICIT = 'explicit' - defined via depends_on
- DATA = 'data' - Data source dependency

**Constraints**: Unique together (from_resource, to_resource)

---

### 7. TerraformVariable
**Purpose**: Input variables for Terraform configuration

**Fields**:
- `id` (UUID, PK)
- `project` (FK → TerraformProject, on_delete=CASCADE)
- `module` (FK → TerraformModule, null=True, on_delete=CASCADE)
- `name` (CharField, max=200, indexed)
- `type` (CharField) - 'string', 'number', 'bool', 'list', 'map', 'object', etc.
- `description` (TextField, optional)
- `default_value` (JSONField, null=True)
- `value` (JSONField, null=True) - actual value provided
- `sensitive` (BooleanField, default=False)
- `validation_rules` (JSONField, optional) - validation expressions
- `created_at` (DateTimeField, auto_now_add)
- `updated_at` (DateTimeField, auto_now)

**Constraints**: Unique together (project, module, name)

---

### 8. TerraformOutput
**Purpose**: Output values from Terraform configuration

**Fields**:
- `id` (UUID, PK)
- `project` (FK → TerraformProject, on_delete=CASCADE)
- `module` (FK → TerraformModule, null=True, on_delete=CASCADE)
- `name` (CharField, max=200, indexed)
- `description` (TextField, optional)
- `value` (JSONField, null=True) - output value after apply
- `sensitive` (BooleanField, default=False)
- `created_at` (DateTimeField, auto_now_add)
- `updated_at` (DateTimeField, auto_now)

**Constraints**: Unique together (project, module, name)

---

### 9. TerraformStateFile
**Purpose**: Store snapshots of Terraform state

**Fields**:
- `id` (UUID, PK)
- `project` (FK → TerraformProject, on_delete=CASCADE)
- `branch` (FK → GitBranch, null=True, on_delete=SET_NULL)
- `version` (IntegerField) - state file version
- `terraform_version` (CharField)
- `serial` (IntegerField) - state serial number
- `lineage` (CharField) - unique state lineage identifier
- `state_data` (JSONField) - full state file content
- `resources_count` (IntegerField, default=0)
- `created_at` (DateTimeField, auto_now_add)

**Indexes**: project, version, created_at

---

### 10. TerraformExecution
**Purpose**: Track Terraform plan/apply/destroy operations

**Fields**:
- `id` (UUID, PK)
- `project` (FK → TerraformProject, on_delete=CASCADE)
- `branch` (FK → GitBranch, null=True, on_delete=SET_NULL)
- `execution_type` (CharField, choices) - 'init', 'plan', 'apply', 'destroy', 'refresh'
- `status` (CharField, choices) - 'pending', 'running', 'success', 'failed', 'cancelled'
- `initiated_by` (FK → User)
- `started_at` (DateTimeField, null=True)
- `completed_at` (DateTimeField, null=True)
- `plan_output` (TextField, optional) - plan output text
- `changes_summary` (JSONField, optional) - {add: 5, change: 2, destroy: 1}
- `logs` (TextField) - execution logs
- `error_message` (TextField, optional)
- `created_at` (DateTimeField, auto_now_add)

**Choices for execution_type**:
- INIT = 'init'
- PLAN = 'plan'
- APPLY = 'apply'
- DESTROY = 'destroy'
- REFRESH = 'refresh'

**Choices for status**:
- PENDING = 'pending'
- RUNNING = 'running'
- SUCCESS = 'success'
- FAILED = 'failed'
- CANCELLED = 'cancelled'

**Indexes**: project, status, created_at

---

### 11. ResourceCloudStatus
**Purpose**: Real-time status of deployed cloud resources (Phase 3)

**Fields**:
- `id` (UUID, PK)
- `resource` (FK → TerraformResource, on_delete=CASCADE, unique)
- `cloud_resource_id` (CharField) - actual cloud provider resource ID
- `status` (CharField) - 'running', 'stopped', 'terminated', 'healthy', 'unhealthy', etc.
- `ip_address` (GenericIPAddressField, optional)
- `url` (URLField, optional)
- `cost_per_hour` (DecimalField, optional)
- `metadata` (JSONField) - additional cloud-specific metadata
- `last_checked_at` (DateTimeField)
- `created_at` (DateTimeField, auto_now_add)
- `updated_at` (DateTimeField, auto_now)

**Indexes**: resource, last_checked_at

---

## Relationships Summary

```
User (existing)
  └─► TerraformProject
       ├─► GitBranch
       │    └─► TerraformStateFile
       │    └─► TerraformExecution
       ├─► TerraformProvider
       ├─► TerraformModule (nested tree structure)
       │    ├─► TerraformResource
       │    ├─► TerraformVariable
       │    └─► TerraformOutput
       ├─► TerraformResource
       │    ├─► ResourceDependency (from/to)
       │    └─► ResourceCloudStatus
       ├─► TerraformVariable
       ├─► TerraformOutput
       └─► TerraformExecution
```

---

## Design Decisions

### 1. JSONField for Configuration
- Terraform resources have highly variable schemas
- JSONField provides flexibility without schema migrations
- Allows storing arbitrary Terraform attributes

### 2. Metadata Pattern
- Separate visual properties from logical data
- Position, color, zoom stored in metadata JSONField
- Enables bidirectional sync (HCL ↔ Diagram)

### 3. Git Integration
- GitBranch model tracks versions
- TerraformStateFile links to branches
- Supports git-like workflows

### 4. Dependency Tracking
- Explicit ResourceDependency model
- Supports cycle detection
- Enables accurate diagram layout

### 5. Execution Tracking
- TerraformExecution audit trail
- Logs and error messages stored
- Enables rollback and debugging

### 6. Cloud Status (Phase 3)
- Separate model for real-time status
- Avoids polluting core resource model
- Optimized for frequent updates

---

## Migration Strategy

1. Create base models: Project, Provider, Module, Resource
2. Add Variable and Output models
3. Add Git and version control models
4. Add execution tracking
5. Add cloud status (Phase 3)

---

## Security Considerations

- **Credentials**: Provider configuration should be encrypted
- **Sensitive Variables**: Mark as sensitive, never log or expose
- **State Files**: May contain sensitive data, encrypt at rest
- **Access Control**: Row-level security via user FK
- **Audit Trail**: Track all modifications via TerraformExecution

---

**Last Updated**: 2025-12-02
