import instance from './axios';
import './interceptors.jsx';

export async function myGames({ limit, offset } = {}) {
  const params = {};
  if (typeof limit === 'number') params.limit = limit;
  if (typeof offset === 'number') params.offset = offset;
  const res = await instance.get('/api/my/games', { params });
  return res.data;
}
