import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { patchMe } from '../../api/me.jsx';

const Profile = () => {
  const { me, loadMe } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (me?.display_name) setDisplayName(me.display_name);
  }, [me]);

  const stats = useMemo(() => {
    if (!me) return null;
    return {
      rating: me.rating,
      games: me.games_played,
      wins: me.wins,
      losses: me.losses,
      draws: me.draws,
    };
  }, [me]);

  const onSave = useCallback(async () => {
    if (!displayName || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      await patchMe({ display_name: displayName });
      await loadMe();
      setMessage({ kind: 'ok', text: 'Профиль обновлён' });
    } catch (e) {
      setMessage({ kind: 'err', text: 'Не удалось сохранить изменения' });
    } finally {
      setSaving(false);
    }
  }, [displayName, saving, loadMe]);

  if (!me) {
    return (
      <main className="page" data-easytag="id7-src/components/Profile/index.jsx">
        <section className="container">
          <div className="card">Пожалуйста, войдите в систему, чтобы просмотреть профиль.</div>
        </section>
      </main>
    );
  }

  return (
    <main className="page" data-easytag="id7-src/components/Profile/index.jsx">
      <style>{`
        .profile-wrap { display: grid; gap: 16px; }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .card-smooth { background: linear-gradient(135deg, #d9f99d, #a7f3d0); padding: 16px; border-radius: 14px; box-shadow: 0 8px 16px rgba(0,0,0,0.08); border: 2px solid rgba(255,255,255,0.6); }
        .form { display: grid; gap: 12px; }
        .row { display: grid; gap: 6px; }
        .label { font-weight: 700; }
        .input { padding: 10px 12px; border-radius: 10px; border: 1px solid #d1d5db; font-size: 16px; }
        .btn { padding: 10px 14px; border: none; border-radius: 10px; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; font-weight: 800; cursor: pointer; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .msg { padding: 8px 10px; border-radius: 10px; font-weight: 700; }
        .ok { background: #dcfce7; color: #166534; }
        .err { background: #fee2e2; color: #991b1b; }
        @media (max-width: 720px) { .grid { grid-template-columns: 1fr; } }
      `}</style>
      <section className="container profile-wrap">
        <h1 className="page-title">Профиль пользователя</h1>

        {message && (
          <div className={`msg ${message.kind === 'ok' ? 'ok' : 'err'}`}>{message.text}</div>
        )}

        <div className="grid">
          <div className="card-smooth">
            <div className="form">
              <div className="row">
                <label className="label">Логин</label>
                <div>{me.username}</div>
              </div>
              <div className="row">
                <label className="label" htmlFor="display">Отображаемое имя</label>
                <input
                  id="display"
                  className="input"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ваше имя в игре"
                />
              </div>
              <div>
                <button className="btn" onClick={onSave} disabled={saving || !displayName.trim()}>Сохранить</button>
              </div>
            </div>
          </div>

          <div className="card-smooth">
            <div className="row"><span className="label">Рейтинг:</span> <span>{stats?.rating}</span></div>
            <div className="row"><span className="label">Сыграно игр:</span> <span>{stats?.games}</span></div>
            <div className="row"><span className="label">Побед:</span> <span>{stats?.wins}</span></div>
            <div className="row"><span className="label">Поражений:</span> <span>{stats?.losses}</span></div>
            <div className="row"><span className="label">Ничьих:</span> <span>{stats?.draws}</span></div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Profile;
