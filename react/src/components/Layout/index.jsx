import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const Layout = () => {
  const navigate = useNavigate();
  const [authTick, setAuthTick] = useState(0);

  const isAuthed = useMemo(() => Boolean(localStorage.getItem('access')), [authTick]);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
    } catch (e) {
      // no-op
    }
    setAuthTick((v) => v + 1);
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    const onStorage = () => setAuthTick((v) => v + 1);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const getLinkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <div className="brand" onClick={() => navigate('/')}>Крестики-нолики</div>
          <nav className="nav">
            <NavLink to="/" end className={getLinkClass}>Лобби</NavLink>
            <NavLink to="/history" className={getLinkClass}>История</NavLink>
            <NavLink to="/leaderboard" className={getLinkClass}>Рейтинг</NavLink>
            <NavLink to="/profile" className={getLinkClass}>Профиль</NavLink>
          </nav>
          <div className="auth-controls">
            {!isAuthed ? (
              <NavLink to="/login" className="btn-login">Войти</NavLink>
            ) : (
              <button type="button" className="btn-logout" onClick={handleLogout}>Выйти</button>
            )}
          </div>
        </div>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
      <footer className="app-footer">© {new Date().getFullYear()} Игра «Крестики-нолики»</footer>
    </div>
  );
};

export default Layout;
