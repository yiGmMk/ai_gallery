// High-rate mice emit several pointer moves per animation frame, and each drag
// update rebuilds geometry. Keep only the newest value and apply it once per
// frame; the queue is also clearable when the drag ends or the game unmounts.
export function createFrameQueue(
  apply,
  {
    request = callback => requestAnimationFrame(callback),
    cancel = id => cancelAnimationFrame(id),
  } = {}
) {
  let frame = null;
  let latest = null;

  const flush = () => {
    frame = null;
    const value = latest;
    latest = null;
    if (value) apply(value);
  };

  return {
    push(value) {
      latest = value;
      if (frame == null) frame = request(flush);
    },
    clear() {
      if (frame != null) cancel(frame);
      frame = null;
      latest = null;
    },
  };
}
