/**
 * RDS Database Instance Node Component
 */
import React from 'react';
import { NodeProps } from 'reactflow';
import { BaseResourceNode } from './BaseResourceNode';
import { TerraformNodeData } from '../../../types/terraform';

const RDSNode: React.FC<NodeProps<TerraformNodeData>> = (props) => {
  const { data } = props;
  const config = data.configuration || {};

  return (
    <BaseResourceNode {...props} icon="🗄️" color="bg-indigo-600">
      <div className="space-y-1 text-gray-600">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Engine:</span>
          <span className="font-medium">{config.engine || 'Not set'}</span>
        </div>
        {config.instance_class && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Instance Class:</span>
            <span className="font-medium">{config.instance_class}</span>
          </div>
        )}
        {config.allocated_storage && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Storage:</span>
            <span className="font-medium">{config.allocated_storage} GB</span>
          </div>
        )}
        {config.multi_az !== undefined && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Multi-AZ:</span>
            <span className={config.multi_az ? 'text-green-600' : 'text-gray-400'}>
              {config.multi_az ? 'Yes' : 'No'}
            </span>
          </div>
        )}
      </div>
    </BaseResourceNode>
  );
};

export default RDSNode;
