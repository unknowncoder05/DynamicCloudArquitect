/**
 * Add Root Resource Button
 * Floating button to add root-level resources (VPCs, S3 buckets, etc.)
 */
import React, { useState } from 'react';
import { getResourceDisplayName, getResourceIcon } from '../../types/terraform';

interface AddRootResourceButtonProps {
  projectId: string;
  onAddResource: (resourceType: string) => void;
}

const AddRootResourceButton: React.FC<AddRootResourceButtonProps> = ({
  projectId,
  onAddResource,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const rootResources = [
    {
      type: 'aws_vpc',
      name: 'VPC',
      icon: '🌐',
      description: 'Virtual Private Cloud - isolated network',
    },
    {
      type: 'aws_s3_bucket',
      name: 'S3 Bucket',
      icon: '🪣',
      description: 'Object storage service',
    },
    {
      type: 'aws_dynamodb_table',
      name: 'DynamoDB Table',
      icon: '📊',
      description: 'NoSQL database service',
    },
    {
      type: 'aws_iam_role',
      name: 'IAM Role',
      icon: '👤',
      description: 'Identity and access management',
    },
    {
      type: 'aws_cloudfront_distribution',
      name: 'CloudFront Distribution',
      icon: '🌩️',
      description: 'Content delivery network',
    },
    {
      type: 'aws_route53_zone',
      name: 'Route53 Zone',
      icon: '🌐',
      description: 'DNS service',
    },
  ];

  return (
    <div style={{ position: 'relative' }}>
      {/* Main button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          fontSize: '28px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.backgroundColor = '#1565c0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.backgroundColor = '#1976d2';
        }}
        title="Add Resource"
      >
        {showMenu ? '×' : '+'}
      </button>

      {/* Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowMenu(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99,
            }}
          />

          {/* Menu panel */}
          <div
            style={{
              position: 'fixed',
              bottom: '100px',
              right: '30px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              padding: '16px',
              minWidth: '320px',
              maxWidth: '400px',
              zIndex: 101,
            }}
          >
            <div style={{ marginBottom: '12px', fontWeight: 600, fontSize: '16px', color: '#333' }}>
              Add Root Resource
            </div>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
              These resources can be created at the top level:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rootResources.map((resource) => (
                <button
                  key={resource.type}
                  onClick={() => {
                    onAddResource(resource.type);
                    setShowMenu(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                    e.currentTarget.style.borderColor = '#1976d2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#e0e0e0';
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{resource.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '2px' }}>
                      {resource.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {resource.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AddRootResourceButton;
