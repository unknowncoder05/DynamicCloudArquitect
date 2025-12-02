# On-Demand Backend System

## Overview

{{app_name}} uses an **autonomous on-demand backend system** for cost optimization in production. The backend automatically starts when needed and shuts down when idle, reducing AWS costs by up to 95% compared to always-on infrastructure.

**Key Features:**
- ✅ **Zero configuration** - Works automatically based on environment variables
- ✅ **Transparent to users** - No manual intervention required
- ✅ **Smart cold-start handling** - Automatic retry and warmup
- ✅ **Keep-alive management** - Prevents unnecessary restarts
- ✅ **Graceful fallbacks** - Works in all deployment modes

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │          BackendManager Service                     │  │
│  │  • Starts backend on first API call                 │  │
│  │  • Pings backend every 2.5 minutes                  │  │
│  │  • Handles cold-start retries                       │  │
│  │  • Dynamically updates API base URL                 │  │
│  └─────────────────────────────────────────────────────┘  │
│                           │                                 │
│  ┌────────────────────────┴─────────────────────────────┐  │
│  │           API Service (Axios)                        │  │
│  │  • Intercepts requests                               │  │
│  │  • Ensures backend ready                             │  │
│  │  • Uses dynamic base URL                             │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬────────────────┬────────────────────┘
                        │                │
                        │                │ Keep-alive ping
                        │                ▼
                        │         ┌──────────────┐
                        │         │ API Gateway  │
                        │         │  /start      │
                        │         └──────┬───────┘
                        │                │
                        │                ▼
                        │         ┌──────────────┐
                        │         │   Lambda     │
                        │         │Task Manager  │
                        │         └──────┬───────┘
                        │                │
                        │                ▼
                        │         ┌──────────────┐
                        │         │ ECS Fargate  │
                        │         │   Task       │
                        │         └──────┬───────┘
                        │                │
                        │                │ Returns public IP
                        ▼                ▼
                   ┌─────────────────────────┐
                   │   Django Backend        │
                   │   (Dynamic IP)          │
                   │   http://x.x.x.x:8000   │
                   └─────────────────────────┘
```

### Request Flow

#### 1. First API Call (Cold Start)

```typescript
User Action → API Call
              ↓
       BackendManager.ensureBackendReady()
              ↓
       Check if backend running
              ↓
       [Not Running] → Call API Gateway /start
              ↓
       Lambda starts ECS task
              ↓
       Wait for task to start (30-60s)
              ↓
       Poll health endpoint until ready
              ↓
       Update API base URL to task IP
              ↓
       Execute original API call
```

#### 2. Subsequent Calls (Warm Backend)

```typescript
User Action → API Call
              ↓
       BackendManager.ensureBackendReady()
              ↓
       [Already Running] → Skip
              ↓
       Use cached backend URL
              ↓
       Execute API call immediately
```

#### 3. Keep-Alive (Every 2.5 minutes)

```typescript
setInterval (150 seconds)
       ↓
Call API Gateway /start?action=ping
       ↓
Lambda extends task lifetime
       ↓
Publishes CloudWatch metric
       ↓
Resets inactivity alarm
```

## Configuration

### Environment Variables

The system is configured entirely through environment variables in `frontend/.env`:

```bash
# API Gateway endpoint for starting backend
REACT_APP_API_GATEWAY_START_ENDPOINT=https://api{{app_name}}.yerson.co/start

# Default API URL (used as fallback)
REACT_APP_API_URL=https://sandbox.yerson.co/api/v1

# Keep-alive interval (milliseconds)
REACT_APP_KEEP_ALIVE_INTERVAL=150000

# Startup timeout (milliseconds)
REACT_APP_STARTUP_TIMEOUT=90000
```

### Deployment Modes

#### Local Development

```bash
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_API_GATEWAY_START_ENDPOINT=
```

**Behavior:**
- Backend runs constantly via Docker Compose
- No lifecycle management
- No keep-alive pings

#### Production with Static Backend

```bash
REACT_APP_API_URL=https://backend.example.com/api/v1
REACT_APP_API_GATEWAY_START_ENDPOINT=
```

**Behavior:**
- Backend runs 24/7
- No lifecycle management
- No keep-alive pings

#### Production with On-Demand Backend (Cost-Optimized)

```bash
REACT_APP_API_URL=https://sandbox.yerson.co/api/v1
REACT_APP_API_GATEWAY_START_ENDPOINT=https://api{{app_name}}.yerson.co/start
REACT_APP_KEEP_ALIVE_INTERVAL=150000
REACT_APP_STARTUP_TIMEOUT=90000
```

**Behavior:**
- Backend starts on-demand
- Automatic keep-alive every 2.5 minutes
- Automatic cold-start handling
- Dynamic API URL switching

## Implementation Details

### BackendManager Service

Located in `frontend/src/services/BackendManager.ts`

**Responsibilities:**
1. **Startup Management**
   - Calls API Gateway `/start` endpoint
   - Waits for backend to be ready
   - Updates API base URL dynamically

2. **Keep-Alive**
   - Pings backend every 2.5 minutes
   - Extends backend lifetime
   - Detects when backend stops

3. **State Management**
   - Tracks backend readiness
   - Caches public IP
   - Prevents duplicate startups

**Key Methods:**
- `ensureBackendReady()` - Guarantees backend is running before API calls
- `getApiBaseUrl()` - Returns current backend URL (dynamic or static)
- `warmUp()` - Manually trigger backend start
- `reset()` - Clear backend state (e.g., after logout)

### API Service Integration

Located in `frontend/src/services/api.ts`

**Request Interceptor:**
```typescript
this.api.interceptors.request.use(async (config) => {
  // Ensure backend is running
  await backendManager.ensureBackendReady();

  // Use dynamic base URL
  config.baseURL = backendManager.getApiBaseUrl();

  return config;
});
```

**Response Interceptor:**
```typescript
this.api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Network error = backend might be cold
    if (!error.response && env.backend.useOnDemandBackend) {
      backendManager.reset();
      await backendManager.ensureBackendReady();
      return this.api(originalRequest); // Retry
    }

    // 500 error = backend might need restart
    if (error.response?.status >= 500) {
      backendManager.reset();
      await backendManager.ensureBackendReady();
      return this.api(originalRequest); // Retry once
    }
  }
);
```

### Health Check Endpoint

Located in `BackEndApi/src/api/utils/views.py`

**Endpoint:** `GET /api/v1/health/`

**Purpose:**
- Verify backend is ready after cold start
- No authentication required
- Fast, lightweight response

**Response:**
```json
{
  "status": "healthy",
  "message": "Backend is running"
}
```

## User Experience

### Cold Start Flow

1. **User opens app**
   - Frontend loads instantly
   - First API call triggers backend start

2. **Backend starting (30-60 seconds)**
   - User sees loading indicators
   - BackendManager polls health endpoint
   - No user intervention required

3. **Backend ready**
   - API call executes automatically
   - Subsequent calls are instant
   - Backend stays alive while user is active

4. **User idle (>5 minutes)**
   - Backend automatically shuts down
   - No cost incurred
   - Next visit repeats cold start

### Typical Timeline

| Time | Event |
|------|-------|
| 0s | User clicks login |
| 0s | Frontend calls API |
| 0s | BackendManager starts backend |
| 2s | Lambda launches ECS task |
| 30s | Backend container starts |
| 45s | Health check succeeds |
| 45s | API call executes |
| 46s | User sees dashboard |

**Total perceived delay:** ~45 seconds on cold start, 0 seconds when warm

## Cost Optimization

### Without On-Demand Backend
- ECS running 24/7: **$36/month**
- Total monthly cost: **$38/month**

### With On-Demand Backend
- ECS running 2 hours/day: **$3/month**
- Lambda + API Gateway: **$0.50/month**
- Total monthly cost: **$5.50/month**

**Savings:** $32.50/month (85% reduction)

## Monitoring

### Backend State

Check if backend is running:
```bash
curl https://api{{app_name}}.yerson.co/start?action=ping
```

**Response (running):**
```json
{
  "status": "alive",
  "task_arn": "arn:aws:ecs:...",
  "public_ip": "54.XXX.XXX.XXX",
  "expires_at": 1234567890
}
```

**Response (stopped):**
```json
{
  "error": "No task is currently running"
}
```

### Keep-Alive Pings

View in browser console:
```
Keep-alive initialized (interval: 150000ms)
Backend keep-alive ping successful: alive
```

### Cold Start Detection

View in browser console:
```
Starting backend...
Backend starting, waiting for it to be ready...
Backend is ready!
Backend URL updated to: http://54.XXX.XXX.XXX:8000/api/v1
```

## Troubleshooting

### Backend won't start

1. **Check API Gateway URL**
   ```bash
   echo $REACT_APP_API_GATEWAY_START_ENDPOINT
   ```

2. **Test endpoint manually**
   ```bash
   curl https://api{{app_name}}.yerson.co/start
   ```

3. **Check Lambda logs**
   ```bash
   aws logs tail /aws/lambda/{{app_name}}-task-manager-prod --follow
   ```

### Backend keeps stopping

1. **Check keep-alive interval**
   ```bash
   # Should be < 300000 (5 minutes)
   echo $REACT_APP_KEEP_ALIVE_INTERVAL
   ```

2. **Verify pings in console**
   - Open DevTools → Console
   - Look for "Keep-alive ping successful"

3. **Check CloudWatch metrics**
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace {{app_name}}/ECS \
     --metric-name TaskPing \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Sum
   ```

### API calls failing

1. **Check backend URL**
   - Open DevTools → Console
   - Look for "Backend URL updated to: ..."

2. **Test health endpoint**
   ```bash
   curl http://<public-ip>:8000/api/v1/health/
   ```

3. **Check CORS settings**
   - Ensure API Gateway allows frontend origin

### Cold start too slow

1. **Adjust startup timeout**
   ```bash
   # In frontend/.env
   REACT_APP_STARTUP_TIMEOUT=120000  # 2 minutes
   ```

2. **Check ECS task logs**
   ```bash
   aws logs tail /ecs/{{app_name}}-prod --follow
   ```

3. **Optimize Docker image**
   - Reduce image size
   - Use multi-stage builds
   - Cache dependencies

## Testing

### Test Cold Start

```bash
# Stop backend
aws ecs stop-task \
  --cluster {{app_name}}-prod \
  --task <task-arn>

# Open app and trigger API call
# Watch console for startup flow
```

### Test Keep-Alive

```bash
# Open app
# Wait 2.5 minutes
# Check console for "Keep-alive ping successful"
```

### Test Health Check

```bash
# Get backend IP from /start response
curl http://<public-ip>:8000/api/v1/health/

# Expected response:
# {"status":"healthy","message":"Backend is running"}
```

## Best Practices

1. **Don't hardcode URLs** - Always use environment variables
2. **Test locally first** - Use `REACT_APP_API_GATEWAY_START_ENDPOINT=""` for dev
3. **Monitor cold starts** - Check console logs for timing
4. **Adjust timeouts** - Based on your backend startup time
5. **Keep intervals optimal** - 50% of backend timeout is ideal

## Future Enhancements

- [ ] Show cold-start progress indicator to users
- [ ] Preemptive warmup on login page load
- [ ] Adaptive keep-alive based on user activity
- [ ] Backend state persistence across sessions
- [ ] Multi-region failover support
