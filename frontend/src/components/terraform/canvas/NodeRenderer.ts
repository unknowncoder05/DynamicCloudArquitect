/**
 * NodeRenderer class for drawing Terraform resource nodes
 * Handles both container nodes (VPC, Subnet, etc.) and standard resource nodes (EC2, RDS, etc.)
 */

import { CanvasNode, NodeRenderState, TextStyle, ContainerConfig, ResourceConfig } from './types';
import { ResourceStatus } from '../../../types/terraform';
import { getResourceIcon, getResourceDisplayName } from '../../../types/terraform';

/**
 * Status display configuration
 */
const STATUS_COLORS: Record<ResourceStatus, string> = {
  unknown: '#9ca3af',
  planning: '#3b82f6',
  applying: '#f59e0b',
  created: '#10b981',
  updating: '#ff9800',
  error: '#ef4444',
  destroyed: '#6b7280',
};

const STATUS_ICONS: Record<ResourceStatus, string> = {
  unknown: '❓',
  planning: '⏳',
  applying: '⚙️',
  created: '✅',
  updating: '🔄',
  error: '❌',
  destroyed: '🗑️',
};

/**
 * NodeRenderer handles all node drawing logic
 */
export class NodeRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  /**
   * Draw a node (dispatches to container or resource renderer)
   */
  drawNode(node: CanvasNode, state: NodeRenderState): void {
    if (node.isContainer) {
      this.drawContainerNode(node, state);
    } else {
      this.drawResourceNode(node, state);
    }
  }

  /**
   * Draw a container node (VPC, Subnet, ASG, ECS Cluster)
   */
  private drawContainerNode(node: CanvasNode, state: NodeRenderState): void {
    const { x, y, width, height } = node.bounds;
    const config = this.getContainerConfig(node.resourceType);

    this.ctx.save();

    // Draw container background
    this.ctx.fillStyle = config.backgroundColor;
    this.roundRect(x, y, width, height, 8);
    this.ctx.fill();

    // Draw border with drag feedback
    let borderColor = config.borderColor;
    let borderWidth = config.borderWidth;

    if (state.isDropTarget) {
      borderColor = state.canDrop ? '#4caf50' : '#f44336';
      borderWidth = 3;
    } else if (state.isSelected) {
      borderColor = '#1976d2';
      borderWidth = 3;
    }

    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = borderWidth;

    if (config.borderStyle === 'dashed') {
      this.ctx.setLineDash([8, 4]);
    } else {
      this.ctx.setLineDash([]);
    }

    this.roundRect(x, y, width, height, 8);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Draw header background
    this.ctx.fillStyle = '#ffffff';
    this.roundRect(x, y, width, 52, 8, { topOnly: true });
    this.ctx.fill();

    // Draw header border
    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + 52);
    this.ctx.lineTo(x + width, y + 52);
    this.ctx.stroke();

    // Draw icon
    this.drawText(config.icon, x + 15, y + 26, {
      fontSize: 24,
      fontWeight: 400,
      baseline: 'middle',
    });

    // Draw resource name
    this.drawText(node.label, x + 50, y + 20, {
      fontSize: 14,
      fontWeight: 600,
      color: '#333',
      baseline: 'top',
    });

    // Draw resource type
    this.drawText(config.displayName, x + 50, y + 36, {
      fontSize: 11,
      fontWeight: 400,
      color: '#666',
      baseline: 'top',
    });

    // Draw resource count badge
    this.drawBadge(
      `${node.containedCount} ${node.containedCount === 1 ? 'resource' : 'resources'}`,
      x + width - 110, y + 20,
      110, 24,
      '#f0f0f0', '#666'
    );

    // Draw status dot
    this.drawStatusDot(node.status, x + width - 25, y + 26);

    // Draw configuration details below header
    this.drawContainerConfig(node, x + 15, y + 58);

    // Draw "Add Resource" button (only if not dragging)
    if (!state.isDropTarget) {
      this.drawAddResourceButton(x + width - 130, y + height - 47);
    }

    // Draw connection handles
    this.drawHandle(x + width / 2, y, 'target');
    this.drawHandle(x + width / 2, y + height, 'source');

    this.ctx.restore();
  }

  /**
   * Draw a standard resource node (EC2, RDS, S3, etc.)
   */
  private drawResourceNode(node: CanvasNode, state: NodeRenderState): void {
    const { x, y, width, height } = node.bounds;
    const config = this.getResourceConfig(node.resourceType);

    this.ctx.save();

    // Draw node background
    this.ctx.fillStyle = '#ffffff';
    this.roundRect(x, y, width, height, 8);
    this.ctx.fill();

    // Draw border
    const borderColor = state.isSelected ? '#1976d2' : config.borderColor;
    const borderWidth = state.isSelected ? 3 : 2;

    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = borderWidth;
    this.roundRect(x, y, width, height, 8);
    this.ctx.stroke();

    // Draw colored header bar
    this.ctx.fillStyle = config.headerColor;
    this.roundRect(x, y, width, 60, 8, { topOnly: true });
    this.ctx.fill();

    // Draw icon in header
    this.drawText(config.icon, x + 15, y + 30, {
      fontSize: 20,
      fontWeight: 400,
      baseline: 'middle',
    });

    // Draw resource type label
    this.drawText(node.resourceType, x + 45, y + 20, {
      fontSize: 10,
      fontWeight: 400,
      color: '#ffffff99',
      baseline: 'top',
    });

    // Draw resource name
    this.drawText(node.label, x + 45, y + 35, {
      fontSize: 13,
      fontWeight: 600,
      color: '#ffffff',
      baseline: 'top',
    });

    // Draw status icon in header
    const statusIcon = STATUS_ICONS[node.status];
    this.drawText(statusIcon, x + width - 25, y + 30, {
      fontSize: 18,
      fontWeight: 400,
      baseline: 'middle',
    });

    // Draw configuration properties in body
    this.drawResourceConfig(node, x + 15, y + 70);

    // Draw connection handles
    this.drawHandle(x, y + height / 2, 'target');
    this.drawHandle(x + width, y + height / 2, 'source');

    this.ctx.restore();
  }

  /**
   * Get container-specific visual configuration
   */
  private getContainerConfig(resourceType: string): ContainerConfig {
    const icon = getResourceIcon(resourceType);
    const displayName = getResourceDisplayName(resourceType);

    switch (resourceType) {
      case 'aws_vpc':
        return {
          backgroundColor: 'rgba(66, 135, 245, 0.05)',
          borderColor: '#4287f5',
          borderWidth: 3,
          borderStyle: 'solid',
          minWidth: 800,
          minHeight: 500,
          icon,
          displayName,
        };
      case 'aws_subnet':
        return {
          backgroundColor: 'rgba(130, 180, 245, 0.08)',
          borderColor: '#82b4f5',
          borderWidth: 2,
          borderStyle: 'solid',
          minWidth: 350,
          minHeight: 280,
          icon,
          displayName,
        };
      case 'aws_autoscaling_group':
        return {
          backgroundColor: 'rgba(255, 152, 0, 0.05)',
          borderColor: '#ff9800',
          borderWidth: 2,
          borderStyle: 'dashed',
          minWidth: 400,
          minHeight: 300,
          icon,
          displayName,
        };
      case 'aws_ecs_cluster':
        return {
          backgroundColor: 'rgba(33, 150, 243, 0.05)',
          borderColor: '#2196f3',
          borderWidth: 2,
          borderStyle: 'solid',
          minWidth: 400,
          minHeight: 300,
          icon,
          displayName,
        };
      default:
        return {
          backgroundColor: 'rgba(200, 200, 200, 0.05)',
          borderColor: '#cccccc',
          borderWidth: 2,
          borderStyle: 'solid',
          minWidth: 400,
          minHeight: 300,
          icon,
          displayName,
        };
    }
  }

  /**
   * Get resource-specific visual configuration
   */
  private getResourceConfig(resourceType: string): ResourceConfig {
    const icon = getResourceIcon(resourceType);
    const displayName = getResourceDisplayName(resourceType);

    // Map resource types to header colors
    const colorMap: Record<string, string> = {
      aws_instance: '#ff9800',
      aws_launch_template: '#ff9800',
      aws_s3_bucket: '#4caf50',
      aws_ebs_volume: '#8bc34a',
      aws_efs_file_system: '#8bc34a',
      aws_db_instance: '#2196f3',
      aws_rds_cluster: '#2196f3',
      aws_dynamodb_table: '#2196f3',
      aws_lambda_function: '#ff9800',
      aws_lambda_layer: '#ff9800',
      aws_lb: '#9c27b0',
      aws_alb: '#9c27b0',
      aws_elb: '#9c27b0',
      aws_lb_target_group: '#9c27b0',
      aws_security_group: '#f44336',
      aws_network_acl: '#f44336',
    };

    return {
      headerColor: colorMap[resourceType] || '#607d8b',
      borderColor: '#e0e0e0',
      icon,
      displayName,
    };
  }

  /**
   * Draw container-specific configuration details
   */
  private drawContainerConfig(node: CanvasNode, x: number, y: number): void {
    const config = node.configuration;
    const items: string[] = [];

    switch (node.resourceType) {
      case 'aws_vpc':
        if (config.cidr_block) {
          items.push(`CIDR: ${config.cidr_block}`);
        }
        break;
      case 'aws_subnet':
        if (config.cidr_block) {
          items.push(`CIDR: ${config.cidr_block}`);
        }
        if (config.availability_zone) {
          items.push(`AZ: ${config.availability_zone}`);
        }
        if (config.map_public_ip_on_launch !== undefined) {
          items.push(`Type: ${config.map_public_ip_on_launch ? 'Public' : 'Private'}`);
        }
        break;
      case 'aws_autoscaling_group':
        if (config.min_size !== undefined) {
          items.push(`Min: ${config.min_size}`);
        }
        if (config.max_size !== undefined) {
          items.push(`Max: ${config.max_size}`);
        }
        if (config.desired_capacity !== undefined) {
          items.push(`Desired: ${config.desired_capacity}`);
        }
        break;
    }

    if (items.length > 0) {
      // Draw background
      const text = items.join('  •  ');
      this.ctx.font = '11px sans-serif';
      const metrics = this.ctx.measureText(text);
      const padding = 10;

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.roundRect(x - 5, y - 5, metrics.width + padding * 2, 20, 4);
      this.ctx.fill();

      // Draw text
      this.drawText(text, x + padding, y + 5, {
        fontSize: 11,
        fontWeight: 400,
        color: '#666',
        baseline: 'top',
      });
    }
  }

  /**
   * Draw resource-specific configuration details
   */
  private drawResourceConfig(node: CanvasNode, x: number, y: number): void {
    const config = node.configuration;
    const lines: string[] = [];

    switch (node.resourceType) {
      case 'aws_instance':
      case 'aws_launch_template':
        if (config.instance_type) {
          lines.push(`Type: ${config.instance_type}`);
        }
        if (config.ami) {
          lines.push(`AMI: ${config.ami.substring(0, 12)}...`);
        }
        if (config.availability_zone) {
          lines.push(`AZ: ${config.availability_zone}`);
        }
        break;
      case 'aws_db_instance':
        if (config.engine) {
          lines.push(`Engine: ${config.engine}`);
        }
        if (config.instance_class) {
          lines.push(`Class: ${config.instance_class}`);
        }
        if (config.allocated_storage) {
          lines.push(`Storage: ${config.allocated_storage}GB`);
        }
        break;
      case 'aws_s3_bucket':
        if (config.bucket) {
          lines.push(`Bucket: ${config.bucket}`);
        }
        if (config.acl) {
          lines.push(`ACL: ${config.acl}`);
        }
        break;
      case 'aws_lambda_function':
        if (config.runtime) {
          lines.push(`Runtime: ${config.runtime}`);
        }
        if (config.handler) {
          lines.push(`Handler: ${config.handler}`);
        }
        if (config.memory_size) {
          lines.push(`Memory: ${config.memory_size}MB`);
        }
        break;
    }

    // Draw config lines
    lines.forEach((line, index) => {
      this.drawText(line, x, y + index * 18, {
        fontSize: 12,
        fontWeight: 400,
        color: '#666',
        baseline: 'top',
      });
    });
  }

  /**
   * Draw a rounded rectangle
   */
  private roundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    options?: { topOnly?: boolean }
  ): void {
    this.ctx.beginPath();

    if (options?.topOnly) {
      // Only round top corners
      this.ctx.moveTo(x + radius, y);
      this.ctx.lineTo(x + width - radius, y);
      this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      this.ctx.lineTo(x + width, y + height);
      this.ctx.lineTo(x, y + height);
      this.ctx.lineTo(x, y + radius);
      this.ctx.quadraticCurveTo(x, y, x + radius, y);
    } else {
      // Round all corners
      this.ctx.moveTo(x + radius, y);
      this.ctx.lineTo(x + width - radius, y);
      this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      this.ctx.lineTo(x + width, y + height - radius);
      this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      this.ctx.lineTo(x + radius, y + height);
      this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      this.ctx.lineTo(x, y + radius);
      this.ctx.quadraticCurveTo(x, y, x + radius, y);
    }

    this.ctx.closePath();
  }

  /**
   * Draw text with specified style
   */
  private drawText(
    text: string,
    x: number,
    y: number,
    style: TextStyle
  ): void {
    this.ctx.save();

    this.ctx.font = `${style.fontWeight || 400} ${style.fontSize}px sans-serif`;
    this.ctx.fillStyle = style.color || '#000000';
    this.ctx.textAlign = style.align || 'left';
    this.ctx.textBaseline = style.baseline || 'alphabetic';
    this.ctx.fillText(text, x, y);

    this.ctx.restore();
  }

  /**
   * Draw a badge (pill-shaped label)
   */
  private drawBadge(
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    bgColor: string,
    textColor: string
  ): void {
    this.ctx.save();

    // Draw background
    this.ctx.fillStyle = bgColor;
    this.roundRect(x, y, width, height, height / 2);
    this.ctx.fill();

    // Draw text
    this.drawText(text, x + width / 2, y + height / 2, {
      fontSize: 12,
      fontWeight: 400,
      color: textColor,
      align: 'center',
      baseline: 'middle',
    });

    this.ctx.restore();
  }

  /**
   * Draw a status indicator dot
   */
  private drawStatusDot(status: ResourceStatus, x: number, y: number): void {
    const color = STATUS_COLORS[status];

    this.ctx.save();
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  /**
   * Draw the "Add Resource" button
   */
  private drawAddResourceButton(x: number, y: number): void {
    const width = 115;
    const height = 32;

    this.ctx.save();

    // Draw button background
    this.ctx.fillStyle = '#1976d2';
    this.roundRect(x, y, width, height, 6);
    this.ctx.fill();

    // Draw button shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetY = 2;

    // Draw "+" icon
    this.drawText('+', x + 12, y + height / 2, {
      fontSize: 16,
      fontWeight: 500,
      color: '#ffffff',
      align: 'left',
      baseline: 'middle',
    });

    // Draw "Add Resource" text
    this.drawText('Add Resource', x + 28, y + height / 2, {
      fontSize: 13,
      fontWeight: 500,
      color: '#ffffff',
      align: 'left',
      baseline: 'middle',
    });

    this.ctx.restore();
  }

  /**
   * Draw a connection handle
   */
  private drawHandle(x: number, y: number, type: 'source' | 'target'): void {
    this.ctx.save();

    // Draw handle circle
    this.ctx.fillStyle = '#555555';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 6, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw white border
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.restore();
  }
}
