import { formatClock } from '../ui/format';
import { StartPanel } from '../components/StartPanel';
import { render, screen } from '@testing-library/react';

test('formats the turn clock', () => {
  expect(formatClock(30)).toBe('0:30');
  expect(formatClock(9)).toBe('0:09');
  expect(formatClock(0)).toBe('0:00');
});

test('start panel offers three difficulties and starts disabled until ready', () => {
  const t = key => ({ slingpuck_easy: 'Easy', slingpuck_normal: 'Normal', slingpuck_hard: 'Hard', slingpuck_start: 'Start' }[key] || key);
  const { rerender } = render(<StartPanel difficulty="normal" onDifficulty={() => {}} onStart={() => {}} disabled t={t} />);
  expect(screen.getByRole('button', { name: 'Easy' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Normal' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();
  rerender(<StartPanel difficulty="normal" onDifficulty={() => {}} onStart={() => {}} t={t} />);
  expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled();
});
