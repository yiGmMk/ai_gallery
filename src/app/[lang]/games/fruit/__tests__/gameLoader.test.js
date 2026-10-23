import { loadFruitScripts } from '../gameLoader';

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

test('shares ordered script loading and retries a failed dependency without reloading successes', async () => {
  let deviceReady;
  window.Phaser = { Device: { whenReady(callback) { deviceReady = callback; } } };
  const first = loadFruitScripts();
  expect(loadFruitScripts()).toBe(first);
  await flush();
  const phaser = document.querySelector('script[src="/games/fruit/js/phaser.min.js"]');
  expect(phaser).not.toBeNull();
  phaser.dispatchEvent(new Event('load'));
  await flush();
  const failed = document.querySelector('script[src="/games/fruit/js/gameRules.js"]');
  expect(failed).not.toBeNull();
  const rejected = expect(first).rejects.toThrow('gameRules.js');
  failed.dispatchEvent(new Event('error'));
  await rejected;
  const retry = loadFruitScripts();
  const order = [];
  for (let i = 0; i < 40; i++) {
    await flush();
    const pending = [...document.querySelectorAll('script')].find(script => script !== phaser && !script.dataset.testLoaded);
    if (pending) {
      order.push(pending.src.split('/').pop());
      pending.dataset.testLoaded = 'true';
      pending.dispatchEvent(new Event('load'));
    }
  }
  let ready = false;
  retry.then(() => { ready = true; });
  await flush();
  expect(ready).toBe(false);
  expect(typeof deviceReady).toBe('function');
  deviceReady();
  await retry;
  delete window.Phaser;
  expect(document.querySelectorAll('script[src="/games/fruit/js/phaser.min.js"]')).toHaveLength(1);
  expect(order.indexOf('gameRules.js')).toBeLessThan(order.indexOf('playScene.js'));
  expect(order.indexOf('powerUpObj.js')).toBeLessThan(order.indexOf('playScene.js'));
  expect(order[order.length - 1]).toBe('main.js');
});
