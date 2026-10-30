import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Projects from './pages/Projects';
import Dashboard from './pages/Dashboard';
import ProjectKnowledge from './pages/ProjectKnowledge';
import Assistant from './pages/Assistant';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/project-knowledge" element={<ProjectKnowledge />} />
          <Route path="/project-knowledge/:projectId" element={<ProjectKnowledge />} />
          <Route path="/assistant" element={<Assistant />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
