import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { getCurrentUser } from './store/authSlice';
import AuthPage from './pages/AuthPage';
import VerifyAccount from './components/VerifyAccount';
import VerifyLogin from './components/VerifyLogin';
import ServerDown from './pages/ServerDown';
import ServerStartPage from './pages/ServerStartPage';
import ProjectsPage from './pages/terraform/ProjectsPage';
import ProjectDetailPage from './pages/terraform/ProjectDetailPage';
import backendManager from './services/BackendManager';
import env from './config/environment';

// Auth wrapper component to handle authentication state
const AuthWrapper: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const [isInitialized, setIsInitialized] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    const initApp = async () => {
      // For on-demand backend, check health first
      if (env.backend.useOnDemandBackend) {
        const isHealthy = await backendManager.checkHealth();
        setBackendHealthy(isHealthy);

        // If backend isn't healthy, don't proceed with auth
        if (!isHealthy) {
          setIsInitialized(true);
          return;
        }
      } else {
        // Local dev - assume healthy
        setBackendHealthy(true);
      }

      // Check if user is already authenticated
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          await dispatch(getCurrentUser()).unwrap();
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setIsInitialized(true);
    };

    initApp();
  }, [dispatch]);

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If backend health check failed, redirect to start server page
  if (backendHealthy === false && env.backend.useOnDemandBackend) {
    return (
      <Router>
        <Routes>
          <Route path="/start-server" element={<ServerStartPage />} />
          <Route path="*" element={<Navigate to="/start-server" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage key="login" />
          }
        />
        <Route
          path="/signup"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage key="signup" />
          }
        />
        <Route
          path="/verify"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <VerifyAccount key="verify" />
          }
        />
        <Route
          path="/verify-login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <VerifyLogin key="verify-login" />
          }
        />

        {/* Terraform Routes */}
        <Route
          path="/terraform/projects"
          element={
            isAuthenticated ? <ProjectsPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/terraform/projects/:projectId"
          element={
            isAuthenticated ? <ProjectDetailPage /> : <Navigate to="/login" replace />
          }
        />

        {/* Default route */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/terraform/projects" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Navigate to="/terraform/projects" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <div className="App">
        <AuthWrapper />
      </div>
    </Provider>
  );
};

export default App;
