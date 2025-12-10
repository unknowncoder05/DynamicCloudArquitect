/**
 * Resource Properties Panel
 * Shows and allows editing of selected resource properties
 */
import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import {
  selectSelectedResource,
  updateResource,
  deleteResource,
} from '../../../store/terraformSlice';
import SecurityGroupRulesEditor from './SecurityGroupRulesEditor';
import SecurityGroupAssigner from './SecurityGroupAssigner';
import LoadBalancerConfig from './LoadBalancerConfig';

const ResourcePropertiesPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedResource = useAppSelector(selectSelectedResource);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'networking' | 'advanced'>('general');

  useEffect(() => {
    if (selectedResource) {
      setConfig(selectedResource.configuration || {});
    }
  }, [selectedResource]);

  const handleSave = async () => {
    if (!selectedResource) return;

    setIsSaving(true);
    try {
      await dispatch(
        updateResource({
          id: selectedResource.id,
          data: { configuration: config },
        })
      ).unwrap();
    } catch (err) {
      console.error('Failed to update resource:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedResource) return;

    if (
      window.confirm(
        `Are you sure you want to delete ${selectedResource.terraform_address}?`
      )
    ) {
      try {
        await dispatch(deleteResource(selectedResource.id)).unwrap();
      } catch (err) {
        console.error('Failed to delete resource:', err);
      }
    }
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleConfigUpdate = (newConfig: Record<string, any>) => {
    setConfig(newConfig);
  };

  // Check if resource supports networking features
  const supportsSecurityGroups = () => {
    if (!selectedResource) return false;
    const supportedTypes = [
      'aws_instance',
      'aws_db_instance',
      'aws_lb',
      'aws_alb',
      'aws_lambda_function',
      'aws_elasticache_cluster',
    ];
    return supportedTypes.includes(selectedResource.resource_type);
  };

  const isSecurityGroup = () => {
    return selectedResource?.resource_type === 'aws_security_group';
  };

  const isLoadBalancer = () => {
    return selectedResource?.resource_type === 'aws_lb' || selectedResource?.resource_type === 'aws_alb';
  };

  const showNetworkingTab = () => {
    return supportsSecurityGroups() || isSecurityGroup() || isLoadBalancer();
  };

  if (!selectedResource) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="text-4xl mb-3">👆</div>
        <p className="text-sm">Select a resource to view and edit its properties</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Properties</h3>
          <span
            className={`px-2 py-1 text-xs rounded ${
              selectedResource.status === 'created'
                ? 'bg-green-100 text-green-700'
                : selectedResource.status === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {selectedResource.status}
          </span>
        </div>
        <div className="text-xs text-gray-500 font-mono truncate">
          {selectedResource.terraform_address}
        </div>
      </div>

      {/* Tabs */}
      {showNetworkingTab() && (
        <div className="flex border-b border-gray-200 px-4">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('networking')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'networking'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Networking
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'advanced'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Advanced
          </button>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'general' && (
          <>
            {/* Resource Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Resource Type
              </label>
              <div className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">
                {selectedResource.resource_type}
              </div>
            </div>

            {/* Resource Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Resource Name
              </label>
              <div className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">
                {selectedResource.resource_name}
              </div>
            </div>

            {/* Provider */}
            {selectedResource.provider_name && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Provider
                </label>
                <div className="text-sm text-gray-900 bg-gray-50 rounded px-3 py-2">
                  {selectedResource.provider_name}
                </div>
              </div>
            )}

            {/* Load Balancer Specific Config */}
            {isLoadBalancer() ? (
              <LoadBalancerConfig
                resourceType={selectedResource.resource_type}
                config={config}
                onUpdate={handleConfigUpdate}
              />
            ) : (
              /* Standard Configuration Fields */
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Configuration
                </label>
                <div className="space-y-3">
                  {Object.entries(config)
                    .filter(([key]) => {
                      // Filter out networking-specific fields from general tab
                      const networkingFields = [
                        'ingress',
                        'egress',
                        'vpc_security_group_ids',
                        'security_groups',
                        'vpc_config',
                      ];
                      return !networkingFields.includes(key);
                    })
                    .map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-600 mb-1">{key}</label>
                        {typeof value === 'boolean' ? (
                          <select
                            value={value.toString()}
                            onChange={(e) =>
                              handleConfigChange(key, e.target.value === 'true')
                            }
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="true">true</option>
                            <option value="false">false</option>
                          </select>
                        ) : typeof value === 'object' && value !== null ? (
                          <textarea
                            value={JSON.stringify(value, null, 2)}
                            onChange={(e) => {
                              try {
                                handleConfigChange(key, JSON.parse(e.target.value));
                              } catch {
                                // Invalid JSON, don't update
                              }
                            }}
                            rows={3}
                            className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <input
                            type="text"
                            value={value?.toString() || ''}
                            onChange={(e) => handleConfigChange(key, e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'networking' && (
          <>
            {/* Security Group Rules Editor (for security groups) */}
            {isSecurityGroup() && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Security Group Rules
                </h3>
                <SecurityGroupRulesEditor
                  config={config}
                  onUpdate={handleConfigUpdate}
                />
              </div>
            )}

            {/* Security Group Assigner (for resources that use security groups) */}
            {supportsSecurityGroups() && !isSecurityGroup() && (
              <div>
                <SecurityGroupAssigner
                  resourceType={selectedResource.resource_type}
                  config={config}
                  onUpdate={handleConfigUpdate}
                />
              </div>
            )}

            {/* Load Balancer Network Config */}
            {isLoadBalancer() && (
              <div className="text-sm text-gray-600">
                Load balancer networking is configured in the General tab.
              </div>
            )}
          </>
        )}

        {activeTab === 'advanced' && (
          <>
            {/* Dependencies */}
            {selectedResource.dependencies_from &&
              selectedResource.dependencies_from.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Dependencies
                  </label>
                  <div className="space-y-1">
                    {selectedResource.dependencies_from.map((dep) => (
                      <div
                        key={dep.id}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded truncate"
                      >
                        {dep.terraform_address}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Metadata */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Metadata (JSON)
              </label>
              <textarea
                value={JSON.stringify(selectedResource.metadata || {}, null, 2)}
                readOnly
                rows={5}
                className="w-full px-2 py-1.5 text-xs font-mono border border-gray-300 rounded bg-gray-50"
              />
            </div>

            {/* Terraform Address */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Terraform Address
              </label>
              <div className="text-xs text-gray-900 bg-gray-50 rounded px-3 py-2 font-mono">
                {selectedResource.terraform_address}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 px-4 py-3 space-y-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          onClick={handleDelete}
          className="w-full bg-white hover:bg-red-50 text-red-600 border border-red-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Delete Resource
        </button>
      </div>
    </div>
  );
};

export default ResourcePropertiesPanel;
