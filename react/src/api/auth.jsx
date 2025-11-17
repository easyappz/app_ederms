import instance from './axios';
import './interceptors.jsx';

export async function register(data) {
  const res = await instance.post('/api/auth/register', data);
  return res.data;
}

export async function login(data) {
  const res = await instance.post('/api/auth/login', data);
  return res.data;
}

export async function logout() {
  const res = await instance.post('/api/auth/logout');
  try {
    localStorage.removeItem('token');
  } catch (e) {
    // ignore
  }
  return res.status;
}
