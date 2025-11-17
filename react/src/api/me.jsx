import instance from './axios';
import './interceptors.jsx';

export async function getMe() {
  const res = await instance.get('/api/me');
  return res.data;
}

export async function patchMe(payload) {
  const res = await instance.patch('/api/me', payload);
  return res.data;
}
