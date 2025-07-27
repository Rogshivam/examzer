import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from './components/ErrorBoundary';
import SpinnerOverlay from './components/SpinnerOverlay';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [globalLoading, setGlobalLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <ToastContainer position="top-center" autoClose={3000} />
          <SpinnerOverlay show={globalLoading} />
          <Navbar user={user} onLogout={handleLogout} />
          <Routes>
            <Route path="/" element={user ? (
              user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/student" />
            ) : <Navigate to="/login" />} />
            <Route path="/login" element={user ? (
              user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/student" />
            ) : <Login onLogin={setUser} />} />
            <Route path="/register" element={user ? (
              user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/student" />
            ) : <Register onRegister={() => {}} setGlobalLoading={setGlobalLoading} setUser={setUser} />} />
            <Route path="/admin" element={user && user.role === 'admin' ? (
              <AdminDashboard user={user} setGlobalLoading={setGlobalLoading} />
            ) : <Navigate to="/login" />} />
            <Route path="/student" element={user && user.role === 'student' ? (
              <StudentDashboard user={user} setGlobalLoading={setGlobalLoading} />
            ) : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
