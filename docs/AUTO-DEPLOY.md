# Automatic Deployment Guide

## Overview

{{app_name}} supports **fully automatic deployment** - just push your code and it deploys automatically! No manual steps needed.

## Quick Start

### First Time Setup (One-time)

```bash
# 1. Clone the repository
git clone <repo-url>
cd {{app_name}}

# 2. Deploy infrastructure (one-time)
make infra-apply

# 3. Get deployment credentials
./scripts/get-deployment-credentials.sh
# Choose option 1 to create AWS profile

# 4. Configure environment
source .env

# 5. Setup automatic deployment
./scripts/install-hooks.sh
# Choose option 1 for fully automatic
# Choose 'y' to make 'git push' auto-deploy
```

### Daily Workflow

After setup, it's this simple:

```bash
# Make your changes
vim frontend/src/App.tsx

# Commit and push (AUTOMATICALLY DEPLOYS!)
git add .
git commit -m "Updated homepage"
git push
```

That's it! The system will:
1. Push your code to remote
2. Detect what changed (frontend/backend/infrastructure)
3. Automatically deploy the changed components
4. Show you the deployment progress

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  1. Developer makes changes                             │
│     └─> Edit frontend/backend code                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  2. Commit and Push                                     │
│     └─> git commit -m "..."                             │
│     └─> git push                                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  3. Auto-detect changes (git diff)                      │
│     ├─> frontend/ changed?  → Deploy frontend           │
│     ├─> BackEndApi/ changed? → Deploy backend           │
│     └─> terraform/ changed? → Deploy infrastructure     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  4. Deploy automatically                                │
│     ├─> Build Docker image (if backend changed)         │
│     ├─> Push to ECR                                     │
│     ├─> Build React app (if frontend changed)           │
│     ├─> Upload to S3 + invalidate CloudFront            │
│     └─> Apply Terraform (if infrastructure changed)     │
└─────────────────────────────────────────────────────────┘
```

### Configuration File

The `.deploy-config` file controls automatic deployment behavior:

```bash
# Enable/disable auto-deploy
AUTO_DEPLOY_ENABLED=true

# Which components to auto-deploy
AUTO_DEPLOY_FRONTEND=true
AUTO_DEPLOY_BACKEND=true
AUTO_DEPLOY_INFRASTRUCTURE=false  # Usually disabled for safety

# Ask for confirmation?
REQUIRE_CONFIRMATION=false

# Only deploy on specific branch
DEPLOY_BRANCH="main"
```

## Deployment Modes

### Mode 1: Fully Automatic (Recommended)

**Setup:**
```bash
./scripts/install-hooks.sh
# Choose: 1) Fully automatic
# Choose: y to make 'git push' auto-deploy
```

**Workflow:**
```bash
git add .
git commit -m "feat: new feature"
git push  # ← Automatically deploys!
```

**Best for:**
- Solo developers
- Rapid iteration
- Development environment
- When you trust your changes

### Mode 2: Confirmation Required

**Setup:**
```bash
./scripts/install-hooks.sh
# Choose: 2) Ask for confirmation
```

**Workflow:**
```bash
git push  # ← Prompts: "Proceed with deployment? (y/n)"
```

**Best for:**
- Team environments
- Production deployments
- When you want final check before deploy

### Mode 3: Manual Only

**Setup:**
```bash
./scripts/install-hooks.sh
# Choose: 3) Manual only
```

**Workflow:**
```bash
git push  # ← Just pushes, no deployment

# Deploy manually when ready:
./scripts/deploy.sh
# or
git deploy-push  # Push and deploy in one command
```

**Best for:**
- Multiple people deploying
- Staging environments
- Scheduled deployments

## Commands Reference

### Git Commands

```bash
# Standard push (with auto-deploy if enabled)
git push

# Push without deploying (if auto-deploy is enabled)
git push-original

# Push and deploy (always)
git deploy-push

# Deploy without pushing
./scripts/deploy.sh
```

### Make Commands

```bash
# Deploy specific components
make deploy-frontend
make deploy-backend
make deploy-infra

# Deploy everything
make deploy
```

## Change Detection

The system tracks the last deployment commit in `.last-deploy` and compares:

```bash
# Example: You changed frontend/src/App.tsx

git diff $(cat .last-deploy) HEAD --name-only
# Output: frontend/src/App.tsx

# System detects: frontend/ changed → Deploy frontend
# System ignores: backend/ unchanged → Skip backend
```

## Customization

### Disable Auto-Deploy for Specific Component

Edit `.deploy-config`:

```bash
# Don't auto-deploy backend
AUTO_DEPLOY_BACKEND=false
```

### Deploy Only on Specific Branch

Edit `.deploy-config`:

```bash
# Only auto-deploy on 'production' branch
DEPLOY_BRANCH="production"
```

### Change from Automatic to Manual

Edit `.deploy-config`:

```bash
# Disable automatic deployment
AUTO_DEPLOY_ENABLED=false
```

Or reconfigure:

```bash
./scripts/install-hooks.sh
# Choose new mode
```

## Team Setup

For team environments, each developer should:

### Option A: Everyone Auto-Deploys (Not Recommended)

```bash
# Each developer runs:
./scripts/install-hooks.sh  # Choose mode 1

# Problem: Multiple simultaneous deployments
```

**Not recommended** - can cause conflicts and race conditions.

### Option B: One Person Deploys (Recommended)

```bash
# Most developers:
./scripts/install-hooks.sh  # Choose mode 3 (manual)

# Lead/DevOps only:
./scripts/install-hooks.sh  # Choose mode 1 (automatic)
```

**Recommended** - clear ownership of deployments.

### Option C: CI/CD Pipeline (Best for Teams)

Set up GitHub Actions / GitLab CI that:
1. Triggers on push to main
2. Runs deployment scripts
3. One central deployment source

See `docs/CI-CD.md` for setup instructions.

## Troubleshooting

### "Command not found: git-push-deploy.sh"

**Cause:** Script not executable or wrong path

**Fix:**
```bash
chmod +x scripts/git-push-deploy.sh
./scripts/install-hooks.sh
```

### "AWS credentials not found"

**Cause:** Environment variables not loaded

**Fix:**
```bash
source .env
git push
```

### "Nothing was deployed" but files changed

**Cause:** `.last-deploy` file missing or `.env` not loaded

**Fix:**
```bash
# Reset deployment tracking
rm .last-deploy

# Or manually deploy
source .env
./scripts/deploy.sh
```

### Deployment fails midway

**Cause:** AWS permissions, Docker not running, etc.

**Check:**
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Verify Docker running (for backend)
docker ps

# Check environment variables
echo $FRONTEND_S3_BUCKET
```

### Want to skip deployment for one push

**Option 1:** Use push-original
```bash
git push-original
```

**Option 2:** Temporarily disable
```bash
# Edit .deploy-config
AUTO_DEPLOY_ENABLED=false

git push  # Won't deploy

# Re-enable
AUTO_DEPLOY_ENABLED=true
```

## Best Practices

### ✅ DO

- Set up auto-deploy for development
- Use confirmation mode for production
- Keep `.env` file updated
- Test locally before pushing
- Use feature branches for experimental work
- Deploy frequently (multiple times per day)

### ❌ DON'T

- Enable auto-deploy infrastructure (safety risk)
- Commit `.deploy-config` with sensitive settings
- Push directly to main without testing
- Have multiple people auto-deploying simultaneously
- Skip loading `.env` file

## Examples

### Example 1: Frontend Change

```bash
# Edit homepage
vim frontend/src/pages/Home.tsx

# Commit and push
git add frontend/
git commit -m "Updated homepage design"
git push

# Output:
# ========================================
#    Git Push + Auto Deploy
# ========================================
#
# Current branch: main
# 📤 Pushing to remote...
# ✅ Push successful
#
# ========================================
#    Automatic Deployment
# ========================================
#
# Changes detected:
#   Frontend: 1 files
#   Backend: 0 files
#   Infrastructure: 0 files
#
# ✓ Frontend will be deployed
#
# ▶ Deploying Frontend...
# 🔨 Building React application...
# ☁️  Uploading to S3...
# 🌐 Invalidating CloudFront cache...
# ✅ Frontend deployed
#
# ========================================
#    ✅ Deployment Complete!
# ========================================
```

### Example 2: Backend + Frontend Change

```bash
# Changed both frontend and backend
git add .
git commit -m "Added new API endpoint and UI"
git push

# Output:
# ...
# Changes detected:
#   Frontend: 2 files
#   Backend: 3 files
#   Infrastructure: 0 files
#
# ✓ Frontend will be deployed
# ✓ Backend will be deployed
#
# ▶ Deploying Backend...
# 🔨 Building Docker image...
# ☁️  Pushing to ECR...
# ✅ Backend deployed
#
# ▶ Deploying Frontend...
# ...
```

## Advanced Configuration

### Custom Deployment Script

You can customize `scripts/git-push-deploy.sh` to:
- Send Slack notifications
- Run tests before deploying
- Deploy to multiple environments
- Create deployment logs
- Rollback on failure

### Environment-Specific Configs

Create multiple config files:

```bash
.deploy-config.dev
.deploy-config.staging
.deploy-config.prod
```

Load based on branch:

```bash
# In git-push-deploy.sh
if [ "$CURRENT_BRANCH" == "staging" ]; then
    source .deploy-config.staging
fi
```

## Related Documentation

- [INFRASTRUCTURE.md](../INFRASTRUCTURE.md) - Infrastructure setup
- [AUTHENTICATION.md](./AUTHENTICATION.md) - AWS credentials
- [DEPLOYMENT_QUICKSTART.md](../DEPLOYMENT_QUICKSTART.md) - Manual deployment
- [scripts/README.md](../scripts/README.md) - Deployment scripts

## Support

Having issues? Check:
1. AWS credentials loaded: `echo $AWS_PROFILE`
2. Git aliases configured: `git config --get alias.deploy-push`
3. Scripts executable: `ls -la scripts/*.sh`
4. Configuration file exists: `cat .deploy-config`
