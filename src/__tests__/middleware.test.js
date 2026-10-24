/**
 * @jest-environment node
 */
// Next's middleware runtime uses the Web Fetch API; jsdom does not provide it.
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

const request = path =>
  new NextRequest(`https://games.programnotes.cn${path}`, { headers: { 'accept-language': 'zh-CN,zh;q=0.9' } });

test('image files without a locale prefix are served as-is, not redirected', () => {
  const response = middleware(request('/games/slingpuck/cover.jpeg'));
  expect(response.status).not.toBe(307);
  expect(response.headers.get('location')).toBeNull();
});

test('every public image extension the gallery uses bypasses the locale redirect', () => {
  for (const path of ['/a.jpeg', '/a.png', '/a.webp', '/a.gif']) {
    const response = middleware(request(path));
    expect(response.headers.get('location')).toBeNull();
  }
});

test('page paths still receive the locale prefix', () => {
  const response = middleware(request('/games/slingpuck'));
  expect(response.status).toBe(307);
  expect(response.headers.get('location')).toBe('https://games.programnotes.cn/zh/games/slingpuck/');
});

test('a localized page path is left alone', () => {
  const response = middleware(request('/zh/games/slingpuck'));
  expect(response.headers.get('location')).toBeNull();
});
