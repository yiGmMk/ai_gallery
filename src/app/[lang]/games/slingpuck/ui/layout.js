// The board must fit between the page header and the hint strip without the
// canvas sliding under the fold on phones. 100dvh accounts for browser chrome
// that 100vh ignores; the 260px reserve is the header, paddings and hint.
export function boardHeightClass() {
  return 'h-[min(calc(100dvh-260px),880px)] min-h-[420px]';
}
