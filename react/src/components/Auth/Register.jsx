import React from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  return (
    <main className="page" data-easytag="id3-src/components/Auth/Register.jsx">
      <section className="container">
        <h1 className="page-title">Регистрация</h1>
        <p className="page-subtitle">Создайте аккаунт, чтобы играть и попадать в рейтинг.</p>
        <form className="form-card" onSubmit={(e) => e.preventDefault()}>
          <div className="form-row">
            <label htmlFor="register-username">Логин</label>
            <input id="register-username" type="text" placeholder="Придумайте логин" autoComplete="username" />
          </div>
          <div className="form-row">
            <label htmlFor="register-password">Пароль</label>
            <input id="register-password" type="password" placeholder="Придумайте пароль" autoComplete="new-password" />
          </div>
          <div className="form-row">
            <label htmlFor="register-password2">Повторите пароль</label>
            <input id="register-password2" type="password" placeholder="Повторите пароль" autoComplete="new-password" />
          </div>
          <div className="form-actions">
            <button className="btn-primary" type="submit">Создать аккаунт</button>
            <Link to="/login" className="btn-link">Уже есть аккаунт? Войти</Link>
          </div>
        </form>
      </section>
    </main>
  );
};

export default Register;
