/**
 * Security Group Node Component
 */
import React from 'react';
import { NodeProps } from 'reactflow';
import { BaseResourceNode } from './BaseResourceNode';
import { TerraformNodeData } from '../../../types/terraform';

const SecurityGroupNode: React.FC<NodeProps<TerraformNodeData>> = (props) => {
  const { data } = props;
  const config = data.configuration || {};

  const ingressCount = Array.isArray(config.ingress) ? config.ingress.length : 0;
  const egressCount = Array.isArray(config.egress) ? config.egress.length : 0;

  return (
    <BaseResourceNode {...props} icon="🛡️" color="bg-red-600">
      <div className="space-y-1 text-gray-600">
        {config.description && (
          <div className="text-xs text-gray-500 mb-2 truncate">
            {config.description}
          </div>
        )}
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Ingress Rules:</span>
          <span className="font-medium">{ingressCount}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Egress Rules:</span>
          <span className="font-medium">{egressCount}</span>
        </div>
        {config.vpc_id && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">VPC:</span>
            <span className="font-mono text-xs truncate max-w-[100px]">
              {config.vpc_id}
            </span>
          </div>
        )}
      </div>
    </BaseResourceNode>
  );
};

export default SecurityGroupNode;
