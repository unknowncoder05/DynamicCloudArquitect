/**
 * Lambda Function Node Component
 */
import React from 'react';
import { NodeProps } from 'reactflow';
import { BaseResourceNode } from './BaseResourceNode';
import { TerraformNodeData } from '../../../types/terraform';

const LambdaNode: React.FC<NodeProps<TerraformNodeData>> = (props) => {
  const { data } = props;
  const config = data.configuration || {};

  return (
    <BaseResourceNode {...props} icon="λ" color="bg-yellow-600">
      <div className="space-y-1 text-gray-600">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Runtime:</span>
          <span className="font-medium">{config.runtime || 'Not set'}</span>
        </div>
        {config.handler && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Handler:</span>
            <span className="font-mono text-xs truncate max-w-[120px]">
              {config.handler}
            </span>
          </div>
        )}
        {config.memory_size && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Memory:</span>
            <span className="font-medium">{config.memory_size} MB</span>
          </div>
        )}
        {config.timeout && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Timeout:</span>
            <span className="font-medium">{config.timeout}s</span>
          </div>
        )}
      </div>
    </BaseResourceNode>
  );
};

export default LambdaNode;
