import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function parseApiError(e) {
    const status = e?.response?.status;
    const data = e?.response?.data;
    if (data && typeof data === 'object') {
      if (data.detail) return String(data.detail);
      if (data.error) return String(data.error);
      if (data.message) return String(data.message);
    }
    if (status === 400 || status === 401) return 'Неверный логин или пароль';
    return 'Произошла ошибка. Попробуйте позже.';
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Заполните логин и пароль');
      return;
    }
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate('/');
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page" data-easytag="id2-src/components/Auth/Login.jsx">
      <section className="container">
        <h1 className="page-title">Вход</h1>
        <p className="page-subtitle">Введите логин и пароль, чтобы войти в игру.</p>
        <form className="form-card" onSubmit={onSubmit}>
          <div className="form-row">
            <label htmlFor="login-username">Логин</label>
            <input
              id="login-username"
              type="text"
              placeholder="Введите логин"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="form-row">
            <label htmlFor="login-password">Пароль</label>
            <input
              id="login-password"
              type="password"
              placeholder="Введите пароль"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </div>
          {error ? <div className="form-error" role="alert">{error}</div> : null}
          <div className="form-actions">
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Входим…' : 'Войти'}
            </button>
            <Link to="/register" className="btn-link">Нет аккаунта? Зарегистрироваться</Link>
          </div>
        </form>
      </section>
    </main>
  );
};

export default Login;
