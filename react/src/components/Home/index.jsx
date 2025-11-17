import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createGame, joinGame, listOpenGames } from '../../api/games.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const POLL_MS = 5000;

function formatDateTime(value) {
  try {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return '';
  }
}

function extractCreatedAt(game) {
  return (
    game?.created_at ||
    game?.created ||
    game?.createdAt ||
    game?.created_time ||
    game?.createdTime ||
    game?.timestamp ||
    null
  );
}

function extractCreatorName(game) {
  return (
    game?.creator_name ||
    game?.creator?.username ||
    game?.creator_username ||
    game?.owner?.username ||
    game?.owner_name ||
    (typeof game?.creator === 'string' ? game.creator : null) ||
    'Неизвестно'
  );
}

function isOwnGame(game, me) {
  if (!game || !me) return false;
  const idCandidates = [game.creator_id, game.creator?.id, game.owner_id, game.owner?.id];
  if (me.id && idCandidates.some((x) => x !== undefined && x !== null && String(x) === String(me.id))) return true;
  const nameCandidates = [game.creator_name, game.creator?.username, game.owner_name, game.owner?.username];
  if (me.username && nameCandidates.some((x) => x && String(x) === String(me.username))) return true;
  return false;
}

export const Home = () => {
  const navigate = useNavigate();
  const { token, me } = useAuth();

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [joiningId, setJoiningId] = useState(null);
  const timerRef = useRef(null);

  const canInteract = useMemo(() => Boolean(token), [token]);

  const loadGames = useCallback(async (withSpinner = false) => {
    if (!canInteract) return; // avoid 401 redirect
    try {
      if (withSpinner) setLoading(true);
      setError('');
      const data = await listOpenGames();
      const list = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
      setGames(list);
    } catch (e) {
      setError('Не удалось загрузить список игр. Попробуйте позже.');
    } finally {
      if (withSpinner) setLoading(false);
    }
  }, [canInteract]);

  useEffect(() => {
    if (!canInteract) {
      setGames([]);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return undefined;
    }

    loadGames(true);
    timerRef.current = setInterval(() => {
      loadGames(false);
    }, POLL_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [canInteract, loadGames]);

  const handleCreate = useCallback(async () => {
    if (!canInteract || creating) return;
    setCreating(true);
    try {
      const res = await createGame();
      const gameId = res?.id || res?.game?.id;
      if (gameId) {
        navigate(`/game/${gameId}`);
      } else {
        throw new Error('Invalid response');
      }
    } catch (e) {
      setError('Не удалось создать игру. Попробуйте снова.');
    } finally {
      setCreating(false);
    }
  }, [canInteract, creating, navigate]);

  const handleJoin = useCallback(async (id) => {
    if (!canInteract || joiningId) return;
    setJoiningId(id);
    try {
      const res = await joinGame(id);
      const gameId = res?.id || res?.game?.id || id;
      navigate(`/game/${gameId}`);
    } catch (e) {
      setError('Не удалось подключиться к игре. Возможно, она уже недоступна.');
      // refresh list after failure
      loadGames(false);
    } finally {
      setJoiningId(null);
    }
  }, [canInteract, joiningId, navigate, loadGames]);

  const renderAuthCTA = () => (
    <div style={{
      background: 'linear-gradient(135deg, #6EE7F9 0%, #A78BFA 50%, #F472B6 100%)',
      borderRadius: 16,
      padding: 24,
      color: '#111827',
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    }}>
      <h1 style={{ margin: 0, marginBottom: 8, fontSize: 28, fontWeight: 800 }}>Лобби</h1>
      <p style={{ marginTop: 0, marginBottom: 16 }}>Войдите в аккаунт, чтобы создавать игры и присоединяться к открытым столам.</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/login" className="btn-primary" style={styles.primaryButton}>Войти</Link>
        <Link to="/register" className="btn-secondary" style={styles.secondaryButton}>Зарегистрироваться</Link>
      </div>
    </div>
  );

  const renderControls = () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>Лобби</h1>
        <p style={{ marginTop: 6, color: '#6B7280' }}>Создайте новую игру или подключитесь к открытой. Список обновляется каждые {Math.floor(POLL_MS / 1000)} сек.</p>
      </div>
      <button type="button" onClick={handleCreate} disabled={!canInteract || creating} style={{ ...styles.primaryButton, opacity: creating ? 0.7 : 1 }}>
        {creating ? 'Создание…' : 'Создать игру'}
      </button>
    </div>
  );

  const renderGameCard = (game) => {
    const own = isOwnGame(game, me);
    const creator = extractCreatorName(game);
    const createdAt = formatDateTime(extractCreatedAt(game));

    return (
      <div key={game.id || `${creator}-${createdAt}`} style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={styles.avatarPlaceholder} aria-hidden="true" />
            <div>
              <div style={{ fontWeight: 700, color: '#111827' }}>{creator}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{createdAt ? `Создана: ${createdAt}` : 'Создана: —'}</div>
            </div>
          </div>
          {own ? (
            <span style={{ ...styles.badge, background: '#FEF3C7', color: '#92400E' }}>Ваша игра</span>
          ) : null}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => handleJoin(game.id)}
            disabled={!canInteract || own || joiningId === game.id}
            style={{
              ...styles.secondaryButton,
              cursor: !canInteract || own ? 'not-allowed' : 'pointer',
              opacity: joiningId === game.id || own ? 0.6 : 1,
            }}
          >
            {joiningId === game.id ? 'Подключение…' : 'Подключиться'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <main className="page" data-easytag="id1-src/components/Home/index.jsx" style={{ padding: '24px 16px' }}>
      <section className="container" style={styles.container}>
        {!canInteract ? (
          renderAuthCTA()
        ) : (
          <>
            {renderControls()}
            <div style={{ height: 16 }} />
            {error ? (
              <div role="alert" style={styles.errorBox}>{error}</div>
            ) : null}
            <div style={styles.listHeader}>
              <h2 style={{ margin: 0, fontSize: 18, color: '#374151' }}>Открытые игры</h2>
              <button type="button" onClick={() => loadGames(true)} disabled={loading} style={{ ...styles.linkButton, opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Обновление…' : 'Обновить список'}
              </button>
            </div>
            {games && games.length > 0 ? (
              <div style={styles.grid}>
                {games.map((g) => renderGameCard(g))}
              </div>
            ) : (
              <div style={styles.empty}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Пока нет открытых игр</div>
                <div style={{ color: '#6B7280' }}>Создайте свою игру или дождитесь, когда кто-то откроет стол.</div>
              </div>
            )}
          </>
        )}

        <div style={{ height: 24 }} />
        <div className="muted" style={{ textAlign: 'center', color: '#6B7280' }}>
          {!canInteract ? (
            <>
              <span>Уже есть аккаунт?</span> <Link to="/login" className="btn-link" style={styles.inlineLink}>Войти</Link>
              <span> · Нет аккаунта?</span> <Link to="/register" className="btn-link" style={styles.inlineLink}>Зарегистрироваться</Link>
            </>
          ) : (
            <>
              <span>Хотите изменить профиль?</span> <Link to="/profile" className="btn-link" style={styles.inlineLink}>Профиль</Link>
              <span> · Посмотреть предыдущие партии?</span> <Link to="/history" className="btn-link" style={styles.inlineLink}>История игр</Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
};

const styles = {
  container: {
    maxWidth: 980,
    margin: '0 auto',
  },
  listHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 16,
  },
  card: {
    background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)',
    borderRadius: 14,
    padding: 16,
    boxShadow: '0 8px 20px rgba(31, 41, 55, 0.08)',
    border: '1px solid #E5E7EB',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #60A5FA, #F472B6)',
    boxShadow: '0 4px 10px rgba(0,0,0,0.15) inset',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 10,
    padding: '10px 14px',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 10px 20px rgba(16, 185, 129, 0.25)'
  },
  secondaryButton: {
    background: '#111827',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 10,
    padding: '10px 14px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 10px 20px rgba(17, 24, 39, 0.25)'
  },
  linkButton: {
    background: 'transparent',
    color: '#2563EB',
    border: 'none',
    padding: 0,
    fontWeight: 700,
    cursor: 'pointer',
  },
  empty: {
    border: '1px dashed #D1D5DB',
    borderRadius: 12,
    padding: 18,
    textAlign: 'center',
    color: '#374151',
    background: '#F9FAFB',
  },
  errorBox: {
    background: '#FEF2F2',
    color: '#991B1B',
    border: '1px solid #FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  inlineLink: {
    color: '#2563EB',
    textDecoration: 'none',
    fontWeight: 700,
    marginLeft: 6,
  },
};

export default Home;
