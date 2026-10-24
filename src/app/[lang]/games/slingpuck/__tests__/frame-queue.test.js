import { createFrameQueue } from '../ui/frame';

function manualFrames() {
  const scheduled = [];
  const cancelled = [];
  return {
    scheduled,
    cancelled,
    request: callback => { scheduled.push(callback); return scheduled.length; },
    cancel: id => { cancelled.push(id); },
  };
}

test('coalesces pointer moves to the latest value once per frame', () => {
  const frames = manualFrames();
  const applied = [];
  const queue = createFrameQueue(value => applied.push(value), frames);

  queue.push({ x: 1 });
  queue.push({ x: 2 });
  queue.push({ x: 3 });
  expect(applied).toEqual([]);
  expect(frames.scheduled).toHaveLength(1);

  frames.scheduled[0]();
  expect(applied).toEqual([{ x: 3 }]);

  queue.push({ x: 4 });
  expect(frames.scheduled).toHaveLength(2);
});

test('clearing drops the pending value and cancels its frame', () => {
  const frames = manualFrames();
  const applied = [];
  const queue = createFrameQueue(value => applied.push(value), frames);

  queue.push({ x: 1 });
  queue.clear();
  expect(frames.cancelled).toHaveLength(1);
  frames.scheduled[0]();
  expect(applied).toEqual([]);

  // A later push schedules a fresh frame rather than reusing the cleared one.
  queue.push({ x: 2 });
  expect(frames.scheduled).toHaveLength(2);
  frames.scheduled[1]();
  expect(applied).toEqual([{ x: 2 }]);
});
