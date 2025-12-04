/**
 * Export all node components
 */
import EC2Node from './EC2Node';
import VPCNode from './VPCNode';
import S3Node from './S3Node';
import RDSNode from './RDSNode';
import LambdaNode from './LambdaNode';
import ALBNode from './ALBNode';
import SecurityGroupNode from './SecurityGroupNode';
import ContainerNode from './ContainerNode';

export { default as EC2Node } from './EC2Node';
export { default as VPCNode } from './VPCNode';
export { default as S3Node } from './S3Node';
export { default as RDSNode } from './RDSNode';
export { default as LambdaNode } from './LambdaNode';
export { default as ALBNode } from './ALBNode';
export { default as SecurityGroupNode } from './SecurityGroupNode';
export { default as ContainerNode } from './ContainerNode';
export { BaseResourceNode } from './BaseResourceNode';

export const nodeTypes = {
  // Container nodes (resources that can contain others)
  container: ContainerNode,

  // AWS Compute
  aws_instance: EC2Node,
  aws_launch_template: EC2Node,

  // AWS Networking - Container types use ContainerNode
  aws_vpc: ContainerNode,
  aws_subnet: ContainerNode,
  aws_security_group: SecurityGroupNode,
  aws_network_acl: SecurityGroupNode,

  // AWS Storage
  aws_s3_bucket: S3Node,
  aws_ebs_volume: S3Node,
  aws_efs_file_system: S3Node,

  // AWS Database
  aws_db_instance: RDSNode,
  aws_rds_cluster: RDSNode,
  aws_dynamodb_table: RDSNode,

  // AWS Serverless
  aws_lambda_function: LambdaNode,
  aws_lambda_layer: LambdaNode,

  // AWS Load Balancing
  aws_lb: ALBNode,
  aws_alb: ALBNode,
  aws_elb: ALBNode,
  aws_lb_target_group: ALBNode,

  // AWS Container Services - Container types
  aws_autoscaling_group: ContainerNode,
  aws_ecs_cluster: ContainerNode,
  aws_ecs_service: ContainerNode,
};
