/**
 * Component Palette
 * Searchable palette of Terraform resources for drag-and-drop
 */
import React, { useState } from 'react';
import { useAppDispatch } from '../../../store/hooks';
import { createResource } from '../../../store/terraformSlice';

interface ResourceTemplate {
  type: string;
  name: string;
  icon: string;
  category: string;
  defaultConfig: Record<string, any>;
}

const awsResourceTemplates: ResourceTemplate[] = [
  // Compute
  {
    type: 'aws_instance',
    name: 'EC2 Instance',
    icon: '🖥️',
    category: 'Compute',
    defaultConfig: {
      instance_type: 't2.micro',
      ami: 'ami-0c55b159cbfafe1f0',
    },
  },
  {
    type: 'aws_lambda_function',
    name: 'Lambda Function',
    icon: 'λ',
    category: 'Compute',
    defaultConfig: {
      runtime: 'python3.9',
      handler: 'index.handler',
      memory_size: 128,
      timeout: 3,
    },
  },

  // Networking
  {
    type: 'aws_vpc',
    name: 'VPC',
    icon: '🌐',
    category: 'Networking',
    defaultConfig: {
      cidr_block: '10.0.0.0/16',
      enable_dns_hostnames: true,
      enable_dns_support: true,
    },
  },
  {
    type: 'aws_subnet',
    name: 'Subnet',
    icon: '🔷',
    category: 'Networking',
    defaultConfig: {
      cidr_block: '10.0.1.0/24',
    },
  },
  {
    type: 'aws_security_group',
    name: 'Security Group',
    icon: '🛡️',
    category: 'Networking',
    defaultConfig: {
      description: 'Managed by Terraform',
      ingress: [],
      egress: [],
    },
  },

  // Storage
  {
    type: 'aws_s3_bucket',
    name: 'S3 Bucket',
    icon: '🪣',
    category: 'Storage',
    defaultConfig: {
      acl: 'private',
    },
  },
  {
    type: 'aws_ebs_volume',
    name: 'EBS Volume',
    icon: '💾',
    category: 'Storage',
    defaultConfig: {
      size: 10,
      type: 'gp3',
    },
  },

  // Database
  {
    type: 'aws_db_instance',
    name: 'RDS Instance',
    icon: '🗄️',
    category: 'Database',
    defaultConfig: {
      engine: 'mysql',
      engine_version: '8.0',
      instance_class: 'db.t3.micro',
      allocated_storage: 20,
    },
  },
  {
    type: 'aws_dynamodb_table',
    name: 'DynamoDB Table',
    icon: '📊',
    category: 'Database',
    defaultConfig: {
      billing_mode: 'PAY_PER_REQUEST',
      hash_key: 'id',
    },
  },

  // Load Balancing
  {
    type: 'aws_lb',
    name: 'Load Balancer',
    icon: '⚖️',
    category: 'Load Balancing',
    defaultConfig: {
      load_balancer_type: 'application',
      internal: false,
    },
  },
];

interface ComponentPaletteProps {
  projectId: string;
}

const ComponentPalette: React.FC<ComponentPaletteProps> = ({ projectId }) => {
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(
    new Set(awsResourceTemplates.map((r) => r.category))
  ).sort();

  const filteredResources = awsResourceTemplates.filter((resource) => {
    const matchesSearch =
      searchQuery === '' ||
      resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === null || resource.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleAddResource = async (template: ResourceTemplate) => {
    const resourceName = `${template.type.split('_').pop()}_${Date.now()}`;

    try {
      await dispatch(
        createResource({
          project: projectId,
          resource_type: template.type,
          resource_name: resourceName,
          terraform_address: `${template.type}.${resourceName}`,
          configuration: template.defaultConfig,
          metadata: {
            position: { x: 100, y: 100 }, // Center or random position
          },
        })
      ).unwrap();
    } catch (err) {
      console.error('Failed to create resource:', err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Resource Palette
        </h3>

        {/* Search */}
        <input
          type="text"
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Categories */}
      <div className="px-4 py-2 border-b border-gray-200 overflow-x-auto">
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Resources List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredResources.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            No resources found
          </div>
        ) : (
          <div className="space-y-2">
            {filteredResources.map((resource) => (
              <button
                key={resource.type}
                onClick={() => handleAddResource(resource)}
                className="w-full text-left bg-white hover:bg-blue-50 border border-gray-200 rounded-lg p-3 transition-colors group"
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{resource.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 truncate">
                      {resource.name}
                    </div>
                    <div className="text-xs text-gray-500 font-mono truncate">
                      {resource.type}
                    </div>
                  </div>
                  <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    +
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 text-xs text-gray-500">
        <p>Click to add resource to canvas</p>
      </div>
    </div>
  );
};

export default ComponentPalette;
