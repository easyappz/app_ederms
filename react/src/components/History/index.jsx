import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { myGames } from '../../api/history.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const outcomeLabel = (g) => {
  if (g?.outcome === 'win') return { text: 'Победа', kind: 'win' };
  if (g?.outcome === 'loss') return { text: 'Поражение', kind: 'loss' };
  if (g?.outcome === 'draw') return { text: 'Ничья', kind: 'draw' };
  if (g?.status === 'in_progress') return { text: 'Идёт игра', kind: 'progress' };
  return { text: '—', kind: 'neutral' };
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('ru-RU');
  } catch (e) {
    return dateStr;
  }
}

const History = () => {
  const navigate = useNavigate();
  const { me } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await myGames({ limit, offset });
      setItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      setError('Не удалось загрузить историю игр');
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    load();
  }, [load]);

  const canPrev = offset > 0;
  const canNext = items.length === limit; // эвристика

  const rows = useMemo(() => {
    return items.map((g) => {
      let opponent = '—';
      if (me?.username) {
        if (g.creator_username && g.creator_username !== me.username) opponent = g.creator_username;
        if (g.opponent_username && g.opponent_username !== me.username) opponent = g.opponent_username;
        if (!g.opponent_username && g.creator_username === me.username) opponent = 'Ожидание соперника';
      } else {
        opponent = g.opponent_username || g.creator_username || '—';
      }
      return { ...g, opponent };
    });
  }, [items, me]);

  return (
    <main className="page" data-easytag="id5-src/components/History/index.jsx">
      <style>{`
        .history-wrap { display: grid; gap: 16px; }
        .list { display: grid; gap: 10px; }
        .row { display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: center; background: linear-gradient(135deg, #e9d5ff, #bfdbfe); padding: 12px; border-radius: 12px; cursor: pointer; box-shadow: 0 6px 12px rgba(0,0,0,0.08); transition: transform 0.12s ease, box-shadow 0.12s ease; }
        .row:hover { transform: translateY(-1px); box-shadow: 0 10px 16px rgba(0,0,0,0.1); }
        .badge { padding: 6px 10px; border-radius: 999px; font-weight: 700; color: white; }
        .b-win { background: #16a34a; }
        .b-loss { background: #ef4444; }
        .b-draw { background: #6b7280; }
        .b-progress { background: #0ea5e9; }
        .controls { display: flex; gap: 10px; justify-content: center; }
        .btn { padding: 8px 12px; border: none; border-radius: 10px; background: #0ea5e9; color: white; font-weight: 700; cursor: pointer; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
      <section className="container history-wrap">
        <h1 className="page-title">История игр</h1>
        <p className="page-subtitle">Список сыгранных вами партий и их исходы.</p>

        {loading && <div className="card">Загрузка...</div>}
        {error && <div className="card" role="alert">{error}</div>}

        {!loading && !error && (
          <>
            {rows.length === 0 ? (
              <div className="card">Пока тут пусто. Сыграйте свою первую партию!</div>
            ) : (
              <div className="list">
                {rows.map((g) => {
                  const badge = outcomeLabel(g);
                  return (
                    <div key={g.id} className="row" onClick={() => navigate(`/game/${g.id}`)}>
                      <div>
                        <div><strong>Противник:</strong> {g.opponent}</div>
                        <div className="muted">Игра #{g.id}</div>
                      </div>
                      <div className="muted">{formatDate(g.finished_at || g.created_at)}</div>
                      <div className={`badge ${
                        badge.kind === 'win' ? 'b-win' : badge.kind === 'loss' ? 'b-loss' : badge.kind === 'draw' ? 'b-draw' : 'b-progress'
                      }`}>{badge.text}</div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="controls">
              <button className="btn" onClick={() => setOffset((o) => Math.max(0, o - limit))} disabled={!canPrev}>Назад</button>
              <button className="btn" onClick={() => setOffset((o) => o + limit)} disabled={!canNext}>Вперёд</button>
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default History;
