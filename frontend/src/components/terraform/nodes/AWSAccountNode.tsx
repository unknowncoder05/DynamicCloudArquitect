/**
 * AWS Account Node Component
 * Container node representing an AWS account
 */
import React from 'react';
import { TerraformResource } from '../../../types/terraform';

interface AWSAccountNodeProps {
  resource: TerraformResource;
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
}

const AWSAccountNode: React.FC<AWSAccountNodeProps> = ({
  resource,
  isSelected,
  onSelect,
  onDoubleClick,
}) => {
  return (
    <div
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      className={`
        bg-gradient-to-br from-orange-50 to-orange-100
        border-2 rounded-lg p-4 min-w-[200px] cursor-pointer
        transition-all duration-200 hover:shadow-lg
        ${isSelected ? 'border-blue-500 shadow-lg' : 'border-orange-300'}
      `}
      style={{
        position: 'absolute',
        left: resource.metadata.position?.x || 0,
        top: resource.metadata.position?.y || 0,
      }}
    >
      {/* Header */}
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-2xl">☁️</span>
        <div className="flex-1">
          <div className="text-xs font-medium text-orange-600 uppercase">
            AWS Account
          </div>
          <div className="text-sm font-semibold text-gray-800">
            {resource.resource_name}
          </div>
        </div>
      </div>

      {/* Description */}
      {resource.configuration.description && (
        <div className="text-xs text-gray-600 mt-2">
          {resource.configuration.description}
        </div>
      )}

      {/* Container indicator */}
      <div className="mt-2 pt-2 border-t border-orange-200">
        <div className="text-xs text-gray-500">
          {resource.contained_resources_count} resources
        </div>
      </div>
    </div>
  );
};

export default AWSAccountNode;
