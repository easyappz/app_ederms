import React, { useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const Layout = () => {
  const navigate = useNavigate();
  const { token, me, logout } = useAuth();

  const isAuthed = Boolean(token);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  const getLinkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

  return (
    <div className="app-shell" data-easytag="id0-src/components/Layout/index.jsx">
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
              <>
                <span className="user-greeting">{me?.display_name || me?.username || 'Игрок'}</span>
                <button type="button" className="btn-logout" onClick={handleLogout}>Выйти</button>
              </>
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
