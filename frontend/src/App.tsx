import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import MyRegistrations from './pages/MyRegistrations';
import EventPlanner from './pages/EventPlanner';
import AIAgent from './pages/AIAgent';
import InstitutionalMemory from './pages/InstitutionalMemory';
import Analytics from './pages/Analytics';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <Layout><Events /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:id"
            element={
              <ProtectedRoute>
                <Layout><EventDetail /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-registrations"
            element={
              <ProtectedRoute>
                <Layout><MyRegistrations /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/event-planner"
            element={
              <ProtectedRoute>
                <Layout><EventPlanner /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai"
            element={
              <ProtectedRoute>
                <Layout><AIAgent /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/institutional-memory"
            element={
              <ProtectedRoute>
                <Layout><InstitutionalMemory /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Layout><Analytics /></Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
