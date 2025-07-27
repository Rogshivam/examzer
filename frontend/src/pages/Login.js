import React, { useState } from 'react';
import { toast } from 'react-toastify';

function Login({ onLogin, setGlobalLoading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState('student');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setGlobalLoading && setGlobalLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data);
        localStorage.setItem('token', data.token);
      } else {
        setError(data.message || 'Login failed');
        toast.error(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
      toast.error('Network error');
    }
    setGlobalLoading && setGlobalLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h2>{role === 'admin' ? 'Admin Login' : 'Student Login'}</h2>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <button onClick={() => setRole('student')} style={{ background: role === 'student' ? '#007bff' : '#eee', color: role === 'student' ? '#fff' : '#000' }}>Student Login</button>
        <button onClick={() => setRole('admin')} style={{ background: role === 'admin' ? '#007bff' : '#eee', color: role === 'admin' ? '#fff' : '#000' }}>Admin Login</button>
      </div>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login; 