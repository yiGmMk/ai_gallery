import { boardHeightClass } from '../ui/layout';

test('board height leaves room for the page header and footer hint', () => {
  const classes = boardHeightClass();
  // 100dvh minus the page header (~150px) and the hint strip below the board
  // (~50px); a dvh viewport shrinks with mobile browser chrome.
  expect(classes).toMatch(/^h-\[min\(/);
  expect(classes).toContain('dvh');
  const pxCap = Number(classes.match(/min\(calc\([^,]*\),\s*(\d+)px\)/)?.[1]);
  expect(pxCap).toBeGreaterThanOrEqual(600);
  expect(pxCap).toBeLessThanOrEqual(900);
});
