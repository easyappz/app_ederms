import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <main className="page" data-easytag="id8-src/components/NotFound/index.jsx">
      <section className="container">
        <h1 className="page-title">Страница не найдена</h1>
        <p className="page-subtitle">Кажется, вы зашли не туда.</p>
        <div className="card">
          <Link to="/" className="btn-primary">Вернуться в лобби</Link>
        </div>
      </section>
    </main>
  );
};

export default NotFound;
