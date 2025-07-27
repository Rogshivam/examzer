import React from 'react';
import './Navbar.css';

function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">Exam System</div>
      <div className="navbar-user">
        {user && <span>{user.name} ({user.role})</span>}
        {user && <button onClick={onLogout}>Logout</button>}
      </div>
    </nav>
  );
}

export default Navbar; 