/**
 * Security Group Assigner
 * Allows assigning security groups to resources (EC2 instances, RDS, Load Balancers, etc.)
 */
import React, { useState, useEffect } from 'react';
import { TerraformResource } from '../../../types/terraform';
import { useAppSelector } from '../../../store/hooks';
import { selectCurrentProject } from '../../../store/terraformSlice';

interface SecurityGroupAssignerProps {
  resourceType: string;
  config: Record<string, any>;
  onUpdate: (config: Record<string, any>) => void;
}

const SecurityGroupAssigner: React.FC<SecurityGroupAssignerProps> = ({
  resourceType,
  config,
  onUpdate,
}) => {
  const currentProject = useAppSelector(selectCurrentProject);
  const [showAddModal, setShowAddModal] = useState(false);

  // Get all security groups in the project
  const securityGroups = currentProject?.resources.filter(
    (r) => r.resource_type === 'aws_security_group'
  ) || [];

  // Get currently assigned security groups
  const getAssignedSecurityGroups = (): string[] => {
    // Different resources store SGs differently
    if (resourceType === 'aws_instance') {
      return config.vpc_security_group_ids || config.security_groups || [];
    } else if (resourceType === 'aws_db_instance') {
      return config.vpc_security_group_ids || [];
    } else if (resourceType === 'aws_lb' || resourceType === 'aws_alb') {
      return config.security_groups || [];
    } else if (resourceType === 'aws_lambda_function') {
      return config.vpc_config?.security_group_ids || [];
    }

    return [];
  };

  const assignedSgIds = getAssignedSecurityGroups();

  const addSecurityGroup = (sgId: string) => {
    const newSgIds = [...assignedSgIds, sgId];
    updateSecurityGroups(newSgIds);
    setShowAddModal(false);
  };

  const removeSecurityGroup = (sgId: string) => {
    const newSgIds = assignedSgIds.filter(id => id !== sgId);
    updateSecurityGroups(newSgIds);
  };

  const updateSecurityGroups = (sgIds: string[]) => {
    const newConfig = { ...config };

    // Update based on resource type
    if (resourceType === 'aws_instance') {
      newConfig.vpc_security_group_ids = sgIds;
    } else if (resourceType === 'aws_db_instance') {
      newConfig.vpc_security_group_ids = sgIds;
    } else if (resourceType === 'aws_lb' || resourceType === 'aws_alb') {
      newConfig.security_groups = sgIds;
    } else if (resourceType === 'aws_lambda_function') {
      if (!newConfig.vpc_config) {
        newConfig.vpc_config = {};
      }
      newConfig.vpc_config.security_group_ids = sgIds;
    }

    onUpdate(newConfig);
  };

  const getSecurityGroupName = (sgId: string): string => {
    // Check if it's a resource reference (aws_security_group.xxx.id)
    if (sgId.includes('aws_security_group')) {
      const match = sgId.match(/aws_security_group\.(\w+)/);
      if (match) {
        const sgResourceName = match[1];
        const sg = securityGroups.find(s => s.resource_name === sgResourceName);
        return sg ? sg.resource_name : sgResourceName;
      }
    }

    // Otherwise it might be a direct ID - try to find it
    const sg = securityGroups.find(s => s.id === sgId);
    return sg ? sg.resource_name : sgId;
  };

  // Filter out already assigned SGs
  const availableSgs = securityGroups.filter(
    sg => !assignedSgIds.includes(`\${aws_security_group.${sg.resource_name}.id}`)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-medium text-gray-700">
          Security Groups
        </label>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          + Add
        </button>
      </div>

      {/* Assigned Security Groups */}
      {assignedSgIds.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded">
          No security groups assigned
        </div>
      ) : (
        <div className="space-y-2">
          {assignedSgIds.map((sgId, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded px-3 py-2"
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">🛡️</span>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {getSecurityGroupName(sgId)}
                  </div>
                  <div className="text-xs text-gray-500 font-mono truncate max-w-xs">
                    {sgId}
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeSecurityGroup(sgId)}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Security Group
              </h3>
            </div>

            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              {availableSgs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-3">🛡️</div>
                  <p className="text-sm">No security groups available</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Create a security group first in the same VPC
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableSgs.map((sg) => (
                    <button
                      key={sg.id}
                      onClick={() =>
                        addSecurityGroup(`\${aws_security_group.${sg.resource_name}.id}`)
                      }
                      className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">🛡️</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">
                            {sg.resource_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {sg.configuration.description || 'No description'}
                          </div>
                          <div className="text-xs text-gray-400 font-mono truncate">
                            {sg.terraform_address}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-2">
        💡 Security groups control inbound and outbound traffic. Assign security groups from the same VPC.
      </div>
    </div>
  );
};

export default SecurityGroupAssigner;
