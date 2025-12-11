/**
 * Redux slice for Terraform infrastructure state management
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import terraformApi from '../services/terraformApi';
import {
  TerraformProject,
  TerraformProjectDetail,
  TerraformResource,
  TerraformProvider,
  TerraformModule,
  TerraformVariable,
  TerraformOutput,
  GitBranch,
  TerraformExecution,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateResourceRequest,
  UpdateResourceRequest,
  ProjectTemplate,
} from '../types/terraform';

interface TerraformState {
  // Projects
  projects: TerraformProject[];
  currentProject: TerraformProjectDetail | null;

  // Resources
  resources: TerraformResource[];
  selectedResourceId: string | null;

  // Other entities
  providers: TerraformProvider[];
  modules: TerraformModule[];
  variables: TerraformVariable[];
  outputs: TerraformOutput[];
  branches: GitBranch[];
  executions: TerraformExecution[];

  // Templates
  availableTemplates: ProjectTemplate[];
  isLoadingTemplates: boolean;

  // UI state
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Diagram state
  diagramFilter: {
    resourceTypes: string[];
    providers: string[];
    status: string[];
  };
  diagramLayout: 'auto' | 'manual';
  showGrid: boolean;
  snapToGrid: boolean;
}

const initialState: TerraformState = {
  projects: [],
  currentProject: null,
  resources: [],
  selectedResourceId: null,
  providers: [],
  modules: [],
  variables: [],
  outputs: [],
  branches: [],
  executions: [],
  availableTemplates: [],
  isLoadingTemplates: false,
  isLoading: false,
  isSaving: false,
  error: null,
  diagramFilter: {
    resourceTypes: [],
    providers: [],
    status: [],
  },
  diagramLayout: 'auto',
  showGrid: true,
  snapToGrid: true,
};

// Async Thunks

// Projects
export const fetchProjects = createAsyncThunk(
  'terraform/fetchProjects',
  async () => {
    const response = await terraformApi.projects.list();
    return response.data.results;
  }
);

export const fetchProjectDetail = createAsyncThunk(
  'terraform/fetchProjectDetail',
  async (projectId: string) => {
    const response = await terraformApi.projects.get(projectId);
    return response.data;
  }
);

export const createProject = createAsyncThunk(
  'terraform/createProject',
  async (data: CreateProjectRequest) => {
    const response = await terraformApi.projects.create(data);
    return response.data;
  }
);

export const updateProject = createAsyncThunk(
  'terraform/updateProject',
  async ({ id, data }: { id: string; data: UpdateProjectRequest }) => {
    const response = await terraformApi.projects.update(id, data);
    return response.data;
  }
);

export const deleteProject = createAsyncThunk(
  'terraform/deleteProject',
  async (projectId: string) => {
    await terraformApi.projects.delete(projectId);
    return projectId;
  }
);

export const fetchTemplates = createAsyncThunk(
  'terraform/fetchTemplates',
  async () => {
    const response = await terraformApi.projects.templates();
    return response.data;
  }
);

// Resources
export const fetchResources = createAsyncThunk(
  'terraform/fetchResources',
  async (projectId: string) => {
    const response = await terraformApi.resources.list(projectId);
    return response.data.results;
  }
);

export const createResource = createAsyncThunk(
  'terraform/createResource',
  async (data: CreateResourceRequest) => {
    const response = await terraformApi.resources.create(data);
    return response.data;
  }
);

export const updateResource = createAsyncThunk(
  'terraform/updateResource',
  async ({ id, data }: { id: string; data: UpdateResourceRequest }) => {
    const response = await terraformApi.resources.update(id, data);
    return response.data;
  }
);

export const deleteResource = createAsyncThunk(
  'terraform/deleteResource',
  async (resourceId: string) => {
    await terraformApi.resources.delete(resourceId);
    return resourceId;
  }
);

// Providers
export const fetchProviders = createAsyncThunk(
  'terraform/fetchProviders',
  async (projectId: string) => {
    const response = await terraformApi.providers.list(projectId);
    return response.data.results;
  }
);

// Branches
export const fetchBranches = createAsyncThunk(
  'terraform/fetchBranches',
  async (projectId: string) => {
    const response = await terraformApi.branches.list(projectId);
    return response.data.results;
  }
);

// Executions
export const fetchExecutions = createAsyncThunk(
  'terraform/fetchExecutions',
  async (projectId: string) => {
    const response = await terraformApi.executions.list(projectId);
    return response.data.results;
  }
);

export const createExecution = createAsyncThunk(
  'terraform/createExecution',
  async (data: { project: string; execution_type: 'plan' | 'apply' | 'destroy' }) => {
    const response = await terraformApi.executions.create(data);
    return response.data;
  }
);

// Slice
const terraformSlice = createSlice({
  name: 'terraform',
  initialState,
  reducers: {
    // Resource selection
    selectResource: (state, action: PayloadAction<string | null>) => {
      state.selectedResourceId = action.payload;
    },

    // Diagram filters
    setDiagramFilter: (state, action: PayloadAction<Partial<TerraformState['diagramFilter']>>) => {
      state.diagramFilter = { ...state.diagramFilter, ...action.payload };
    },

    clearDiagramFilter: (state) => {
      state.diagramFilter = {
        resourceTypes: [],
        providers: [],
        status: [],
      };
    },

    // Diagram layout
    setDiagramLayout: (state, action: PayloadAction<'auto' | 'manual'>) => {
      state.diagramLayout = action.payload;
    },

    toggleGrid: (state) => {
      state.showGrid = !state.showGrid;
    },

    toggleSnapToGrid: (state) => {
      state.snapToGrid = !state.snapToGrid;
    },

    // Update resource position (for manual layout)
    updateResourcePosition: (
      state,
      action: PayloadAction<{ id: string; x: number; y: number }>
    ) => {
      const resource = state.resources.find(r => r.id === action.payload.id);
      if (resource) {
        resource.metadata = {
          ...resource.metadata,
          position: { x: action.payload.x, y: action.payload.y },
        };
      }
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Clear current project
    clearCurrentProject: (state) => {
      state.currentProject = null;
      state.resources = [];
      state.providers = [];
      state.modules = [];
      state.variables = [];
      state.outputs = [];
      state.branches = [];
      state.executions = [];
      state.selectedResourceId = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Projects
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch projects';
      });

    // Fetch Project Detail
    builder
      .addCase(fetchProjectDetail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProject = action.payload;
        state.resources = action.payload.resources || [];
        state.providers = action.payload.providers || [];
        state.modules = action.payload.modules || [];
        state.variables = action.payload.variables || [];
        state.outputs = action.payload.outputs || [];
        state.branches = action.payload.git_branches || [];
        state.executions = action.payload.executions || [];
      })
      .addCase(fetchProjectDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch project details';
      });

    // Create Project
    builder
      .addCase(createProject.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.isSaving = false;
        state.projects.push(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.error.message || 'Failed to create project';
      });

    // Update Project
    builder
      .addCase(updateProject.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.isSaving = false;
        const index = state.projects.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.currentProject && state.currentProject.id === action.payload.id) {
          state.currentProject = { ...state.currentProject, ...action.payload };
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.error.message || 'Failed to update project';
      });

    // Delete Project
    builder
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter(p => p.id !== action.payload);
        if (state.currentProject?.id === action.payload) {
          state.currentProject = null;
        }
      });

    // Fetch Templates
    builder
      .addCase(fetchTemplates.pending, (state) => {
        state.isLoadingTemplates = true;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.isLoadingTemplates = false;
        state.availableTemplates = action.payload;
      })
      .addCase(fetchTemplates.rejected, (state) => {
        state.isLoadingTemplates = false;
      });

    // Fetch Resources
    builder
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.resources = action.payload;
      });

    // Create Resource
    builder
      .addCase(createResource.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(createResource.fulfilled, (state, action) => {
        state.isSaving = false;
        state.resources.push(action.payload);
      })
      .addCase(createResource.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.error.message || 'Failed to create resource';
      });

    // Update Resource
    builder
      .addCase(updateResource.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(updateResource.fulfilled, (state, action) => {
        state.isSaving = false;
        const index = state.resources.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.resources[index] = action.payload;
        }
      })
      .addCase(updateResource.rejected, (state, action) => {
        state.isSaving = false;
        state.error = action.error.message || 'Failed to update resource';
      });

    // Delete Resource
    builder
      .addCase(deleteResource.fulfilled, (state, action) => {
        state.resources = state.resources.filter(r => r.id !== action.payload);
        if (state.selectedResourceId === action.payload) {
          state.selectedResourceId = null;
        }
      });

    // Fetch Providers
    builder.addCase(fetchProviders.fulfilled, (state, action) => {
      state.providers = action.payload;
    });

    // Fetch Branches
    builder.addCase(fetchBranches.fulfilled, (state, action) => {
      state.branches = action.payload;
    });

    // Fetch Executions
    builder.addCase(fetchExecutions.fulfilled, (state, action) => {
      state.executions = action.payload;
    });

    // Create Execution
    builder.addCase(createExecution.fulfilled, (state, action) => {
      state.executions.unshift(action.payload);
    });
  },
});

// Actions
export const {
  selectResource,
  setDiagramFilter,
  clearDiagramFilter,
  setDiagramLayout,
  toggleGrid,
  toggleSnapToGrid,
  updateResourcePosition,
  clearError,
  clearCurrentProject,
} = terraformSlice.actions;

// Selectors
export const selectCurrentProject = (state: { terraform: TerraformState }) =>
  state.terraform.currentProject;

export const selectResources = (state: { terraform: TerraformState }) =>
  state.terraform.resources;

export const selectSelectedResource = (state: { terraform: TerraformState }) => {
  const { resources, selectedResourceId } = state.terraform;
  return resources.find(r => r.id === selectedResourceId) || null;
};

export const selectFilteredResources = (state: { terraform: TerraformState }) => {
  const { resources, diagramFilter } = state.terraform;

  return resources.filter(resource => {
    if (diagramFilter.resourceTypes.length > 0 &&
        !diagramFilter.resourceTypes.includes(resource.resource_type)) {
      return false;
    }

    if (diagramFilter.providers.length > 0 &&
        resource.provider_name &&
        !diagramFilter.providers.includes(resource.provider_name)) {
      return false;
    }

    if (diagramFilter.status.length > 0 &&
        !diagramFilter.status.includes(resource.status)) {
      return false;
    }

    return true;
  });
};

export const selectProviders = (state: { terraform: TerraformState }) =>
  state.terraform.providers;

export const selectBranches = (state: { terraform: TerraformState }) =>
  state.terraform.branches;

export const selectExecutions = (state: { terraform: TerraformState }) =>
  state.terraform.executions;

export const selectIsLoading = (state: { terraform: TerraformState }) =>
  state.terraform.isLoading;

export const selectIsSaving = (state: { terraform: TerraformState }) =>
  state.terraform.isSaving;

export const selectError = (state: { terraform: TerraformState }) =>
  state.terraform.error;

export const selectDiagramFilter = (state: { terraform: TerraformState }) =>
  state.terraform.diagramFilter;

export default terraformSlice.reducer;
