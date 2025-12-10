/**
 * Load Balancer Configuration
 * Configures AWS Application/Network Load Balancers including listeners, target groups, and health checks
 */
import React, { useState } from 'react';
import { TerraformResource } from '../../../types/terraform';
import { useAppSelector } from '../../../store/hooks';
import { selectCurrentProject } from '../../../store/terraformSlice';

interface LoadBalancerConfigProps {
  resourceType: string;
  config: Record<string, any>;
  onUpdate: (config: Record<string, any>) => void;
}

interface Listener {
  protocol: string;
  port: number;
  default_action?: {
    type: string;
    target_group_arn?: string;
    redirect?: {
      protocol: string;
      port: string;
      status_code: string;
    };
  };
  ssl_policy?: string;
  certificate_arn?: string;
}

interface TargetGroup {
  name: string;
  port: number;
  protocol: string;
  vpc_id?: string;
  health_check?: {
    enabled: boolean;
    interval: number;
    path?: string;
    port?: string;
    protocol: string;
    timeout: number;
    healthy_threshold: number;
    unhealthy_threshold: number;
    matcher?: string;
  };
  deregistration_delay?: number;
  stickiness?: {
    enabled: boolean;
    type: string;
    cookie_duration?: number;
  };
}

const LoadBalancerConfig: React.FC<LoadBalancerConfigProps> = ({
  resourceType,
  config,
  onUpdate,
}) => {
  const currentProject = useAppSelector(selectCurrentProject);
  const [activeTab, setActiveTab] = useState<'general' | 'listeners' | 'target_groups'>('general');

  const isALB = resourceType === 'aws_alb' || config.load_balancer_type === 'application';
  const isNLB = config.load_balancer_type === 'network';

  // Get all subnets for subnet selection
  const subnets = currentProject?.resources.filter(
    (r) => r.resource_type === 'aws_subnet'
  ) || [];

  const updateConfig = (updates: Record<string, any>) => {
    onUpdate({ ...config, ...updates });
  };

  const renderGeneral = () => (
    <div className="space-y-4">
      {/* Load Balancer Type */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Load Balancer Type
        </label>
        <select
          value={config.load_balancer_type || 'application'}
          onChange={(e) => updateConfig({ load_balancer_type: e.target.value })}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="application">Application Load Balancer (ALB)</option>
          <option value="network">Network Load Balancer (NLB)</option>
        </select>
      </div>

      {/* Internal/External */}
      <div>
        <label className="flex items-center text-sm text-gray-700">
          <input
            type="checkbox"
            checked={config.internal || false}
            onChange={(e) => updateConfig({ internal: e.target.checked })}
            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Internal (private load balancer)
        </label>
        <p className="text-xs text-gray-500 mt-1 ml-6">
          {config.internal
            ? 'Only accessible within VPC'
            : 'Publicly accessible via internet'}
        </p>
      </div>

      {/* IP Address Type */}
      {isALB && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            IP Address Type
          </label>
          <select
            value={config.ip_address_type || 'ipv4'}
            onChange={(e) => updateConfig({ ip_address_type: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="ipv4">IPv4</option>
            <option value="dualstack">Dual Stack (IPv4 + IPv6)</option>
          </select>
        </div>
      )}

      {/* Enable Deletion Protection */}
      <div>
        <label className="flex items-center text-sm text-gray-700">
          <input
            type="checkbox"
            checked={config.enable_deletion_protection || false}
            onChange={(e) => updateConfig({ enable_deletion_protection: e.target.checked })}
            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Enable deletion protection
        </label>
      </div>

      {/* Enable Cross-Zone Load Balancing */}
      <div>
        <label className="flex items-center text-sm text-gray-700">
          <input
            type="checkbox"
            checked={config.enable_cross_zone_load_balancing !== false}
            onChange={(e) => updateConfig({ enable_cross_zone_load_balancing: e.target.checked })}
            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Enable cross-zone load balancing
        </label>
      </div>

      {/* ALB-specific settings */}
      {isALB && (
        <>
          <div>
            <label className="flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                checked={config.enable_http2 !== false}
                onChange={(e) => updateConfig({ enable_http2: e.target.checked })}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Enable HTTP/2
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Idle Timeout (seconds)
            </label>
            <input
              type="number"
              value={config.idle_timeout || 60}
              onChange={(e) => updateConfig({ idle_timeout: parseInt(e.target.value) })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              min="1"
              max="4000"
            />
          </div>
        </>
      )}

      {/* Subnets */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Subnets (select at least 2 in different AZs)
        </label>
        <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-2">
          {subnets.length === 0 ? (
            <p className="text-xs text-gray-500">No subnets available</p>
          ) : (
            subnets.map((subnet) => (
              <label key={subnet.id} className="flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={(config.subnets || []).includes(`\${aws_subnet.${subnet.resource_name}.id}`)}
                  onChange={(e) => {
                    const subnetRef = `\${aws_subnet.${subnet.resource_name}.id}`;
                    const currentSubnets = config.subnets || [];
                    const newSubnets = e.target.checked
                      ? [...currentSubnets, subnetRef]
                      : currentSubnets.filter((s: string) => s !== subnetRef);
                    updateConfig({ subnets: newSubnets });
                  }}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="flex-1">
                  {subnet.resource_name}
                  {subnet.configuration.availability_zone && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({subnet.configuration.availability_zone})
                    </span>
                  )}
                </span>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Name Tag
        </label>
        <input
          type="text"
          value={config.tags?.Name || ''}
          onChange={(e) =>
            updateConfig({
              tags: { ...(config.tags || {}), Name: e.target.value },
            })
          }
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          placeholder="my-load-balancer"
        />
      </div>
    </div>
  );

  const renderListeners = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-700 mb-4">
        <p className="font-medium mb-2">Common Listener Configurations:</p>
        <div className="space-y-2">
          <button
            onClick={() => {
              updateConfig({
                ...config,
                listener_http: {
                  protocol: 'HTTP',
                  port: 80,
                  default_action: { type: 'forward' },
                },
              });
            }}
            className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-xs"
          >
            <strong>HTTP (80)</strong> - Standard web traffic
          </button>
          <button
            onClick={() => {
              updateConfig({
                ...config,
                listener_https: {
                  protocol: 'HTTPS',
                  port: 443,
                  ssl_policy: 'ELBSecurityPolicy-2016-08',
                  default_action: { type: 'forward' },
                },
              });
            }}
            className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-xs"
          >
            <strong>HTTPS (443)</strong> - Secure web traffic (requires SSL certificate)
          </button>
          <button
            onClick={() => {
              updateConfig({
                ...config,
                listener_http_redirect: {
                  protocol: 'HTTP',
                  port: 80,
                  default_action: {
                    type: 'redirect',
                    redirect: {
                      protocol: 'HTTPS',
                      port: '443',
                      status_code: 'HTTP_301',
                    },
                  },
                },
              });
            }}
            className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-xs"
          >
            <strong>HTTP → HTTPS Redirect</strong> - Force secure connections
          </button>
        </div>
      </div>

      {config.listener_https && (
        <div className="border-t border-gray-200 pt-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            SSL Certificate ARN
          </label>
          <input
            type="text"
            value={config.listener_https.certificate_arn || ''}
            onChange={(e) =>
              updateConfig({
                listener_https: {
                  ...config.listener_https,
                  certificate_arn: e.target.value,
                },
              })
            }
            className="w-full px-2 py-1.5 text-sm font-mono border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            placeholder="arn:aws:acm:region:account:certificate/xxx"
          />
          <p className="text-xs text-gray-500 mt-1">
            Required for HTTPS. Get from AWS Certificate Manager (ACM)
          </p>
        </div>
      )}
    </div>
  );

  const renderTargetGroups = () => (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800">
        💡 Target groups are typically created as separate <code>aws_lb_target_group</code> resources
        and attached to listeners.
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Target Type
          </label>
          <select
            value={config.target_type || 'instance'}
            onChange={(e) => updateConfig({ target_type: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="instance">Instance (EC2 instances)</option>
            <option value="ip">IP addresses</option>
            <option value="lambda">Lambda function</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Health Check Path {isALB && '(ALB only)'}
          </label>
          <input
            type="text"
            value={config.health_check_path || '/'}
            onChange={(e) => updateConfig({ health_check_path: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            placeholder="/"
            disabled={!isALB}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Health Check Interval (sec)
            </label>
            <input
              type="number"
              value={config.health_check_interval || 30}
              onChange={(e) => updateConfig({ health_check_interval: parseInt(e.target.value) })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              min="5"
              max="300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Timeout (sec)
            </label>
            <input
              type="number"
              value={config.health_check_timeout || 5}
              onChange={(e) => updateConfig({ health_check_timeout: parseInt(e.target.value) })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              min="2"
              max="120"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Healthy Threshold
            </label>
            <input
              type="number"
              value={config.healthy_threshold || 3}
              onChange={(e) => updateConfig({ healthy_threshold: parseInt(e.target.value) })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              min="2"
              max="10"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Unhealthy Threshold
            </label>
            <input
              type="number"
              value={config.unhealthy_threshold || 3}
              onChange={(e) => updateConfig({ unhealthy_threshold: parseInt(e.target.value) })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              min="2"
              max="10"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('listeners')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'listeners'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Listeners
        </button>
        <button
          onClick={() => setActiveTab('target_groups')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'target_groups'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Target Groups
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'general' && renderGeneral()}
        {activeTab === 'listeners' && renderListeners()}
        {activeTab === 'target_groups' && renderTargetGroups()}
      </div>
    </div>
  );
};

export default LoadBalancerConfig;
