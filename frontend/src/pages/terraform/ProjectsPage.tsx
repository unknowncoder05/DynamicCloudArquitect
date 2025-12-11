/**
 * Projects Dashboard Page
 * Lists all Terraform projects with overview metrics
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchProjects,
  createProject,
  deleteProject,
  fetchTemplates,
} from '../../store/terraformSlice';

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { projects, availableTemplates, isLoading, error } = useAppSelector((state) => state.terraform);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    terraform_version: '1.6.0',
    template: 'blank',
  });

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchTemplates());
  }, [dispatch]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(createProject(newProject)).unwrap();
      setShowCreateModal(false);
      setNewProject({ name: '', description: '', terraform_version: '1.6.0', template: 'blank' });
      dispatch(fetchProjects());
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await dispatch(deleteProject(projectId)).unwrap();
        dispatch(fetchProjects());
      } catch (err) {
        console.error('Failed to delete project:', err);
      }
    }
  };

  if (isLoading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Terraform Projects
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your infrastructure as code
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition-colors"
            >
              + New Project
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        </div>
      )}

      {/* Projects grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏗️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No projects yet
            </h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first Terraform project
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-block"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
              >
                <div
                  onClick={() => navigate(`/terraform/projects/${project.id}`)}
                  className="p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                      {project.name}
                    </h3>
                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      v{project.terraform_version}
                    </span>
                  </div>

                  {project.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-2xl font-bold text-gray-900">
                        {project.resources_count}
                      </div>
                      <div className="text-xs text-gray-500">Resources</div>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="text-2xl font-bold text-gray-900">
                        {project.branches_count}
                      </div>
                      <div className="text-xs text-gray-500">Branches</div>
                    </div>
                  </div>

                  {/* Git info */}
                  {project.git_repository_url && (
                    <div className="flex items-center text-xs text-gray-500 mb-2">
                      <span className="mr-1">🔗</span>
                      <span className="truncate">{project.git_repository_url}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Branch: {project.git_branch}</span>
                    <span>
                      Updated {new Date(project.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 px-6 py-3 flex justify-end space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/terraform/projects/${project.id}`);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Open
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <form onSubmit={handleCreateProject}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Create New Project
                </h3>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProject.name}
                    onChange={(e) =>
                      setNewProject({ ...newProject, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="my-infrastructure"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({ ...newProject, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe your infrastructure project..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terraform Version
                  </label>
                  <select
                    value={newProject.terraform_version}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        terraform_version: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="1.6.0">1.6.0</option>
                    <option value="1.5.7">1.5.7</option>
                    <option value="1.4.6">1.4.6</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Template
                  </label>
                  <select
                    value={newProject.template}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        template: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {availableTemplates.map((template) => (
                      <option key={template.name} value={template.name}>
                        {template.display_name}
                      </option>
                    ))}
                  </select>
                  {newProject.template && availableTemplates.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      {availableTemplates.find(t => t.name === newProject.template)?.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewProject({
                      name: '',
                      description: '',
                      terraform_version: '1.6.0',
                      template: 'blank',
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
