import React, { StrictMode } from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import FruitGame from '../content';
import { loadFruitScripts } from '../gameLoader';

jest.mock('../gameLoader', () => ({ loadFruitScripts: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  window.createFruitGame = jest.fn(() => ({ destroy: jest.fn() }));
});

test('unmount during loading cannot create a late game', async () => {
  let complete;
  loadFruitScripts.mockReturnValue(new Promise(resolve => { complete = resolve; }));
  const view = render(<FruitGame lang="en" />);
  view.unmount();
  await act(async () => { complete(); });
  expect(window.createFruitGame).not.toHaveBeenCalled();
});

test('StrictMode creates one owned game and destroys it on unmount', async () => {
  let complete;
  loadFruitScripts.mockReturnValue(new Promise(resolve => { complete = resolve; }));
  const view = render(<StrictMode><FruitGame lang="zh" /></StrictMode>);
  await act(async () => { complete(); });
  expect(window.createFruitGame).toHaveBeenCalledTimes(1);
  expect(window.createFruitGame).toHaveBeenCalledWith('game', 'zh');
  const owned = window.createFruitGame.mock.results[0].value;
  view.unmount();
  expect(owned.destroy).toHaveBeenCalledTimes(1);
});

test('a failed load is visible and can be retried', async () => {
  loadFruitScripts.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
  render(<FruitGame lang="en" />);
  expect(await screen.findByRole('alert')).toHaveTextContent('load');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /retry/i })); });
  expect(window.createFruitGame).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('alert')).toBeNull();
});
