# On-Demand Backend Setup Guide

## Quick Setup (5 Minutes)

This guide shows how to enable {{app_name}}'s autonomous on-demand backend. **No code changes required** - just environment variables.

## Prerequisites

✅ Terraform infrastructure deployed
✅ API Gateway endpoint available
✅ Custom domain configured (optional)

## Step 1: Get API Gateway Endpoint

From Terraform outputs:

```bash
cd terraform/environments/prod
terraform output api_start_endpoint
```

You'll get either:
- **Direct URL:** `https://xxxxx.execute-api.us-east-1.amazonaws.com/prod/start`
- **Custom domain:** `https://api{{app_name}}.yerson.co/start`

## Step 2: Configure Frontend

Edit `/home/ubuntu/Personal/{{app_name}}/frontend/.env`:

```bash
REACT_APP_API_GATEWAY_START_ENDPOINT=https://api{{app_name}}.yerson.co/start
```

That's it! The system handles everything else automatically.

## Step 3: Deploy

```bash
cd frontend
npm run build
cd ..
./scripts/deploy-frontend.sh
```

## Verification

### Test Start Endpoint

```bash
curl https://api{{app_name}}.yerson.co/start
```

Expected response:
```json
{
  "status": "started",
  "task_arn": "arn:aws:ecs:...",
  "public_ip": "54.XXX.XXX.XXX",
  "message": "Task starting. Please wait 30-60 seconds for it to be ready."
}
```

### Test Frontend

1. Open app in browser
2. Open DevTools Console
3. Log in
4. Watch for:

```
Starting backend...
Backend is ready!
Backend URL updated to: http://54.XXX.XXX.XXX:8000/api/v1
Keep-alive initialized (interval: 150000ms)
```

## How It Works

**Completely autonomous:**

1. User makes API call
2. BackendManager starts backend (if needed)
3. Wait 30-60 seconds for warmup
4. API call executes
5. Keep-alive pings every 2.5 minutes
6. Auto-shutdown after 5 minutes idle

**Zero user intervention required.**

## Configuration Reference

All environment variables in `/home/ubuntu/Personal/{{app_name}}/frontend/.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_GATEWAY_START_ENDPOINT` | API Gateway URL | _(empty)_ |
| `REACT_APP_API_URL` | Fallback API URL | `http://localhost:8000/api/v1` |
| `REACT_APP_KEEP_ALIVE_INTERVAL` | Ping interval (ms) | `150000` |
| `REACT_APP_STARTUP_TIMEOUT` | Max startup wait (ms) | `90000` |

## Deployment Modes

### Local Development

```bash
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_API_GATEWAY_START_ENDPOINT=
```

Backend runs constantly via Docker Compose.

### Production (Cost-Optimized)

```bash
REACT_APP_API_URL=https://sandbox.yerson.co/api/v1
REACT_APP_API_GATEWAY_START_ENDPOINT=https://api{{app_name}}.yerson.co/start
```

Backend starts on-demand. **85% cost savings.**

## Troubleshooting

### Backend Won't Start

```bash
# Test endpoint
curl https://api{{app_name}}.yerson.co/start

# Check Lambda logs
aws logs tail /aws/lambda/{{app_name}}-task-manager-prod --follow
```

### Keep-Alive Not Working

Check console for:
```
Backend keep-alive ping successful: alive
```

If missing, verify `REACT_APP_KEEP_ALIVE_INTERVAL < 300000`.

### Cold Start Too Slow

Increase timeout:
```bash
REACT_APP_STARTUP_TIMEOUT=120000
```

## Cost Savings

- **Before:** $38/month (always-on)
- **After:** $5.50/month (on-demand)
- **Savings:** 85%

## Documentation

- Full details: `docs/ON_DEMAND_BACKEND.md`
- Infrastructure: `INFRASTRUCTURE.md`
- Deployment: `DEPLOYMENT_QUICKSTART.md`

## Support

Check browser console - the system logs everything it's doing.
