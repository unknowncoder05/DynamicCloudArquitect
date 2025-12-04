/**
 * S3 Bucket Node Component
 */
import React from 'react';
import { NodeProps } from 'reactflow';
import { BaseResourceNode } from './BaseResourceNode';
import { TerraformNodeData } from '../../../types/terraform';

const S3Node: React.FC<NodeProps<TerraformNodeData>> = (props) => {
  const { data } = props;
  const config = data.configuration || {};

  return (
    <BaseResourceNode {...props} icon="🪣" color="bg-green-600">
      <div className="space-y-1 text-gray-600">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Bucket:</span>
          <span className="font-mono text-xs truncate max-w-[140px]">
            {config.bucket || 'Auto-generated'}
          </span>
        </div>
        {config.acl && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">ACL:</span>
            <span className="font-medium">{config.acl}</span>
          </div>
        )}
        {config.versioning !== undefined && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Versioning:</span>
            <span className={config.versioning?.enabled ? 'text-green-600' : 'text-gray-400'}>
              {config.versioning?.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        )}
      </div>
    </BaseResourceNode>
  );
};

export default S3Node;
