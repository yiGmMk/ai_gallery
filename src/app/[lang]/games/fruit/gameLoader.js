const scripts = [
  'phaser.min.js',
  'gameRules.js',
  'mathTool.js',
  'flameParticle.js',
  'bladeObj.js',
  'fruitObj.js',
  'bombObj.js',
  'powerUpObj.js',
  'bootScene.js',
  'preloadScene.js',
  'mainScene.js',
  'playScene.js',
  'main.js',
];

const loadedScripts = new Set();
let loading;

function loadScript(name) {
  if (loadedScripts.has(name)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `/games/fruit/js/${name}`;
    script.onload = () => {
      script.onload = null;
      script.onerror = null;
      loadedScripts.add(name);
      resolve();
    };
    script.onerror = () => {
      script.remove();
      reject(new Error(`Failed to load ${name}`));
    };
    document.body.appendChild(script);
  });
}

export function loadFruitScripts() {
  if (!loading) {
    loading = scripts.reduce((previous, name) => previous.then(() => loadScript(name)), Promise.resolve())
      // Phaser 2 cannot destroy an instance before its asynchronous device boot.
      .then(() => new Promise(resolve => window.Phaser.Device.whenReady(resolve)))
      .catch(error => {
        loading = null;
        throw error;
      });
  }
  return loading;
}
