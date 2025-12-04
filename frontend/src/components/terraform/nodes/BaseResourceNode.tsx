/**
 * Base Resource Node Component
 * Provides common UI and functionality for all resource node types
 */
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { TerraformNodeData, ResourceStatus } from '../../../types/terraform';

interface BaseResourceNodeProps extends NodeProps<TerraformNodeData> {
  icon: React.ReactNode;
  color: string;
  children?: React.ReactNode;
}

const statusColors: Record<ResourceStatus, string> = {
  unknown: 'bg-gray-200 border-gray-400',
  planning: 'bg-blue-100 border-blue-400',
  applying: 'bg-yellow-100 border-yellow-400',
  created: 'bg-green-100 border-green-500',
  updating: 'bg-orange-100 border-orange-400',
  error: 'bg-red-100 border-red-500',
  destroyed: 'bg-gray-300 border-gray-500',
};

const statusIcons: Record<ResourceStatus, string> = {
  unknown: '❓',
  planning: '⏳',
  applying: '⚙️',
  created: '✅',
  updating: '🔄',
  error: '❌',
  destroyed: '🗑️',
};

export const BaseResourceNode: React.FC<BaseResourceNodeProps> = ({
  data,
  selected,
  icon,
  color,
  children,
}) => {
  const status = data.status || 'unknown';
  const statusColor = statusColors[status];
  const statusIcon = statusIcons[status];

  return (
    <div
      className={`
        min-w-[200px] max-w-[280px] rounded-lg border-2 shadow-md bg-white
        ${selected ? 'border-blue-500 shadow-lg' : statusColor}
        transition-all duration-200 hover:shadow-lg
      `}
    >
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />

      {/* Header */}
      <div className={`px-3 py-2 rounded-t-lg ${color} text-white flex items-center gap-2`}>
        <div className="text-xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs opacity-80 truncate">{data.resourceType}</div>
          <div className="font-semibold truncate text-sm">{data.label}</div>
        </div>
        <div className="text-lg" title={status}>
          {statusIcon}
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-2 text-sm">
        {children || (
          <div className="space-y-1 text-gray-600">
            <div className="flex justify-between">
              <span className="text-gray-500">Provider:</span>
              <span className="font-medium">{data.provider || 'N/A'}</span>
            </div>
            {data.configuration && Object.keys(data.configuration).length > 0 && (
              <div className="text-xs text-gray-400 mt-1">
                {Object.keys(data.configuration).length} properties
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer - show key config values */}
      {data.configuration && (
        <div className="px-3 py-1 bg-gray-50 rounded-b-lg border-t text-xs text-gray-500">
          <div className="truncate">
            {data.configuration.tags?.Name && `Name: ${data.configuration.tags.Name}`}
            {data.configuration.id && `ID: ${data.configuration.id}`}
          </div>
        </div>
      )}
    </div>
  );
};

export default BaseResourceNode;
