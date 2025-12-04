/**
 * Parent Resource Selector Component
 * Allows selection of parent container resource when creating a child resource
 */
import React, { useMemo } from 'react';
import {
  TerraformResource,
  getValidParents,
  requiresParent,
  getResourceDisplayName,
  getResourceIcon,
} from '../../types/terraform';

interface ParentResourceSelectorProps {
  resourceType: string;
  selectedParentId: string | null;
  onParentSelect: (parentId: string | null) => void;
  availableResources: TerraformResource[];
  disabled?: boolean;
}

const ParentResourceSelector: React.FC<ParentResourceSelectorProps> = ({
  resourceType,
  selectedParentId,
  onParentSelect,
  availableResources,
  disabled = false,
}) => {
  // Get valid parents for the selected resource type
  const validParentTypes = useMemo(() => {
    if (!resourceType) return [];
    return getValidParents(resourceType);
  }, [resourceType]);

  // Filter resources to only valid parents
  const validParents = useMemo(() => {
    return availableResources.filter(resource =>
      validParentTypes.includes(resource.resource_type)
    );
  }, [availableResources, validParentTypes]);

  // Check if this resource requires a parent
  const isRequired = requiresParent(resourceType);

  // If no valid parents exist and resource requires parent, show warning
  const showWarning = isRequired && validParents.length === 0;

  // If resource type doesn't need a parent, don't show this selector
  if (validParentTypes.length === 0) {
    return null;
  }

  return (
    <div className="parent-resource-selector" style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
        Parent Resource
        {isRequired && <span style={{ color: 'red', marginLeft: '4px' }}>*</span>}
      </label>

      <select
        value={selectedParentId || ''}
        onChange={(e) => onParentSelect(e.target.value || null)}
        disabled={disabled || validParents.length === 0}
        required={isRequired}
        style={{
          width: '100%',
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '14px',
          backgroundColor: disabled ? '#f5f5f5' : 'white',
        }}
      >
        <option value="">
          {validParents.length === 0
            ? `No ${validParentTypes.map(getResourceDisplayName).join(' or ')} available`
            : isRequired
            ? 'Select a parent...'
            : 'None (optional)'}
        </option>

        {validParents.map((parent) => (
          <option key={parent.id} value={parent.id}>
            {getResourceIcon(parent.resource_type)} {parent.resource_name} ({getResourceDisplayName(parent.resource_type)})
            {parent.hierarchy_path && ` - ${parent.hierarchy_path}`}
          </option>
        ))}
      </select>

      {showWarning && (
        <div
          style={{
            marginTop: '8px',
            padding: '10px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            fontSize: '13px',
            color: '#856404',
          }}
        >
          <strong>⚠️ Missing Parent:</strong> This resource requires a parent.
          Please create a {validParentTypes.map(getResourceDisplayName).join(' or ')} first.
        </div>
      )}

      {selectedParentId && !showWarning && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px',
            backgroundColor: '#e3f2fd',
            border: '1px solid #2196f3',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#1976d2',
          }}
        >
          <strong>📍 Will be created in:</strong>{' '}
          {validParents.find(p => p.id === selectedParentId)?.hierarchy_path || 'Selected parent'}
        </div>
      )}

      {!isRequired && !selectedParentId && (
        <div
          style={{
            marginTop: '6px',
            fontSize: '12px',
            color: '#666',
          }}
        >
          This resource can exist independently or within a{' '}
          {validParentTypes.map(getResourceDisplayName).join(' or ')}.
        </div>
      )}
    </div>
  );
};

export default ParentResourceSelector;
