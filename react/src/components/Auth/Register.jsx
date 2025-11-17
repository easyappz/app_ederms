import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as apiRegister } from '../../api/auth.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
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
    if (status === 400) return 'Некорректные данные регистрации';
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
      await apiRegister({ username: username.trim(), password, display_name: displayName || undefined });
      await login(username.trim(), password);
      navigate('/');
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page" data-easytag="id3-src/components/Auth/Register.jsx">
      <section className="container">
        <h1 className="page-title">Регистрация</h1>
        <p className="page-subtitle">Создайте аккаунт, чтобы играть и попадать в рейтинг.</p>
        <form className="form-card" onSubmit={onSubmit}>
          <div className="form-row">
            <label htmlFor="register-username">Логин</label>
            <input
              id="register-username"
              type="text"
              placeholder="Придумайте логин"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="form-row">
            <label htmlFor="register-password">Пароль</label>
            <input
              id="register-password"
              type="password"
              placeholder="Придумайте пароль"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="form-row">
            <label htmlFor="register-display-name">Отображаемое имя (необязательно)</label>
            <input
              id="register-display-name"
              type="text"
              placeholder="Введите имя для отображения"
              autoComplete="nickname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={submitting}
            />
          </div>
          {error ? <div className="form-error" role="alert">{error}</div> : null}
          <div className="form-actions">
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Создаём…' : 'Создать аккаунт'}
            </button>
            <Link to="/login" className="btn-link">Уже есть аккаунт? Войти</Link>
          </div>
        </form>
      </section>
    </main>
  );
};

export default Register;
