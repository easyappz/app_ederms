import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getGame, makeMove, closeGame, rematch } from '../../api/games.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const statusMap = {
  open: 'Открыта',
  in_progress: 'Идёт игра',
  finished: 'Завершена',
  closed: 'Закрыта',
};

const resultMap = {
  x_win: 'Победа X',
  o_win: 'Победа O',
  draw: 'Ничья',
};

function usePolling(callback, delayMs) {
  const savedCallback = useRef(callback);
  const timerRef = useRef(null);
  const inFlight = useRef(false);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      if (inFlight.current) return;
      inFlight.current = true;
      Promise.resolve(savedCallback.current())
        .catch(() => {})
        .finally(() => {
          inFlight.current = false;
        });
    }

    if (typeof delayMs === 'number' && delayMs > 0) {
      timerRef.current = setInterval(tick, delayMs);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }

    return undefined;
  }, [delayMs]);
}

const GameBoard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { me } = useAuth();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actLoading, setActLoading] = useState(false);

  const fetchGame = useCallback(async () => {
    try {
      const data = await getGame(id);
      setGame(data);
      setError(null);
    } catch (e) {
      setError('Не удалось загрузить игру');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchGame();
    return () => {};
  }, [fetchGame]);

  usePolling(fetchGame, 2000);

  const board = useMemo(() => (game?.board && game.board.length === 9 ? game.board : Array(9).fill('')), [game]);

  const meId = me?.id || null;
  const yourSymbol = useMemo(() => {
    if (!game || !meId) return null;
    if (game.x_player === meId) return 'X';
    if (game.o_player === meId) return 'O';
    return null;
  }, [game, meId]);

  const isYourTurn = useMemo(() => {
    if (!game) return false;
    if (game.status !== 'in_progress') return false;
    if (!yourSymbol) return false;
    return game.next_turn === yourSymbol;
  }, [game, yourSymbol]);

  const canMoveAt = useCallback(
    (pos) => {
      if (!isYourTurn) return false;
      if (!Array.isArray(board) || board.length !== 9) return false;
      return board[pos] === '';
    },
    [isYourTurn, board]
  );

  const handleCellClick = useCallback(
    async (pos) => {
      if (!canMoveAt(pos)) return;
      setActLoading(true);
      try {
        const updated = await makeMove(id, pos);
        setGame(updated);
      } catch (e) {
        // ignore, error interceptor will handle
      } finally {
        setActLoading(false);
      }
    },
    [canMoveAt, id]
  );

  const showClose = useMemo(() => {
    if (!game || !meId) return false;
    return game.creator === meId && (game.status === 'open' || game.status === 'finished');
  }, [game, meId]);

  const onCloseGame = useCallback(async () => {
    if (!showClose) return;
    setActLoading(true);
    try {
      const updated = await closeGame(id);
      setGame(updated);
    } catch (e) {
      // handled by interceptor
    } finally {
      setActLoading(false);
    }
  }, [id, showClose]);

  const showRematch = useMemo(() => {
    if (!game) return false;
    return game.status === 'finished';
  }, [game]);

  const onRematch = useCallback(async () => {
    if (!showRematch) return;
    setActLoading(true);
    try {
      const newGame = await rematch(id);
      navigate(`/game/${newGame.id}`);
    } catch (e) {
      // handled by interceptor
    } finally {
      setActLoading(false);
    }
  }, [id, showRematch, navigate]);

  const turnText = useMemo(() => {
    if (!game) return '';
    if (game.status === 'finished') {
      if (!game.result) return 'Игра завершена';
      return `Игра завершена: ${resultMap[game.result] || '—'}`;
    }
    if (game.status === 'open') return 'Ожидание соперника';
    if (game.status === 'in_progress') return `Ход: ${game.next_turn || '—'}`;
    return statusMap[game.status] || '';
  }, [game]);

  return (
    <main className="page" data-easytag="id4-src/components/Game/index.jsx">
      <style>{`
        .game-wrapper { display: grid; gap: 16px; }
        .game-header { display: grid; gap: 8px; }
        .players { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .player-card { background: linear-gradient(135deg, #ffe680, #ffd1dc); padding: 12px; border-radius: 12px; box-shadow: 0 6px 14px rgba(0,0,0,0.1); border: 2px solid rgba(255,255,255,0.6); }
        .player-title { font-weight: 700; }
        .you-pill { display: inline-block; margin-left: 8px; padding: 2px 8px; border-radius: 999px; background: #0ea5e9; color: white; font-size: 12px; }
        .status-banner { background: linear-gradient(90deg, #84fab0, #8fd3f4); border-radius: 12px; padding: 10px 14px; font-weight: 600; box-shadow: 0 6px 14px rgba(0,0,0,0.08); }

        .board { width: 100%; max-width: 360px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .cell { position: relative; aspect-ratio: 1 / 1; border-radius: 16px; border: 2px solid #222; background: radial-gradient(circle at 30% 30%, #fff7ed, #ffd1dc); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 40px; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.2s ease; box-shadow: 0 8px 16px rgba(0,0,0,0.12); }
        .cell:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 12px 20px rgba(0,0,0,0.16); }
        .cell:active { transform: translateY(0) scale(0.98); }
        .cell.disabled { cursor: not-allowed; filter: grayscale(0.3) brightness(0.95); opacity: 0.8; }
        .symbol-x { color: #ef4444; text-shadow: 0 2px 0 rgba(0,0,0,0.2); }
        .symbol-o { color: #2563eb; text-shadow: 0 2px 0 rgba(0,0,0,0.2); }

        .panel { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
        .btn { padding: 10px 14px; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; box-shadow: 0 6px 12px rgba(0,0,0,0.12); transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.2s ease; }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 8px 14px rgba(0,0,0,0.16); }
        .btn:active { transform: translateY(0); }
        .btn-primary { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; }
        .btn-warn { background: linear-gradient(135deg, #f97316, #ef4444); color: #fff; }
        .btn[disabled] { opacity: 0.6; cursor: not-allowed; }

        @media (max-width: 480px) {
          .players { grid-template-columns: 1fr; }
          .board { max-width: 100%; gap: 8px; }
          .cell { border-radius: 12px; font-size: 34px; }
        }
      `}</style>
      <section className="container game-wrapper">
        <h1 className="page-title">Игровое поле</h1>
        <p className="page-subtitle">ID игры: <span className="code">{id}</span></p>

        {loading && (
          <div className="card">Загрузка...</div>
        )}

        {error && (
          <div className="card" role="alert">{error}</div>
        )}

        {!loading && !error && game && (
          <>
            <div className="game-header">
              <div className="players">
                <div className="player-card">
                  <div className="player-title">Игрок X</div>
                  <div className="player-name">{game.x_player_username || '—'} {yourSymbol === 'X' ? <span className="you-pill">Вы</span> : null}</div>
                </div>
                <div className="player-card">
                  <div className="player-title">Игрок O</div>
                  <div className="player-name">{game.o_player_username || '—'} {yourSymbol === 'O' ? <span className="you-pill">Вы</span> : null}</div>
                </div>
              </div>
              <div className="status-banner">{turnText}</div>
            </div>

            <div className="board" aria-label="Игровое поле 3 на 3">
              {board.map((cell, idx) => {
                const filled = cell === 'X' || cell === 'O';
                const disabled = actLoading || !canMoveAt(idx);
                const symbolClass = cell === 'X' ? 'symbol-x' : cell === 'O' ? 'symbol-o' : '';
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`cell ${disabled ? 'disabled' : ''}`}
                    aria-label={`Клетка ${idx + 1} ${filled ? 'занята' : 'свободна'}`}
                    onClick={() => handleCellClick(idx)}
                    disabled={actLoading || (filled ? true : !isYourTurn)}
                  >
                    {cell && <span className={symbolClass}>{cell}</span>}
                  </button>
                );
              })}
            </div>

            <div className="panel">
              {showClose && (
                <button className="btn btn-warn" type="button" onClick={onCloseGame} disabled={actLoading}>
                  Закрыть игру
                </button>
              )}
              {showRematch && (
                <button className="btn btn-primary" type="button" onClick={onRematch} disabled={actLoading}>
                  Реванш
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default GameBoard;
