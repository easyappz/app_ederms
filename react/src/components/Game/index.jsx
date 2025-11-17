import React from 'react';
import { useParams } from 'react-router-dom';

const GameBoard = () => {
  const { id } = useParams();
  return (
    <main className="page" data-easytag="id4-src/components/Game/index.jsx">
      <section className="container">
        <h1 className="page-title">Игровое поле</h1>
        <p className="page-subtitle">ID игры: <span className="code">{id}</span></p>
        <div className="card">
          <p>Здесь будет игровое поле 3x3, ходы, исходы и кнопка «Реванш».</p>
        </div>
      </section>
    </main>
  );
};

export default GameBoard;
