import { formatClock } from '../ui/format';
import { StartPanel } from '../components/StartPanel';
import { GameHud } from '../components/GameHud';
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

const tAs = key => ({
  slingpuck_easy: 'Easy', slingpuck_normal: 'Normal', slingpuck_hard: 'Hard', slingpuck_start: 'Start',
  slingpuck_mode_turns: 'Turn-based', slingpuck_mode_free: 'Free mode',
  slingpuck_how_to: 'Turns how-to', slingpuck_how_to_free: 'Free how-to',
  slingpuck_free_label: 'Free mode', slingpuck_ai: 'AI', slingpuck_player: 'You',
}[key] || key);

test('start panel switches between turn-based and free mode', () => {
  const onGameMode = jest.fn();
  const { rerender } = render(
    <StartPanel gameMode="turns" onGameMode={onGameMode} difficulty="normal" onDifficulty={() => {}} onStart={() => {}} t={tAs} />
  );
  expect(screen.getByRole('button', { name: 'Turn-based' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Free mode' })).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByText('Turns how-to')).toBeInTheDocument();
  screen.getByRole('button', { name: 'Free mode' }).click();
  expect(onGameMode).toHaveBeenCalledWith('free');

  rerender(
    <StartPanel gameMode="free" onGameMode={onGameMode} difficulty="normal" onDifficulty={() => {}} onStart={() => {}} t={tAs} />
  );
  expect(screen.getByRole('button', { name: 'Free mode' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText('Free how-to')).toBeInTheDocument();
  expect(screen.queryByText('Turns how-to')).not.toBeInTheDocument();
});

test('free-mode HUD shows the mode label and no clock or turn message', () => {
  render(
    <GameHud gameMode="free" side="player" counts={{ player: 4, opponent: 6 }} timeLeft={30} power={0}
      dragging={false} message="Your turn" muted={false} onToggleSound={() => {}} t={tAs} />
  );
  expect(screen.getByText('Free mode')).toBeInTheDocument();
  expect(screen.queryByText('0:30')).not.toBeInTheDocument();
  expect(screen.queryByText('Your turn')).not.toBeInTheDocument();
  expect(screen.getByText('4')).toBeInTheDocument();
  expect(screen.getByText('6')).toBeInTheDocument();
});

test('turn-mode HUD keeps the clock and the turn message', () => {
  render(
    <GameHud gameMode="turns" side="player" counts={{ player: 4, opponent: 6 }} timeLeft={30} power={0}
      dragging={false} message="Your turn" muted={false} onToggleSound={() => {}} t={tAs} />
  );
  expect(screen.getByText('0:30')).toBeInTheDocument();
  expect(screen.getByText('Your turn')).toBeInTheDocument();
  expect(screen.queryByText('Free mode')).not.toBeInTheDocument();
});
