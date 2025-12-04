# Quick Start Guide - Terraform Cloud Architect

## Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL database
- Git

---

## Step 1: Database Setup

Make sure your PostgreSQL database is running and accessible. Check `.env` or `BackEndApi/.envs/.local/.django` for database credentials.

---

## Step 2: Backend Setup

```bash
# Navigate to backend
cd BackEndApi

# Create and activate virtual environment (if not already done)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements/base.txt

# Run migrations
python src/manage.py makemigrations terraform
python src/manage.py migrate

# Create a superuser (optional, for admin access)
python src/manage.py createsuperuser

# Start the development server
python src/manage.py runserver
```

Backend will be available at: `http://localhost:8000`

---

## Step 3: Frontend Setup

```bash
# Navigate to frontend (open a new terminal)
cd frontend

# Dependencies are already installed
# If you need to reinstall:
# npm install --legacy-peer-deps

# Start the development server
npm start
```

Frontend will be available at: `http://localhost:3000`

---

## Step 4: First Login

1. Open `http://localhost:3000` in your browser
2. Click "Sign Up" to create an account
3. Fill in your details and submit
4. Log in with your credentials
5. You'll be redirected to the Projects dashboard

---

## Step 5: Create Your First Project

1. Click the "**+ New Project**" button
2. Fill in:
   - **Project Name**: e.g., "my-infrastructure"
   - **Description**: e.g., "AWS production infrastructure"
   - **Terraform Version**: Select 1.6.0 (default)
3. Click "**Create Project**"

---

## Step 6: Add Resources

1. Click on your newly created project
2. You'll see the diagram canvas
3. On the left, you'll see the **Component Palette**
4. Click any resource (e.g., "EC2 Instance") to add it to the canvas
5. The resource appears on the canvas
6. Click the resource to open the **Properties Panel** on the right
7. Edit configuration fields
8. Click "**Save Changes**"

---

## Step 7: Organize Your Diagram

1. Click the "**↻ Auto Layout**" button in the top-right
2. Resources will be automatically arranged
3. You can also **drag nodes** manually to reposition them
4. Zoom in/out using mouse wheel or controls
5. Use the minimap in bottom-right for navigation

---

## API Endpoints

All API endpoints are available at:
- Base URL: `http://localhost:8000/api/v1/terraform/`
- Admin Interface: `http://localhost:8000/admin/`

### Key Endpoints:
- `GET /api/v1/terraform/projects/` - List projects
- `POST /api/v1/terraform/projects/` - Create project
- `GET /api/v1/terraform/projects/{id}/` - Get project detail
- `GET /api/v1/terraform/resources/` - List resources
- `POST /api/v1/terraform/resources/` - Create resource

---

## Troubleshooting

### Backend Issues

**"ModuleNotFoundError: No module named 'hcl2'"**
```bash
cd BackEndApi
pip install python-hcl2 GitPython cryptography
```

**"No migrations to apply"**
```bash
python src/manage.py makemigrations terraform
python src/manage.py migrate
```

**"Database connection error"**
- Check PostgreSQL is running
- Verify credentials in `.envs/.local/.django`
- Test connection: `psql -U [username] -d [database]`

### Frontend Issues

**"Module not found: dagre"**
```bash
cd frontend
npm install dagre @types/dagre --legacy-peer-deps
```

**"Port 3000 already in use"**
```bash
# Kill the process or use a different port
PORT=3001 npm start
```

**"Cannot read property of undefined"**
- Make sure backend is running on port 8000
- Check API calls in browser DevTools Network tab
- Verify authentication token in localStorage

---

## Development Workflow

### Making Backend Changes

1. Modify models in `BackEndApi/src/api/terraform/models.py`
2. Run migrations:
   ```bash
   python src/manage.py makemigrations terraform
   python src/manage.py migrate
   ```
3. Restart server: `Ctrl+C` then `python src/manage.py runserver`

### Making Frontend Changes

1. Edit files in `frontend/src/`
2. Changes auto-reload (hot module replacement)
3. Check console for errors
4. Type-check: `npm run type-check`

---

## Testing

### Backend
```bash
cd BackEndApi
pytest src/api/terraform/tests/
```

### Frontend
```bash
cd frontend
npm test
```

---

## Building for Production

### Backend
```bash
cd BackEndApi
# Set environment variables for production
export DJANGO_DEBUG=False
export DJANGO_ALLOWED_HOSTS=yourdomain.com

# Run with gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

### Frontend
```bash
cd frontend
npm run build
# Output in build/ directory
# Serve with nginx or any static file server
```

---

## Next Steps

Now that you have Phase 1 running:

1. **Explore the UI**: Try creating multiple resources and organizing them
2. **Check the API**: Visit `http://localhost:8000/api/v1/terraform/` in your browser
3. **Admin Interface**: Visit `http://localhost:8000/admin/` (if you created a superuser)
4. **Read USER_FLOWS.md**: Understand all planned user interactions
5. **Review PHASE1_COMPLETE.md**: See what was built and what's next

---

## Useful Commands

```bash
# Backend
python src/manage.py shell  # Django shell
python src/manage.py dbshell  # Database shell
python src/manage.py runserver 0.0.0.0:8000  # Accessible from network

# Frontend
npm run build  # Production build
npm run type-check  # TypeScript validation
npm run eject  # Eject from create-react-app (careful!)

# Git
git status  # See uncommitted changes
git add .  # Stage all changes
git commit -m "message"  # Commit changes
git push  # Push to remote
```

---

## Documentation

- **USER_FLOWS.md**: Comprehensive user interaction flows
- **TERRAFORM_SCHEMA.md**: Database schema design
- **PHASE1_COMPLETE.md**: What was built in Phase 1
- **TODO.md**: Full project roadmap (Phases 1-7)

---

## Support

If you encounter issues:
1. Check the error message carefully
2. Search the codebase for similar patterns
3. Review the documentation files
4. Check Django/React error logs
5. Verify all dependencies are installed

---

**Happy Building! 🚀**

Your Terraform Cloud Architecture Platform is ready to use!
