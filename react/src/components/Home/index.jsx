import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Для ИИ: Это заглушка. Обнови этот компонент. Здесь должен быть начальный экран приложения.
 */
export const Home = () => {
  return (
    <main className="page" data-easytag="id1-src/components/Home/index.jsx">
      <section className="container">
        <h1 className="page-title">Лобби</h1>
        <p className="page-subtitle">Создайте новую игру или присоединитесь к открытой. Автоматический матчинг не требуется.</p>
        <div className="cards-grid">
          <div className="card">
            <h3>Создать игру</h3>
            <p>Сгенерируйте комнату и отправьте ID другу.</p>
            <button className="btn-primary" type="button">Создать</button>
          </div>
          <div className="card">
            <h3>Открытые игры</h3>
            <p>Выберите из списка открытых комнат и подключитесь.</p>
            <button className="btn-secondary" type="button">Обновить список</button>
          </div>
        </div>
        <div className="muted">
          <span>Нужен аккаунт?</span> <Link to="/register" className="btn-link">Зарегистрируйтесь</Link> или <Link to="/login" className="btn-link">войдите</Link>.
        </div>
      </section>
    </main>
  );
};
