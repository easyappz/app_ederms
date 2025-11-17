import React from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <main className="page" data-easytag="id2-src/components/Auth/Login.jsx">
      <section className="container">
        <h1 className="page-title">Вход</h1>
        <p className="page-subtitle">Введите логин и пароль, чтобы войти в игру.</p>
        <form className="form-card" onSubmit={(e) => e.preventDefault()}>
          <div className="form-row">
            <label htmlFor="login-username">Логин</label>
            <input id="login-username" type="text" placeholder="Введите логин" autoComplete="username" />
          </div>
          <div className="form-row">
            <label htmlFor="login-password">Пароль</label>
            <input id="login-password" type="password" placeholder="Введите пароль" autoComplete="current-password" />
          </div>
          <div className="form-actions">
            <button className="btn-primary" type="submit">Войти</button>
            <Link to="/register" className="btn-link">Нет аккаунта? Зарегистрироваться</Link>
          </div>
        </form>
      </section>
    </main>
  );
};

export default Login;
