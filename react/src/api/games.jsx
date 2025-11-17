import instance from './axios';
import './interceptors.jsx';

export async function createGame() {
  const res = await instance.post('/api/games');
  return res.data;
}

export async function listOpenGames() {
  const res = await instance.get('/api/games/open');
  return res.data;
}

export async function getGame(id) {
  const res = await instance.get(`/api/games/${id}`);
  return res.data;
}

export async function joinGame(id) {
  const res = await instance.post(`/api/games/${id}/join`);
  return res.data;
}

export async function makeMove(id, position) {
  const res = await instance.post(`/api/games/${id}/move`, { position });
  return res.data;
}

export async function closeGame(id) {
  const res = await instance.post(`/api/games/${id}/close`);
  return res.data;
}

export async function rematch(id) {
  const res = await instance.post(`/api/games/${id}/rematch`);
  return res.data;
}
