/**
 * Add Child Resource Modal
 * Shows valid child resources that can be added to a parent container
 */
import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { createResource, fetchProjectDetail } from '../../store/terraformSlice';
import {
  CONTAINER_RULES,
  getResourceDisplayName,
  getResourceIcon,
  TerraformResource,
} from '../../types/terraform';

interface AddChildResourceModalProps {
  projectId: string;
  onClose: () => void;
}

interface ResourceOption {
  type: string;
  name: string;
  icon: string;
  description: string;
}

const AddChildResourceModal: React.FC<AddChildResourceModalProps> = ({ projectId, onClose }) => {
  const dispatch = useAppDispatch();

  const [isOpen, setIsOpen] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  const [parentType, setParentType] = useState<string | null>(null);
  const [selectedResourceType, setSelectedResourceType] = useState<string>('');
  const [resourceName, setResourceName] = useState('');
  const [configuration, setConfiguration] = useState<Record<string, any>>({});
  const [availableZones] = useState(['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d']);

  // Listen for add resource events from container nodes
  useEffect(() => {
    const handleAddResource = (event: CustomEvent) => {
      const { parentId, parentType, preselectedType } = event.detail;
      setParentId(parentId);
      setParentType(parentType);
      setIsOpen(true);

      // If a resource type was preselected (from drag-and-drop), set it
      if (preselectedType) {
        setSelectedResourceType(preselectedType);
      } else {
        setSelectedResourceType('');
      }

      setResourceName('');
      setConfiguration({});
    };

    window.addEventListener('addResourceToContainer', handleAddResource as EventListener);
    return () => {
      window.removeEventListener('addResourceToContainer', handleAddResource as EventListener);
    };
  }, []);

  // Get valid child resource types for the parent
  const validChildTypes = parentType ? CONTAINER_RULES[parentType] || [] : [];

  // Define resource options with descriptions
  const resourceOptions: Record<string, ResourceOption> = {
    // VPC children
    'aws_subnet': {
      type: 'aws_subnet',
      name: 'Subnet',
      icon: '🔷',
      description: 'Logical subdivision of an IP network',
    },
    'aws_internet_gateway': {
      type: 'aws_internet_gateway',
      name: 'Internet Gateway',
      icon: '🌍',
      description: 'Allows communication between VPC and the internet',
    },
    'aws_nat_gateway': {
      type: 'aws_nat_gateway',
      name: 'NAT Gateway',
      icon: '🔀',
      description: 'Enables private subnets to access the internet',
    },
    'aws_vpn_gateway': {
      type: 'aws_vpn_gateway',
      name: 'VPN Gateway',
      icon: '🔐',
      description: 'Virtual private gateway for VPN connections',
    },
    'aws_security_group': {
      type: 'aws_security_group',
      name: 'Security Group',
      icon: '🛡️',
      description: 'Virtual firewall for controlling traffic',
    },
    // Subnet children
    'aws_instance': {
      type: 'aws_instance',
      name: 'EC2 Instance',
      icon: '🖥️',
      description: 'Virtual server in the cloud',
    },
    'aws_db_instance': {
      type: 'aws_db_instance',
      name: 'RDS Database',
      icon: '🗄️',
      description: 'Managed relational database service',
    },
    'aws_elasticache_cluster': {
      type: 'aws_elasticache_cluster',
      name: 'ElastiCache Cluster',
      icon: '⚡',
      description: 'In-memory caching service',
    },
    'aws_lambda_function': {
      type: 'aws_lambda_function',
      name: 'Lambda Function',
      icon: 'λ',
      description: 'Serverless compute service',
    },
    'aws_efs_mount_target': {
      type: 'aws_efs_mount_target',
      name: 'EFS Mount Target',
      icon: '💾',
      description: 'Elastic File System mount point',
    },
    // ASG children
    // ECS children
    'aws_ecs_service': {
      type: 'aws_ecs_service',
      name: 'ECS Service',
      icon: '🐳',
      description: 'Container orchestration service',
    },
    'aws_ecs_task_definition': {
      type: 'aws_ecs_task_definition',
      name: 'ECS Task Definition',
      icon: '📋',
      description: 'Blueprint for running containers',
    },
  };

  const availableResources = validChildTypes
    .map(type => resourceOptions[type])
    .filter(Boolean);

  const handleClose = () => {
    setIsOpen(false);
    setParentId(null);
    setParentType(null);
    setSelectedResourceType('');
    setResourceName('');
    setConfiguration({});
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const resourceData = {
      project: projectId,
      resource_type: selectedResourceType,
      resource_name: resourceName,
      parent_resource: parentId,
      terraform_address: `${selectedResourceType}.${resourceName.replace(/[^a-zA-Z0-9_]/g, '_')}`,
      configuration,
    };

    console.log('Creating resource:', resourceData);

    try {
      // Dispatch create action
      await dispatch(createResource(resourceData)).unwrap();

      // Refresh project data to get updated hierarchy
      await dispatch(fetchProjectDetail(projectId)).unwrap();

      handleClose();
    } catch (error) {
      console.error('Failed to create resource:', error);
      // TODO: Show error notification to user
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
            Add Resource to {getResourceDisplayName(parentType || '')}
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ×
          </button>
        </div>

        {availableResources.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            No resources can be added to this container.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Resource Type Selection */}
            {!selectedResourceType ? (
              <div>
                <p style={{ marginBottom: '16px', color: '#666' }}>
                  Select the type of resource to add:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                  {availableResources.map((resource) => (
                    <button
                      key={resource.type}
                      type="button"
                      onClick={() => setSelectedResourceType(resource.type)}
                      style={{
                        padding: '16px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#1976d2';
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e0e0e0';
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '24px' }}>{resource.icon}</span>
                        <strong style={{ fontSize: '16px' }}>{resource.name}</strong>
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {resource.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedResourceType('');
                    setConfiguration({});
                  }}
                  style={{
                    marginBottom: '16px',
                    padding: '6px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  ← Back to resource selection
                </button>

                {/* Selected resource display */}
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '6px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{resourceOptions[selectedResourceType]?.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {resourceOptions[selectedResourceType]?.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {resourceOptions[selectedResourceType]?.description}
                    </div>
                  </div>
                </div>

                {/* Resource Name */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                    Resource Name <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={resourceName}
                    onChange={(e) => setResourceName(e.target.value)}
                    placeholder="e.g., web-server, public-subnet"
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                </div>

                {/* Configuration fields based on resource type */}
                {selectedResourceType === 'aws_subnet' && (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                        CIDR Block <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={configuration.cidr_block || ''}
                        onChange={(e) => setConfiguration({ ...configuration, cidr_block: e.target.value })}
                        placeholder="10.0.1.0/24"
                        required
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                        Availability Zone
                      </label>
                      <select
                        value={configuration.availability_zone || ''}
                        onChange={(e) => setConfiguration({ ...configuration, availability_zone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      >
                        <option value="">Select AZ...</option>
                        {availableZones.map(az => (
                          <option key={az} value={az}>{az}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={configuration.map_public_ip_on_launch || false}
                          onChange={(e) => setConfiguration({
                            ...configuration,
                            map_public_ip_on_launch: e.target.checked
                          })}
                        />
                        <span>Map public IP on launch (Public Subnet)</span>
                      </label>
                    </div>
                  </>
                )}

                {selectedResourceType === 'aws_instance' && (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                        Instance Type <span style={{ color: 'red' }}>*</span>
                      </label>
                      <select
                        value={configuration.instance_type || ''}
                        onChange={(e) => setConfiguration({ ...configuration, instance_type: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      >
                        <option value="">Select type...</option>
                        <option value="t3.micro">t3.micro (1 vCPU, 1 GB RAM)</option>
                        <option value="t3.small">t3.small (2 vCPU, 2 GB RAM)</option>
                        <option value="t3.medium">t3.medium (2 vCPU, 4 GB RAM)</option>
                        <option value="t3.large">t3.large (2 vCPU, 8 GB RAM)</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                        AMI ID <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={configuration.ami || ''}
                        onChange={(e) => setConfiguration({ ...configuration, ami: e.target.value })}
                        placeholder="ami-12345678"
                        required
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  </>
                )}

                {selectedResourceType === 'aws_db_instance' && (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                        Database Engine <span style={{ color: 'red' }}>*</span>
                      </label>
                      <select
                        value={configuration.engine || ''}
                        onChange={(e) => setConfiguration({ ...configuration, engine: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      >
                        <option value="">Select engine...</option>
                        <option value="postgres">PostgreSQL</option>
                        <option value="mysql">MySQL</option>
                        <option value="mariadb">MariaDB</option>
                        <option value="oracle-se2">Oracle SE2</option>
                        <option value="sqlserver-ex">SQL Server Express</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                        Instance Class <span style={{ color: 'red' }}>*</span>
                      </label>
                      <select
                        value={configuration.instance_class || ''}
                        onChange={(e) => setConfiguration({ ...configuration, instance_class: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      >
                        <option value="">Select class...</option>
                        <option value="db.t3.micro">db.t3.micro</option>
                        <option value="db.t3.small">db.t3.small</option>
                        <option value="db.t3.medium">db.t3.medium</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Submit buttons */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="submit"
                    disabled={!resourceName}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: resourceName ? '#1976d2' : '#ccc',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: 500,
                      cursor: resourceName ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Create Resource
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: 'white',
                      color: '#666',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '16px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default AddChildResourceModal;
