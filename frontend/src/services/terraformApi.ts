/**
 * API client for Terraform infrastructure management
 */
import api from './api';
import {
  TerraformProject,
  TerraformProjectDetail,
  GitBranch,
  CloudProviderCredential,
  CloudProviderCredentialList,
  CloudProviderCredentialInput,
  CredentialValidationResponse,
  CloudProviderType,
  TerraformProvider,
  TerraformModule,
  TerraformResource,
  ResourceDependency,
  TerraformVariable,
  TerraformOutput,
  TerraformStateFile,
  TerraformExecution,
  ResourceCloudStatus,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateResourceRequest,
  UpdateResourceRequest,
  CreateExecutionRequest,
  GitCommitRequest,
  GitBranchRequest,
  CloneRepositoryRequest,
  PaginatedResponse,
} from '../types/terraform';

const BASE_URL = '/terraform';

// Projects
export const terraformProjectsApi = {
  list: () =>
    api.get<PaginatedResponse<TerraformProject>>(`${BASE_URL}/projects/`),

  get: (id: string) =>
    api.get<TerraformProjectDetail>(`${BASE_URL}/projects/${id}/`),

  create: (data: CreateProjectRequest) =>
    api.post<TerraformProject>(`${BASE_URL}/projects/`, data),

  update: (id: string, data: UpdateProjectRequest) =>
    api.patch<TerraformProject>(`${BASE_URL}/projects/${id}/`, data),

  delete: (id: string) =>
    api.delete(`${BASE_URL}/projects/${id}/`),

  parseHCL: (id: string) =>
    api.post(`${BASE_URL}/projects/${id}/parse_hcl/`),

  cloneRepository: (id: string, data: CloneRepositoryRequest) =>
    api.post(`${BASE_URL}/projects/${id}/clone_repository/`, data),
};

// Git Branches
export const gitBranchesApi = {
  list: (projectId?: string) =>
    api.get<PaginatedResponse<GitBranch>>(`${BASE_URL}/branches/`, {
      params: projectId ? { project: projectId } : undefined,
    }),

  get: (id: string) =>
    api.get<GitBranch>(`${BASE_URL}/branches/${id}/`),

  create: (data: Partial<GitBranch>) =>
    api.post<GitBranch>(`${BASE_URL}/branches/`, data),

  update: (id: string, data: Partial<GitBranch>) =>
    api.patch<GitBranch>(`${BASE_URL}/branches/${id}/`, data),

  delete: (id: string) =>
    api.delete(`${BASE_URL}/branches/${id}/`),
};

// Cloud Provider Credentials
export const credentialsApi = {
  list: (providerType?: CloudProviderType) =>
    api.get<PaginatedResponse<CloudProviderCredentialList>>(`${BASE_URL}/credentials/`, {
      params: providerType ? { provider_type: providerType } : undefined,
    }),

  get: (id: string) =>
    api.get<CloudProviderCredential>(`${BASE_URL}/credentials/${id}/`),

  create: (data: CloudProviderCredentialInput) =>
    api.post<CloudProviderCredential>(`${BASE_URL}/credentials/`, data),

  update: (id: string, data: Partial<CloudProviderCredentialInput>) =>
    api.patch<CloudProviderCredential>(`${BASE_URL}/credentials/${id}/`, data),

  delete: (id: string) =>
    api.delete(`${BASE_URL}/credentials/${id}/`),

  validate: (id: string) =>
    api.post<CredentialValidationResponse>(`${BASE_URL}/credentials/${id}/validate_credentials/`),

  setDefault: (id: string) =>
    api.patch(`${BASE_URL}/credentials/${id}/set_default/`),
};

// Providers
export const providersApi = {
  list: (projectId?: string) =>
    api.get<PaginatedResponse<TerraformProvider>>(`${BASE_URL}/providers/`, {
      params: projectId ? { project: projectId } : undefined,
    }),

  get: (id: string) =>
    api.get<TerraformProvider>(`${BASE_URL}/providers/${id}/`),

  create: (data: Partial<TerraformProvider>) =>
    api.post<TerraformProvider>(`${BASE_URL}/providers/`, data),

  update: (id: string, data: Partial<TerraformProvider>) =>
    api.patch<TerraformProvider>(`${BASE_URL}/providers/${id}/`, data),

  delete: (id: string) =>
    api.delete(`${BASE_URL}/providers/${id}/`),
};

// Modules
export const modulesApi = {
  list: (projectId?: string) =>
    api.get<PaginatedResponse<TerraformModule>>(`${BASE_URL}/modules/`, {
      params: projectId ? { project: projectId } : undefined,
    }),

  get: (id: string) =>
    api.get<TerraformModule>(`${BASE_URL}/modules/${id}/`),

  create: (data: Partial<TerraformModule>) =>
    api.post<TerraformModule>(`${BASE_URL}/modules/`, data),

  update: (id: string, data: Partial<TerraformModule>) =>
    api.patch<TerraformModule>(`${BASE_URL}/modules/${id}/`, data),

  delete: (id: string) =>
    api.delete(`${BASE_URL}/modules/${id}/`),
};

// Resources
export const resourcesApi = {
  list: (projectId?: string, params?: any) =>
    api.get<PaginatedResponse<TerraformResource>>(`${BASE_URL}/resources/`, {
      params: { ...params, ...(projectId ? { project: projectId } : {}) },
    }),

  get: (id: string) =>
    api.get<TerraformResource>(`${BASE_URL}/resources/${id}/`),

  create: (data: CreateResourceRequest) =>
    api.post<TerraformResource>(`${BASE_URL}/resources/`, data),

  update: (id: string, data: UpdateResourceRequest) =>
    api.patch<TerraformResource>(`${BASE_URL}/resources/${id}/`, data),

  delete: (id: string) =>
    api.delete(`${BASE_URL}/resources/${id}/`),

  getDependencies: (id: string) =>
    api.get<{
      dependencies_from: ResourceDependency[];
      dependencies_to: ResourceDependency[];
    }>(`${BASE_URL}/resources/${id}/dependencies/`),
};

// Dependencies
export const dependenciesApi = {
  list: (params?: any) =>
    api.get<PaginatedResponse<ResourceDependency>>(`${BASE_URL}/dependencies/`, { params }),

  get: (id: string) =>
    api.get<ResourceDependency>(`${BASE_URL}/dependencies/${id}/`),

  create: (data: Partial<ResourceDependency>) =>
    api.post<ResourceDependency>(`${BASE_URL}/dependencies/`, data),

  delete: (id: string) =>
    api.delete(`${BASE_URL}/dependencies/${id}/`),
};

// Variables
export const variablesApi = {
  list: (projectId?: string) =>
    api.get<PaginatedResponse<TerraformVariable>>(`${BASE_URL}/variables/`, {
      params: projectId ? { project: projectId } : undefined,
    }),

  get: (id: string) =>
    api.get<TerraformVariable>(`${BASE_URL}/variables/${id}/`),

  create: (data: Partial<TerraformVariable>) =>
    api.post<TerraformVariable>(`${BASE_URL}/variables/`, data),

  update: (id: string, data: Partial<TerraformVariable>) =>
    api.patch<TerraformVariable>(`${BASE_URL}/variables/${id}/`, data),

  delete: (id: string) =>
    api.delete(`${BASE_URL}/variables/${id}/`),
};

// Outputs
export const outputsApi = {
  list: (projectId?: string) =>
    api.get<PaginatedResponse<TerraformOutput>>(`${BASE_URL}/outputs/`, {
      params: projectId ? { project: projectId } : undefined,
    }),

  get: (id: string) =>
    api.get<TerraformOutput>(`${BASE_URL}/outputs/${id}/`),

  create: (data: Partial<TerraformOutput>) =>
    api.post<TerraformOutput>(`${BASE_URL}/outputs/`, data),

  update: (id: string, data: Partial<TerraformOutput>) =>
    api.patch<TerraformOutput>(`${BASE_URL}/outputs/${id}/`, data),

  delete: (id: string) =>
    api.delete(`${BASE_URL}/outputs/${id}/`),
};

// State Files
export const stateFilesApi = {
  list: (projectId?: string) =>
    api.get<PaginatedResponse<TerraformStateFile>>(`${BASE_URL}/state-files/`, {
      params: projectId ? { project: projectId } : undefined,
    }),

  get: (id: string) =>
    api.get<TerraformStateFile>(`${BASE_URL}/state-files/${id}/`),
};

// Executions
export const executionsApi = {
  list: (projectId?: string) =>
    api.get<PaginatedResponse<TerraformExecution>>(`${BASE_URL}/executions/`, {
      params: projectId ? { project: projectId } : undefined,
    }),

  get: (id: string) =>
    api.get<TerraformExecution>(`${BASE_URL}/executions/${id}/`),

  create: (data: CreateExecutionRequest) =>
    api.post<TerraformExecution>(`${BASE_URL}/executions/`, data),

  cancel: (id: string) =>
    api.post(`${BASE_URL}/executions/${id}/cancel/`),
};

// Cloud Status
export const cloudStatusApi = {
  list: (resourceId?: string) =>
    api.get<PaginatedResponse<ResourceCloudStatus>>(`${BASE_URL}/cloud-status/`, {
      params: resourceId ? { resource: resourceId } : undefined,
    }),

  get: (id: string) =>
    api.get<ResourceCloudStatus>(`${BASE_URL}/cloud-status/${id}/`),

  refreshAll: () =>
    api.post(`${BASE_URL}/cloud-status/refresh_all/`),
};

// Export all APIs
export default {
  projects: terraformProjectsApi,
  branches: gitBranchesApi,
  providers: providersApi,
  modules: modulesApi,
  resources: resourcesApi,
  dependencies: dependenciesApi,
  variables: variablesApi,
  outputs: outputsApi,
  stateFiles: stateFilesApi,
  executions: executionsApi,
  cloudStatus: cloudStatusApi,
};
