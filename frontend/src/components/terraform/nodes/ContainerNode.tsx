/**
 * Container Node Component
 * Displays cloud resources that can contain other resources (VPC, Subnet, etc.)
 */
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { getResourceIcon, getResourceDisplayName } from '../../../types/terraform';

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

  // Get container-specific styles based on type
  const getContainerStyles = () => {
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

  return (
    <div
      className="container-node"
      style={{
        ...containerStyles,
        borderRadius: '8px',
        position: 'relative',
        boxShadow: selected ? '0 0 0 2px #1976d2' : 'none',
      }}
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
          // Trigger add resource modal with this container as parent
          const event = new CustomEvent('addResourceToContainer', {
            detail: { parentId: resource.id, parentType: resourceType },
          });
          window.dispatchEvent(event);
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
