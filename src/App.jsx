import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Users from "./pages/Users";
import ConnectClaude from "./pages/ConnectClaude";
import Layout from "./components/Layout";

// Hidden for now (files kept): Home, Dashboard, Clients.

function ProtectedRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (!user.approved)
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20 bg-white dark:bg-neutral-800 p-8 rounded-2xl shadow-sm text-center">
          <h2 className="text-2xl font-black text-black dark:text-white mb-2">
            Waiting for approval
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            An admin needs to approve your account before you can access projects.
            This page updates when you reload after approval.
          </p>
        </div>
      </Layout>
    );
  if (adminOnly && user.role !== "admin") return <Navigate to="/projects" />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <ProjectDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute adminOnly>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/connect"
              element={
                <ProtectedRoute>
                  <ConnectClaude />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/projects" />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
