/**
 * VPC Node Component
 */
import React from 'react';
import { NodeProps } from 'reactflow';
import { BaseResourceNode } from './BaseResourceNode';
import { TerraformNodeData } from '../../../types/terraform';

const VPCNode: React.FC<NodeProps<TerraformNodeData>> = (props) => {
  const { data } = props;
  const config = data.configuration || {};

  return (
    <BaseResourceNode {...props} icon="🌐" color="bg-blue-600">
      <div className="space-y-1 text-gray-600">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">CIDR Block:</span>
          <span className="font-mono text-xs">{config.cidr_block || 'Not set'}</span>
        </div>
        {config.enable_dns_hostnames !== undefined && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">DNS Hostnames:</span>
            <span className={config.enable_dns_hostnames ? 'text-green-600' : 'text-gray-400'}>
              {config.enable_dns_hostnames ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        )}
        {config.enable_dns_support !== undefined && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">DNS Support:</span>
            <span className={config.enable_dns_support ? 'text-green-600' : 'text-gray-400'}>
              {config.enable_dns_support ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        )}
      </div>
    </BaseResourceNode>
  );
};

export default VPCNode;
