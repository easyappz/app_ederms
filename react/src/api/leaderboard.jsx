import instance from './axios';
import './interceptors.jsx';

export async function leaderboard() {
  const res = await instance.get('/api/leaderboard');
  return res.data;
}
