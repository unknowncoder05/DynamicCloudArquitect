/**
 * EC2 Instance Node Component
 */
import React from 'react';
import { NodeProps } from 'reactflow';
import { BaseResourceNode } from './BaseResourceNode';
import { TerraformNodeData } from '../../../types/terraform';

const EC2Node: React.FC<NodeProps<TerraformNodeData>> = (props) => {
  const { data } = props;
  const config = data.configuration || {};

  return (
    <BaseResourceNode {...props} icon="🖥️" color="bg-orange-500">
      <div className="space-y-1 text-gray-600">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Instance Type:</span>
          <span className="font-medium">{config.instance_type || 'Not set'}</span>
        </div>
        {config.ami && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">AMI:</span>
            <span className="font-mono text-xs truncate max-w-[120px]">
              {config.ami}
            </span>
          </div>
        )}
        {config.availability_zone && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">AZ:</span>
            <span className="font-medium">{config.availability_zone}</span>
          </div>
        )}
      </div>
    </BaseResourceNode>
  );
};

export default EC2Node;
