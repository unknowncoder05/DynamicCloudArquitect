/**
 * Security Group Rules Editor
 * Allows adding/editing ingress and egress rules for AWS security groups
 */
import React, { useState } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { selectCurrentProject } from '../../../store/terraformSlice';
import { TerraformResource } from '../../../types/terraform';

interface SecurityGroupRule {
  protocol: string;
  from_port?: number;
  to_port?: number;
  cidr_blocks?: string[];
  ipv6_cidr_blocks?: string[];
  security_groups?: string[];
  self?: boolean;
  description?: string;
}

interface SecurityGroupRulesEditorProps {
  config: Record<string, any>;
  onUpdate: (config: Record<string, any>) => void;
  currentResourceId?: string;  // To exclude current SG from the list
}

const SecurityGroupRulesEditor: React.FC<SecurityGroupRulesEditorProps> = ({
  config,
  onUpdate,
  currentResourceId,
}) => {
  const [activeTab, setActiveTab] = useState<'ingress' | 'egress'>('ingress');
  const currentProject = useAppSelector(selectCurrentProject);

  const ingressRules: SecurityGroupRule[] = config?.ingress || [];
  const egressRules: SecurityGroupRule[] = config?.egress || [];

  // Get all security groups in the project (excluding current one)
  const availableSecurityGroups = currentProject?.resources.filter(
    r => r.resource_type === 'aws_security_group' && r.id !== currentResourceId
  ) || [];

  const addRule = (type: 'ingress' | 'egress') => {
    const newRule: SecurityGroupRule = {
      protocol: 'tcp',
      from_port: 80,
      to_port: 80,
      cidr_blocks: ['0.0.0.0/0'],
      description: '',
    };

    const rules = type === 'ingress' ? [...ingressRules] : [...egressRules];
    rules.push(newRule);

    onUpdate({
      ...config,
      [type]: rules,
    });
  };

  const updateRule = (
    type: 'ingress' | 'egress',
    index: number,
    field: keyof SecurityGroupRule,
    value: any
  ) => {
    const rules = type === 'ingress' ? [...ingressRules] : [...egressRules];
    rules[index] = { ...rules[index], [field]: value };

    onUpdate({
      ...config,
      [type]: rules,
    });
  };

  const deleteRule = (type: 'ingress' | 'egress', index: number) => {
    const rules = type === 'ingress' ? [...ingressRules] : [...egressRules];
    rules.splice(index, 1);

    onUpdate({
      ...config,
      [type]: rules,
    });
  };

  const renderRule = (rule: SecurityGroupRule, index: number, type: 'ingress' | 'egress') => (
    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3 bg-gray-50">
      {/* Protocol and Ports */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Protocol
          </label>
          <select
            value={rule.protocol}
            onChange={(e) => updateRule(type, index, 'protocol', e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="tcp">TCP</option>
            <option value="udp">UDP</option>
            <option value="icmp">ICMP</option>
            <option value="-1">All</option>
          </select>
        </div>

        {rule.protocol !== '-1' && rule.protocol !== 'icmp' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                From Port
              </label>
              <input
                type="number"
                value={rule.from_port || ''}
                onChange={(e) => updateRule(type, index, 'from_port', parseInt(e.target.value))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                To Port
              </label>
              <input
                type="number"
                value={rule.to_port || ''}
                onChange={(e) => updateRule(type, index, 'to_port', parseInt(e.target.value))}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="65535"
              />
            </div>
          </>
        )}
      </div>

      {/* Source/Destination - CIDR Blocks */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {type === 'ingress' ? 'Source' : 'Destination'} CIDR Blocks
        </label>
        <input
          type="text"
          value={rule.cidr_blocks?.join(', ') || ''}
          onChange={(e) =>
            updateRule(
              type,
              index,
              'cidr_blocks',
              e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
            )
          }
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          placeholder="0.0.0.0/0, 10.0.0.0/8"
        />
        <p className="text-xs text-gray-500 mt-1">Comma-separated CIDR blocks</p>
      </div>

      {/* Source/Destination - Security Groups */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 mb-2">
          {type === 'ingress' ? 'Source' : 'Destination'} Security Groups
        </label>
        <div className="space-y-2">
          {availableSecurityGroups.length > 0 ? (
            availableSecurityGroups.map((sg) => (
              <label key={sg.id} className="flex items-center text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={rule.security_groups?.includes(sg.id) || false}
                  onChange={(e) => {
                    const currentSGs = rule.security_groups || [];
                    const newSGs = e.target.checked
                      ? [...currentSGs, sg.id]
                      : currentSGs.filter(id => id !== sg.id);
                    updateRule(type, index, 'security_groups', newSGs);
                  }}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <span className="font-medium">{sg.resource_name}</span>
                  {sg.configuration?.name && (
                    <span className="text-gray-500">({sg.configuration.name})</span>
                  )}
                </div>
              </label>
            ))
          ) : (
            <p className="text-xs text-gray-500 italic">
              No other security groups available in this project
            </p>
          )}
        </div>
        {rule.security_groups && rule.security_groups.length > 0 && (
          <p className="text-xs text-blue-600 mt-2">
            ✓ {rule.security_groups.length} security group{rule.security_groups.length > 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Allow from self */}
      <div className="mb-3">
        <label className="flex items-center text-sm text-gray-700">
          <input
            type="checkbox"
            checked={rule.self || false}
            onChange={(e) => updateRule(type, index, 'self', e.target.checked)}
            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Allow from this security group (self)</span>
        </label>
      </div>

      {/* Description */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          type="text"
          value={rule.description || ''}
          onChange={(e) => updateRule(type, index, 'description', e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          placeholder="Rule description"
        />
      </div>

      {/* Delete Button */}
      <button
        onClick={() => deleteRule(type, index)}
        className="w-full text-sm text-red-600 hover:text-red-700 font-medium"
      >
        Delete Rule
      </button>
    </div>
  );

  const currentRules = activeTab === 'ingress' ? ingressRules : egressRules;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('ingress')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'ingress'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Ingress Rules ({ingressRules.length})
        </button>
        <button
          onClick={() => setActiveTab('egress')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'egress'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Egress Rules ({egressRules.length})
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {currentRules.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            No {activeTab} rules configured.
          </div>
        ) : (
          currentRules.map((rule, index) => renderRule(rule, index, activeTab))
        )}
      </div>

      {/* Add Rule Button */}
      <button
        onClick={() => addRule(activeTab)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        + Add {activeTab === 'ingress' ? 'Ingress' : 'Egress'} Rule
      </button>

      {/* Common Presets */}
      <div className="border-t border-gray-200 pt-4">
        <p className="text-xs font-medium text-gray-700 mb-2">
          Quick Presets {activeTab === 'ingress' ? '(Ingress)' : '(Egress)'}:
        </p>
        <div className="flex flex-wrap gap-2">
          {activeTab === 'ingress' ? (
            <>
              <button
                onClick={() => {
                  const rule: SecurityGroupRule = {
                    protocol: 'tcp',
                    from_port: 22,
                    to_port: 22,
                    cidr_blocks: ['0.0.0.0/0'],
                    description: 'SSH access',
                  };
                  const rules = [...ingressRules, rule];
                  onUpdate({ ...config, ingress: rules });
                }}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
              >
                SSH (22)
              </button>
              <button
                onClick={() => {
                  const rule: SecurityGroupRule = {
                    protocol: 'tcp',
                    from_port: 80,
                    to_port: 80,
                    cidr_blocks: ['0.0.0.0/0'],
                    description: 'HTTP access',
                  };
                  const rules = [...ingressRules, rule];
                  onUpdate({ ...config, ingress: rules });
                }}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
              >
                HTTP (80)
              </button>
              <button
                onClick={() => {
                  const rule: SecurityGroupRule = {
                    protocol: 'tcp',
                    from_port: 443,
                    to_port: 443,
                    cidr_blocks: ['0.0.0.0/0'],
                    description: 'HTTPS access',
                  };
                  const rules = [...ingressRules, rule];
                  onUpdate({ ...config, ingress: rules });
                }}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
              >
                HTTPS (443)
              </button>
              <button
                onClick={() => {
                  const rule: SecurityGroupRule = {
                    protocol: 'tcp',
                    from_port: 3306,
                    to_port: 3306,
                    cidr_blocks: ['10.0.0.0/8'],
                    description: 'MySQL/Aurora',
                  };
                  const rules = [...ingressRules, rule];
                  onUpdate({ ...config, ingress: rules });
                }}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
              >
                MySQL (3306)
              </button>
              <button
                onClick={() => {
                  const rule: SecurityGroupRule = {
                    protocol: 'tcp',
                    from_port: 5432,
                    to_port: 5432,
                    cidr_blocks: ['10.0.0.0/8'],
                    description: 'PostgreSQL',
                  };
                  const rules = [...ingressRules, rule];
                  onUpdate({ ...config, ingress: rules });
                }}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
              >
                PostgreSQL (5432)
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  const rule: SecurityGroupRule = {
                    protocol: '-1',
                    cidr_blocks: ['0.0.0.0/0'],
                    description: 'Allow all outbound traffic',
                  };
                  const rules = [...egressRules, rule];
                  onUpdate({ ...config, egress: rules });
                }}
                className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded font-medium"
              >
                ✓ Allow All Outbound (Default)
              </button>
              <button
                onClick={() => {
                  const rule: SecurityGroupRule = {
                    protocol: 'tcp',
                    from_port: 443,
                    to_port: 443,
                    cidr_blocks: ['0.0.0.0/0'],
                    description: 'HTTPS outbound',
                  };
                  const rules = [...egressRules, rule];
                  onUpdate({ ...config, egress: rules });
                }}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
              >
                HTTPS Out (443)
              </button>
              <button
                onClick={() => {
                  const rule: SecurityGroupRule = {
                    protocol: 'tcp',
                    from_port: 80,
                    to_port: 80,
                    cidr_blocks: ['0.0.0.0/0'],
                    description: 'HTTP outbound',
                  };
                  const rules = [...egressRules, rule];
                  onUpdate({ ...config, egress: rules });
                }}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
              >
                HTTP Out (80)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityGroupRulesEditor;
