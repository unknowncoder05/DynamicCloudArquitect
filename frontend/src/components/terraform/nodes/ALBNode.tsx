/**
 * Application Load Balancer Node Component
 */
import React from 'react';
import { NodeProps } from 'reactflow';
import { BaseResourceNode } from './BaseResourceNode';
import { TerraformNodeData } from '../../../types/terraform';

const ALBNode: React.FC<NodeProps<TerraformNodeData>> = (props) => {
  const { data } = props;
  const config = data.configuration || {};

  return (
    <BaseResourceNode {...props} icon="⚖️" color="bg-purple-600">
      <div className="space-y-1 text-gray-600">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Type:</span>
          <span className="font-medium">
            {config.load_balancer_type === 'network' ? 'Network' : 'Application'}
          </span>
        </div>
        {config.internal !== undefined && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Scheme:</span>
            <span className="font-medium">
              {config.internal ? 'Internal' : 'Internet-facing'}
            </span>
          </div>
        )}
        {config.enable_deletion_protection !== undefined && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Deletion Protection:</span>
            <span className={config.enable_deletion_protection ? 'text-green-600' : 'text-gray-400'}>
              {config.enable_deletion_protection ? 'On' : 'Off'}
            </span>
          </div>
        )}
        {config.subnets && Array.isArray(config.subnets) && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Subnets:</span>
            <span className="font-medium">{config.subnets.length}</span>
          </div>
        )}
      </div>
    </BaseResourceNode>
  );
};

export default ALBNode;
