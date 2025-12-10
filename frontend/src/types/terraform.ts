/**
 * TypeScript types for Terraform infrastructure management
 */

export interface TerraformProject {
  id: string;
  user: string;
  user_email: string;
  name: string;
  description: string;
  git_repository_url?: string;
  git_branch: string;
  git_commit_hash?: string;
  terraform_version: string;
  metadata: Record<string, any>;
  resources_count: number;
  branches_count: number;
  created_at: string;
  updated_at: string;
}

export interface TerraformProjectDetail extends TerraformProject {
  providers: TerraformProvider[];
  modules: TerraformModule[];
  resources: TerraformResource[];
  variables: TerraformVariable[];
  outputs: TerraformOutput[];
  git_branches: GitBranch[];
  executions: TerraformExecution[];
}

export interface GitBranch {
  id: string;
  project: string;
  name: string;
  is_default: boolean;
  last_commit_hash?: string;
  last_commit_message?: string;
  last_commit_author?: string;
  last_commit_date?: string;
  created_at: string;
  updated_at: string;
}

export type CloudProviderType = 'aws' | 'azure' | 'gcp' | 'digitalocean' | 'other';

/**
 * Cloud provider credential (lightweight list view)
 * SECURITY: Never contains raw credential values
 */
export interface CloudProviderCredentialList {
  id: string;
  name: string;
  description: string;
  provider_type: CloudProviderType;
  aws_region?: string;
  is_default: boolean;
  is_valid: boolean;
  has_credentials: boolean;
  last_validated_at?: string;
  created_at: string;
}

/**
 * Cloud provider credential (full detail view)
 * SECURITY: Credential fields are write-only, never returned in responses
 */
export interface CloudProviderCredential {
  id: string;
  user: string;
  name: string;
  description: string;
  provider_type: CloudProviderType;

  // AWS fields (write-only)
  aws_access_key_id?: string;
  aws_secret_access_key?: string;
  aws_session_token?: string;
  aws_region?: string;

  // Azure fields (write-only)
  azure_subscription_id?: string;
  azure_tenant_id?: string;
  azure_client_id?: string;
  azure_client_secret?: string;

  // GCP fields (write-only)
  gcp_project_id?: string;
  gcp_service_account_json?: string;

  // Generic credentials (write-only)
  generic_credentials?: string;

  // Status fields (read-only)
  has_aws_credentials: boolean;
  has_azure_credentials: boolean;
  has_gcp_credentials: boolean;
  has_generic_credentials: boolean;

  is_default: boolean;
  metadata: Record<string, any>;
  is_valid: boolean;
  last_used_at?: string;
  last_validated_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Request body for creating/updating credentials
 */
export interface CloudProviderCredentialInput {
  name: string;
  description?: string;
  provider_type: CloudProviderType;

  // AWS credentials
  aws_access_key_id?: string;
  aws_secret_access_key?: string;
  aws_session_token?: string;
  aws_region?: string;

  // Azure credentials
  azure_subscription_id?: string;
  azure_tenant_id?: string;
  azure_client_id?: string;
  azure_client_secret?: string;

  // GCP credentials
  gcp_project_id?: string;
  gcp_service_account_json?: string;

  // Generic credentials
  generic_credentials?: string;

  is_default?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Response from credential validation endpoint
 */
export interface CredentialValidationResponse {
  valid: boolean;
  message: string;
  identity?: {
    account?: string;
    user_id?: string;
    arn?: string;
  };
  error_code?: string;
}

export interface TerraformProvider {
  id: string;
  project: string;
  name: string;
  alias?: string;
  version?: string;
  credential?: string;  // UUID of CloudProviderCredential
  credential_name?: string;  // Display name
  credential_provider_type?: CloudProviderType;
  region?: string;
  configuration: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TerraformModule {
  id: string;
  project: string;
  parent_module?: string;
  name: string;
  source: string;
  version?: string;
  path: string;
  metadata: Record<string, any>;
  child_modules: TerraformModule[];
  created_at: string;
  updated_at: string;
}

export type ResourceStatus =
  | 'unknown'
  | 'planning'
  | 'applying'
  | 'created'
  | 'updating'
  | 'error'
  | 'destroyed';

export interface TerraformResource {
  id: string;
  project: string;
  module?: string;
  provider?: string;
  provider_name?: string;
  resource_type: string;
  resource_name: string;
  terraform_address: string;
  configuration: Record<string, any>;
  metadata: Record<string, any>;
  status: ResourceStatus;
  state_id?: string;
  // Hierarchy fields
  parent_resource?: string;  // UUID of parent resource
  parent_resource_name?: string;
  parent_resource_type?: string;
  contained_resources_count: number;
  hierarchy_path: string;
  is_container: boolean;
  can_have_parent: boolean;
  availability_zone?: string;
  // Dependencies
  dependencies_from: ResourceDependencyRef[];
  dependencies_to: ResourceDependencyRef[];
  created_at: string;
  updated_at: string;
}

export type DependencyType = 'implicit' | 'explicit' | 'data';

export interface ResourceDependencyRef {
  id: string;
  to_resource_id?: string;
  from_resource_id?: string;
  terraform_address: string;
  dependency_type: DependencyType;
}

export interface ResourceDependency {
  id: string;
  from_resource: string;
  to_resource: string;
  from_resource_address: string;
  to_resource_address: string;
  dependency_type: DependencyType;
  created_at: string;
}

export interface TerraformVariable {
  id: string;
  project: string;
  module?: string;
  name: string;
  type: string;
  description?: string;
  default_value?: any;
  value?: any;
  sensitive: boolean;
  validation_rules: any[];
  created_at: string;
  updated_at: string;
}

export interface TerraformOutput {
  id: string;
  project: string;
  module?: string;
  name: string;
  description?: string;
  value?: any;
  sensitive: boolean;
  created_at: string;
  updated_at: string;
}

export interface TerraformStateFile {
  id: string;
  project: string;
  branch?: string;
  version: number;
  terraform_version: string;
  serial: number;
  lineage: string;
  state_data: Record<string, any>;
  resources_count: number;
  created_at: string;
}

export type ExecutionType = 'init' | 'plan' | 'apply' | 'destroy' | 'refresh';
export type ExecutionStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled';

export interface TerraformExecution {
  id: string;
  project: string;
  branch?: string;
  execution_type: ExecutionType;
  status: ExecutionStatus;
  initiated_by: string;
  initiated_by_email: string;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  plan_output?: string;
  changes_summary?: {
    add: number;
    change: number;
    destroy: number;
  };
  logs: string;
  error_message?: string;
  created_at: string;
}

export interface ResourceCloudStatus {
  id: string;
  resource: string;
  resource_address: string;
  cloud_resource_id: string;
  status: string;
  ip_address?: string;
  url?: string;
  cost_per_hour?: string;
  metadata: Record<string, any>;
  last_checked_at: string;
  created_at: string;
  updated_at: string;
}

// ReactFlow node types
export interface TerraformNodeData {
  resource: TerraformResource;
  label: string;
  resourceType: string;
  provider: string;
  status: ResourceStatus;
  configuration: Record<string, any>;
}

export interface TerraformNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: TerraformNodeData;
}

export interface TerraformEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  label?: string;
  style?: Record<string, any>;
}

// AWS Resource Types
export type AWSResourceType =
  | 'aws_instance'
  | 'aws_vpc'
  | 'aws_subnet'
  | 'aws_security_group'
  | 'aws_s3_bucket'
  | 'aws_rds_instance'
  | 'aws_lambda_function'
  | 'aws_lb'
  | 'aws_alb'
  | 'aws_ecs_cluster'
  | 'aws_ecs_service'
  | 'aws_iam_role'
  | 'aws_iam_policy';

// Azure Resource Types
export type AzureResourceType =
  | 'azurerm_virtual_machine'
  | 'azurerm_virtual_network'
  | 'azurerm_subnet'
  | 'azurerm_storage_account'
  | 'azurerm_sql_database'
  | 'azurerm_app_service';

// GCP Resource Types
export type GCPResourceType =
  | 'google_compute_instance'
  | 'google_compute_network'
  | 'google_compute_subnetwork'
  | 'google_storage_bucket'
  | 'google_sql_database_instance';

export type CloudResourceType = AWSResourceType | AzureResourceType | GCPResourceType;

// API Request/Response types
export interface CreateProjectRequest {
  name: string;
  description?: string;
  git_repository_url?: string;
  git_branch?: string;
  terraform_version?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  git_branch?: string;
  terraform_version?: string;
  metadata?: Record<string, any>;
}

export interface CreateResourceRequest {
  project: string;
  module?: string;
  provider?: string;
  resource_type: string;
  resource_name: string;
  terraform_address: string;
  parent_resource?: string | null;  // UUID of parent resource for hierarchical resources
  configuration?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateResourceRequest {
  resource_name?: string;
  configuration?: Record<string, any>;
  metadata?: Record<string, any>;
  status?: ResourceStatus;
}

export interface CreateExecutionRequest {
  project: string;
  branch?: string;
  execution_type: ExecutionType;
}

// Git operation types
export interface GitCommitRequest {
  message: string;
  files?: string[];
}

export interface GitBranchRequest {
  name: string;
  checkout?: boolean;
}

export interface CloneRepositoryRequest {
  repo_url: string;
  branch?: string;
}

// Diagram layout types
export interface LayoutConfig {
  nodeSpacing: number;
  rankSpacing: number;
  direction: 'TB' | 'BT' | 'LR' | 'RL';
}

export interface DiagramFilter {
  resourceTypes?: string[];
  providers?: string[];
  modules?: string[];
  status?: ResourceStatus[];
}

// API response types
export interface APIResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface APIError {
  error: string;
  details?: Record<string, any>;
  status: number;
}

// Cloud Resource Hierarchy Configuration

/**
 * Defines which resource types can contain other resource types
 * Key: parent resource type, Value: array of allowed child resource types
 */
export const CONTAINER_RULES: Record<string, string[]> = {
  'aws_vpc': ['aws_subnet', 'aws_internet_gateway', 'aws_nat_gateway', 'aws_vpn_gateway', 'aws_security_group'],
  'aws_subnet': ['aws_instance', 'aws_db_instance', 'aws_elasticache_cluster', 'aws_efs_mount_target', 'aws_lambda_function'],
  'aws_autoscaling_group': ['aws_instance'],
  'aws_ecs_cluster': ['aws_ecs_service'],
  'aws_ecs_service': ['aws_ecs_task_definition'],
};

/**
 * Resource types that MUST have a parent container
 */
export const REQUIRES_PARENT: string[] = [
  'aws_instance',
  'aws_db_instance',
  'aws_db_subnet_group',
  'aws_elasticache_cluster',
  'aws_lambda_function',
  'aws_efs_mount_target',
];

/**
 * Resource types that can act as containers for other resources
 */
export const CONTAINER_TYPES: string[] = [
  'aws_vpc',
  'aws_subnet',
  'aws_autoscaling_group',
  'aws_ecs_cluster',
  'aws_ecs_service',
];

/**
 * Check if a parent resource type can contain a child resource type
 */
export function canContain(parentType: string, childType: string): boolean {
  return CONTAINER_RULES[parentType]?.includes(childType) || false;
}

/**
 * Get valid parent types for a given resource type
 */
export function getValidParents(resourceType: string): string[] {
  return Object.entries(CONTAINER_RULES)
    .filter(([_, children]) => children.includes(resourceType))
    .map(([parent]) => parent);
}

/**
 * Check if a resource type requires a parent
 */
export function requiresParent(resourceType: string): boolean {
  return REQUIRES_PARENT.includes(resourceType);
}

/**
 * Check if a resource type can be a container
 */
export function isContainerType(resourceType: string): boolean {
  return CONTAINER_TYPES.includes(resourceType);
}

/**
 * Get display name for AWS resource types
 */
export function getResourceDisplayName(resourceType: string): string {
  const names: Record<string, string> = {
    'aws_vpc': 'VPC',
    'aws_subnet': 'Subnet',
    'aws_instance': 'EC2 Instance',
    'aws_db_instance': 'RDS Instance',
    'aws_elasticache_cluster': 'ElastiCache Cluster',
    'aws_lambda_function': 'Lambda Function',
    'aws_s3_bucket': 'S3 Bucket',
    'aws_security_group': 'Security Group',
    'aws_alb': 'Application Load Balancer',
    'aws_internet_gateway': 'Internet Gateway',
    'aws_nat_gateway': 'NAT Gateway',
    'aws_autoscaling_group': 'Auto Scaling Group',
    'aws_ecs_cluster': 'ECS Cluster',
    'aws_ecs_service': 'ECS Service',
  };
  return names[resourceType] || resourceType;
}

/**
 * Get icon for AWS resource types
 */
export function getResourceIcon(resourceType: string): string {
  const icons: Record<string, string> = {
    'aws_vpc': '🌐',
    'aws_subnet': '🔷',
    'aws_instance': '🖥️',
    'aws_db_instance': '🗄️',
    'aws_lambda_function': 'λ',
    'aws_s3_bucket': '🪣',
    'aws_security_group': '🛡️',
    'aws_alb': '⚖️',
    'aws_internet_gateway': '🌍',
    'aws_nat_gateway': '🔀',
    'aws_autoscaling_group': '📊',
    'aws_ecs_cluster': '🐳',
  };
  return icons[resourceType] || '📦';
}
