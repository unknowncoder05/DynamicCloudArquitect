# AWS Authentication Guide

## Overview

{{app_name}} uses two separate sets of AWS credentials for security:

1. **Admin Credentials** - For deploying/updating infrastructure with Terraform
2. **Deployment Credentials** - For day-to-day deployments (frontend/backend)

## Why Two Credentials?

**Security Best Practice**: Principle of Least Privilege

- Admin credentials can create/destroy infrastructure
- Deployment credentials can only deploy code to existing infrastructure
- If deployment credentials are compromised, infrastructure remains safe

## Setup Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Create AWS Account                                       │
│     └─> Create Admin IAM User manually                       │
│         └─> Configure: aws configure                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Deploy Infrastructure (using admin credentials)          │
│     └─> terraform apply                                      │
│         └─> Automatically creates Deployment IAM User        │
│             └─> Stores credentials in SSM Parameter Store    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Retrieve Deployment Credentials                          │
│     └─> ./scripts/get-deployment-credentials.sh             │
│         └─> Fetches from SSM (using admin credentials)      │
│             └─> Configures AWS CLI profile                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Daily Deployments (using deployment credentials)         │
│     └─> export AWS_PROFILE={{app_name}}-deployment        │
│         └─> make deploy-frontend                             │
│         └─> make deploy-backend                              │
└─────────────────────────────────────────────────────────────┘
```

## Credential Details

### 1. Admin Credentials

**Purpose:** Infrastructure management only

**Permissions:**
- Full access to S3, CloudFront, Route53, ECR, ECS, Lambda, API Gateway, DynamoDB
- IAM user creation (to create deployment user)
- ACM certificate management

**When to use:**
- Initial infrastructure deployment: `make infra-apply`
- Infrastructure updates: `make infra-plan && make infra-apply`
- Retrieving deployment credentials: `./scripts/get-deployment-credentials.sh`

**Storage:** Local `~/.aws/credentials` default profile

### 2. Deployment Credentials (Auto-created)

**IAM User:** `{{app_name}}-deployment-prod`

**Purpose:** Application deployment only

**Permissions (scoped):**
- ✅ S3: Write to frontend bucket, read database bucket
- ✅ CloudFront: Create invalidations
- ✅ ECR: Push Docker images
- ✅ CloudWatch Logs: Read-only
- ✅ ECS: Read task status
- ❌ Cannot create/destroy infrastructure
- ❌ Cannot modify IAM
- ❌ Cannot change Terraform state

**When to use:**
- Frontend deployments: `make deploy-frontend`
- Backend deployments: `make deploy-backend`
- Combined deployments: `make deploy`
- Daily development workflow

**Storage:** SSM Parameter Store (encrypted) + AWS CLI profile

## Getting Deployment Credentials

### Option 1: AWS CLI Profile (Recommended)

```bash
# Run the script
./scripts/get-deployment-credentials.sh

# Choose option 1 when prompted
# This creates profile: {{app_name}}-deployment

# Add to .env file
echo "export AWS_PROFILE={{app_name}}-deployment" >> .env

# Use for all deployments
source .env
make deploy-frontend
```

### Option 2: Environment Variables

```bash
# Run the script
./scripts/get-deployment-credentials.sh

# Choose option 2
# Copy the export commands

# Add to .env
export AWS_ACCESS_KEY_ID='AKIAxxxxxxxxxx'
export AWS_SECRET_ACCESS_KEY='xxxxxxxxxxxx'
export AWS_REGION='us-east-1'
```

### Option 3: Direct from SSM

```bash
# Using admin credentials
aws ssm get-parameter \
  --name "/{{app_name}}/prod/deployment/access-key-id" \
  --region us-east-1 \
  --query 'Parameter.Value' \
  --output text

aws ssm get-parameter \
  --name "/{{app_name}}/prod/deployment/secret-access-key" \
  --region us-east-1 \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text
```

## Security Best Practices

### ✅ DO

- Use deployment credentials for daily work
- Store credentials in `.env` (gitignored)
- Use AWS CLI profiles when possible
- Rotate credentials periodically
- Use admin credentials only when needed

### ❌ DON'T

- Commit credentials to git
- Share credentials between team members (create separate users)
- Use admin credentials for deployments
- Store credentials in plaintext files tracked by git

## Credential Rotation

To rotate deployment credentials:

```bash
# 1. Switch to admin credentials
unset AWS_PROFILE
# or
export AWS_PROFILE=default

# 2. Destroy and recreate deployment user
cd terraform/environments/prod
terraform taint module.deployment_user.aws_iam_access_key.deployment[0]
terraform apply

# 3. Retrieve new credentials
cd ../../..
./scripts/get-deployment-credentials.sh
```

## Troubleshooting

### "Access Denied" during deployment

**Cause:** Using wrong credentials or profile

**Fix:**
```bash
# Check which credentials you're using
aws sts get-caller-identity

# Should show: {{app_name}}-deployment-prod
# If not:
export AWS_PROFILE={{app_name}}-deployment
```

### "Parameter not found" when getting credentials

**Cause:** Deployment user not created yet

**Fix:**
```bash
# Make sure you've deployed infrastructure first
cd terraform/environments/prod
terraform apply
```

### Credentials expired or invalid

**Cause:** Credentials rotated or deleted

**Fix:**
```bash
# Retrieve fresh credentials
./scripts/get-deployment-credentials.sh
```

## Multiple Environments

For staging/dev environments:

```bash
# Each environment gets its own deployment user
# Example for staging:

# 1. Deploy staging infrastructure
cd terraform/environments/staging
terraform apply

# 2. Get staging credentials
PROJECT_NAME={{app_name}} ENVIRONMENT=staging ./scripts/get-deployment-credentials.sh

# 3. Profile will be: {{app_name}}-deployment-staging
```

## Team Setup

Each team member should:

1. Get their own admin IAM user (or use existing)
2. Deploy infrastructure once (or use existing)
3. Retrieve shared deployment credentials
4. Configure local `.env` file

**Note:** All team members can use the same deployment user credentials since they're scoped to read-only infrastructure access.

## Further Reading

- [INFRASTRUCTURE.md](../INFRASTRUCTURE.md) - Full infrastructure guide
- [scripts/README.md](../scripts/README.md) - Deployment scripts documentation
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
