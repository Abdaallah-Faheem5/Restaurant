import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/login.css';
import axios from 'axios';
const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_SERVER_URL;

  const handleSubmit = async (e) => {   
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: formData.email,
        password: formData.password
      });   

      if (response.data.success) {
        // Store token in localStorage
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;
        
        // Redirect to home
        navigate('/home');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'حدث خطأ في تسجيل الدخول'
      );
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="overlay"></div>
      <div className="login-card">
        {/* اللوجو الفخم */}
        <div className="logo-container">
          <div className="gold-circle">
            <img src="/logo-icon.png" alt="Restaurant Logo" />
          </div>
        </div>

        <header>
          <h1>نكهة زمان</h1>
          <br></br>
        </header>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-field">
            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              <path d="m22 7-10 5L2 7"></path>
            </svg>
            <input 
              type="email" 
              placeholder="البريد الإلكتروني" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required 
              disabled={loading}
            />
          </div>

          <div className="input-field">
            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <input 
              type="password" 
              placeholder="كلمة المرور" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required 
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="form-footer">
          <span>  ليس لديك حساب؟</span>
          <span className="divider"></span>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }}> انشاء حساب جديد</a>
        </div>
      </div>
    </div>  
  );
};

export default Login;
