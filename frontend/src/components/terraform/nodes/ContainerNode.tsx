/**
 * Container Node Component
 * Displays cloud resources that can contain other resources (VPC, Subnet, etc.)
 */
import React, { useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { getResourceIcon, getResourceDisplayName, CONTAINER_RULES } from '../../../types/terraform';

interface ContainerNodeData {
  resource: any;
  label: string;
  resourceType: string;
  provider: string;
  status: string;
  configuration: Record<string, any>;
  hierarchyPath: string;
  containedCount: number;
}

const ContainerNode: React.FC<NodeProps<ContainerNodeData>> = ({ data, selected }) => {
  const { resource, label, resourceType, configuration, status, containedCount } = data;
  const icon = getResourceIcon(resourceType);
  const displayName = getResourceDisplayName(resourceType);

  const [isDragOver, setIsDragOver] = useState(false);
  const [canDrop, setCanDrop] = useState(false);

  // Get container-specific styles based on type
  const getContainerStyles = () => {
    // Don't set z-index here - it's already set by ReactFlow on the node wrapper
    switch (resourceType) {
      case 'aws_vpc':
        return {
          backgroundColor: 'rgba(66, 135, 245, 0.05)',
          border: '3px solid #4287f5',
          minWidth: '800px',
          minHeight: '500px',
          padding: '60px 30px 30px 30px',
        };
      case 'aws_subnet':
        return {
          backgroundColor: 'rgba(130, 180, 245, 0.08)',
          border: '2px solid #82b4f5',
          minWidth: '350px',
          minHeight: '280px',
          padding: '50px 20px 20px 20px',
        };
      case 'aws_autoscaling_group':
        return {
          backgroundColor: 'rgba(255, 152, 0, 0.05)',
          border: '2px dashed #ff9800',
          minWidth: '400px',
          minHeight: '300px',
          padding: '50px 20px 20px 20px',
        };
      case 'aws_ecs_cluster':
        return {
          backgroundColor: 'rgba(33, 150, 243, 0.05)',
          border: '2px solid #2196f3',
          minWidth: '400px',
          minHeight: '300px',
          padding: '50px 20px 20px 20px',
        };
      default:
        return {
          backgroundColor: 'rgba(200, 200, 200, 0.05)',
          border: '2px solid #ccc',
          minWidth: '400px',
          minHeight: '300px',
          padding: '50px 20px 20px 20px',
        };
    }
  };

  const containerStyles = getContainerStyles();

  // Check if a resource type can be dropped in this container
  const checkCanDrop = (resourceType: string): boolean => {
    const validChildren = CONTAINER_RULES[data.resourceType] || [];
    return validChildren.includes(resourceType);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.stopPropagation(); // Prevent parent containers from handling this

    // Check if resourceType is being dragged
    const hasResourceType = e.dataTransfer.types.includes('resourcetype');

    // Debug logging
    console.log(`🎯 DragOver on ${data.resourceType} (${label}), hasResourceType: ${hasResourceType}`);

    if (hasResourceType) {
      // Assume it can be dropped (will validate on actual drop)
      e.preventDefault(); // Allow drop
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
      setCanDrop(true);
    } else {
      e.dataTransfer.dropEffect = 'none';
      setIsDragOver(false);
      setCanDrop(false);
    }
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation(); // Prevent parent containers from handling this

    // Use relatedTarget to check if we're leaving to a child element
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;

    // If relatedTarget is null or not a descendant of currentTarget, we've left the container
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      setIsDragOver(false);
      setCanDrop(false);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation(); // CRITICAL: Stop event from bubbling to parent containers

    const resourceType = e.dataTransfer.getData('resourceType');

    if (resourceType && checkCanDrop(resourceType)) {
      console.log(`✅ Dropping ${resourceType} into ${data.resourceType} (${label})`);

      // Trigger the add resource modal with parent pre-filled
      const event = new CustomEvent('addResourceToContainer', {
        detail: {
          parentId: resource.id,
          parentType: data.resourceType,
          preselectedType: resourceType, // Pass the dragged resource type
        },
      });
      window.dispatchEvent(event);
    } else if (resourceType) {
      // Show error message for incompatible resource type
      console.warn(
        `❌ Cannot add ${resourceType} to ${data.resourceType} (${label}). ` +
        `Valid children: ${CONTAINER_RULES[data.resourceType]?.join(', ') || 'none'}`
      );
    }

    setIsDragOver(false);
    setCanDrop(false);
  };

  return (
    <div
      className="container-node nodrag"
      style={{
        ...containerStyles,
        borderRadius: '8px',
        position: 'relative',
        boxShadow: selected
          ? '0 0 0 2px #1976d2'
          : isDragOver && canDrop
            ? '0 0 0 3px #4caf50'
            : isDragOver && !canDrop
              ? '0 0 0 3px #f44336'
              : 'none',
        backgroundColor: isDragOver && canDrop
          ? containerStyles.backgroundColor?.replace('0.05', '0.15')
          : containerStyles.backgroundColor,
        transition: 'all 0.2s ease',
        // Enable pointer events - child nodes are on top due to higher z-index
        pointerEvents: 'auto',
        // Ensure the container actually takes up space
        width: '100%',
        height: '100%',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555', width: '12px', height: '12px' }}
      />

      {/* Container Header */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderBottom: `2px solid ${containerStyles.border?.split(' ')[2] || '#ccc'}`,
          borderRadius: '8px 8px 0 0',
          padding: '10px 15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'auto', // Enable clicks on header
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>{icon}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>
              {label}
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              {displayName}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Contained resources count */}
          <div
            style={{
              backgroundColor: '#f0f0f0',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#666',
            }}
          >
            {containedCount} {containedCount === 1 ? 'resource' : 'resources'}
          </div>

          {/* Status indicator */}
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor:
                status === 'created' ? '#4caf50' :
                status === 'error' ? '#f44336' :
                status === 'planning' ? '#ff9800' :
                '#9e9e9e',
            }}
            title={status}
          />
        </div>
      </div>

      {/* Configuration Details */}
      <div
        style={{
          position: 'absolute',
          top: '52px',
          left: '15px',
          fontSize: '11px',
          color: '#666',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '5px 10px',
          borderRadius: '4px',
          display: 'flex',
          gap: '15px',
          pointerEvents: 'auto', // Enable events on config details
        }}
      >
        {resourceType === 'aws_vpc' && configuration.cidr_block && (
          <span>
            <strong>CIDR:</strong> {configuration.cidr_block}
          </span>
        )}
        {resourceType === 'aws_subnet' && (
          <>
            {configuration.cidr_block && (
              <span>
                <strong>CIDR:</strong> {configuration.cidr_block}
              </span>
            )}
            {configuration.availability_zone && (
              <span>
                <strong>AZ:</strong> {configuration.availability_zone}
              </span>
            )}
            {configuration.map_public_ip_on_launch !== undefined && (
              <span>
                <strong>Type:</strong> {configuration.map_public_ip_on_launch ? 'Public' : 'Private'}
              </span>
            )}
          </>
        )}
        {resourceType === 'aws_autoscaling_group' && (
          <>
            {configuration.min_size !== undefined && (
              <span>
                <strong>Min:</strong> {configuration.min_size}
              </span>
            )}
            {configuration.max_size !== undefined && (
              <span>
                <strong>Max:</strong> {configuration.max_size}
              </span>
            )}
            {configuration.desired_capacity !== undefined && (
              <span>
                <strong>Desired:</strong> {configuration.desired_capacity}
              </span>
            )}
          </>
        )}
      </div>

      {/* Child nodes will be rendered inside this container by ReactFlow */}
      <div style={{ minHeight: '200px' }} />

      {/* Add Resource Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          // Trigger add resource modal with this container as parent
          const event = new CustomEvent('addResourceToContainer', {
            detail: { parentId: resource.id, parentType: resourceType },
          });
          window.dispatchEvent(event);
        }}
        onMouseDown={(e) => {
          e.stopPropagation(); // Also stop on mouse down
        }}
        style={{
          position: 'absolute',
          bottom: '15px',
          right: '15px',
          padding: '8px 16px',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          transition: 'all 0.2s',
          pointerEvents: 'auto', // CRITICAL: Enable clicks on button
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#1565c0';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#1976d2';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        title={`Add resource to ${label}`}
      >
        <span style={{ fontSize: '16px' }}>+</span>
        <span>Add Resource</span>
      </button>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555', width: '12px', height: '12px' }}
      />
    </div>
  );
};

export default ContainerNode;
