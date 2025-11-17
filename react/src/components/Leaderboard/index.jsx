import React, { useEffect, useState } from 'react';
import { leaderboard } from '../../api/leaderboard.jsx';

const Leaderboard = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    leaderboard()
      .then((data) => {
        if (!alive) return;
        setRows(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch(() => {
        if (!alive) return;
        setError('Не удалось загрузить рейтинг');
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="page" data-easytag="id6-src/components/Leaderboard/index.jsx">
      <style>{`
        .lb-wrap { display: grid; gap: 16px; }
        .table { width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 12px; box-shadow: 0 8px 16px rgba(0,0,0,0.08); }
        .table thead th { background: linear-gradient(90deg, #fda4af, #fde68a); padding: 12px; text-align: left; font-weight: 800; }
        .table tbody td { background: #fff; padding: 12px; border-bottom: 1px solid #f3f4f6; }
        .place { font-weight: 800; }
        .name { font-weight: 700; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 999px; font-size: 12px; font-weight: 800; color: white; }
        .b-win { background: #16a34a; }
        .b-loss { background: #ef4444; }
        .b-draw { background: #6b7280; }
        @media (max-width: 640px) {
          .table thead { display: none; }
          .table, .table tbody, .table tr, .table td { display: block; width: 100%; }
          .table tr { margin-bottom: 10px; border: 1px solid #eee; border-radius: 10px; overflow: hidden; }
          .table tbody td { border: none; display: flex; justify-content: space-between; }
          .td-label { font-weight: 700; color: #6b7280; margin-right: 8px; }
        }
      `}</style>
      <section className="container lb-wrap">
        <h1 className="page-title">Рейтинг игроков</h1>
        <p className="page-subtitle">Таблица лидеров по очкам (Elo).</p>

        {loading && <div className="card">Загрузка...</div>}
        {error && <div className="card" role="alert">{error}</div>}

        {!loading && !error && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Игрок</th>
                  <th>Рейтинг</th>
                  <th>W</th>
                  <th>L</th>
                  <th>D</th>
                  <th>Игры</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.username}-${i}`}>
                    <td className="place" data-label="#">{i + 1}</td>
                    <td className="name" data-label="Игрок">
                      {r.display_name || r.username}
                    </td>
                    <td data-label="Рейтинг">{r.rating}</td>
                    <td data-label="W"><span className="badge b-win">{r.wins}</span></td>
                    <td data-label="L"><span className="badge b-loss">{r.losses}</span></td>
                    <td data-label="D"><span className="badge b-draw">{r.draws}</span></td>
                    <td data-label="Игры">{r.games_played}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
};

export default Leaderboard;
