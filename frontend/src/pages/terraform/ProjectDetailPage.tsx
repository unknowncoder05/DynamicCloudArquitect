/**
 * Project Detail Page
 * Shows the Terraform diagram canvas with all resources
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchProjectDetail,
  clearCurrentProject,
  selectCurrentProject,
  selectIsLoading,
} from '../../store/terraformSlice';
import TerraformDiagram from '../../components/terraform/TerraformDiagram';
import ResourcePropertiesPanel from '../../components/terraform/panels/ResourcePropertiesPanel';
import ComponentPalette from '../../components/terraform/panels/ComponentPalette';

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentProject = useAppSelector(selectCurrentProject);
  const isLoading = useAppSelector(selectIsLoading);

  const [showPalette, setShowPalette] = useState(true);
  const [showProperties, setShowProperties] = useState(false);

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectDetail(projectId));
    }

    return () => {
      dispatch(clearCurrentProject());
    };
  }, [projectId, dispatch]);

  // Listen for double-click event to show properties panel
  useEffect(() => {
    const handleShowProperties = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { resourceId } = customEvent.detail;

      // Show properties panel when a resource is double-clicked
      if (resourceId) {
        setShowProperties(true);
      }
    };

    window.addEventListener('showResourceProperties', handleShowProperties);

    return () => {
      window.removeEventListener('showResourceProperties', handleShowProperties);
    };
  }, []);

  if (isLoading && !currentProject) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!currentProject && !isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Project Not Found
          </h3>
          <button
            onClick={() => navigate('/terraform/projects')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top Navbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/terraform/projects')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentProject?.name}
            </h2>
            <div className="text-xs text-gray-500">
              {currentProject?.resources.length || 0} resources • Branch: {currentProject?.git_branch}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPalette(!showPalette)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              showPalette
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            📦 Palette
          </button>
          <button
            onClick={() => setShowProperties(!showProperties)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              showProperties
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            ⚙️ Properties
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
          >
            Plan
          </button>
          <button
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Sidebar - Component Palette */}
        {showPalette && (
          <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
            <ComponentPalette projectId={projectId!} />
          </div>
        )}

        {/* Center - Diagram Canvas */}
        <div className="flex-1">
          {projectId && <TerraformDiagram projectId={projectId} />}
        </div>

        {/* Right Sidebar - Properties Panel */}
        {showProperties && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <ResourcePropertiesPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage;
