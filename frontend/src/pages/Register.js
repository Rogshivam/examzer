import React, { useState } from 'react';
import { toast } from 'react-toastify';

function Register({ onRegister, setGlobalLoading }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('student');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGlobalLoading && setGlobalLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role })
    });
    if (res.ok) {
      toast.success('Registration successful! You can now log in.');
      setForm({ name: '', email: '', password: '' });
      if (onRegister) onRegister();
    } else {
      toast.error('Registration failed. Email may already be used.');
    }
    setLoading(false);
    setGlobalLoading && setGlobalLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h2>{role === 'admin' ? 'Admin Signup' : 'Student Signup'}</h2>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <button onClick={() => setRole('student')} style={{ background: role === 'student' ? '#007bff' : '#eee', color: role === 'student' ? '#fff' : '#000' }}>Student Signup</button>
        <button onClick={() => setRole('admin')} style={{ background: role === 'admin' ? '#007bff' : '#eee', color: role === 'admin' ? '#fff' : '#000' }}>Admin Signup</button>
      </div>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div>
          <label>Email:</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>
        <div>
          <label>Password:</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </div>
        <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
      </form>
    </div>
  );
}

export default Register; 