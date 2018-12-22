import esriLoader from 'esri-loader';

let mode = null;
const MODE_REQUIRE = 'require';
const MODE_ESRI_LOADER = 'esri-loader';

const DEFAULT_URL = 'https://js.arcgis.com/4.10/';

function load(modules) {
  if (!mode) {
    mode = document.querySelector('script[data-esri-loader]') ? MODE_ESRI_LOADER : MODE_REQUIRE;
  }

  return new Promise((resolve, reject) => {
    if (mode === MODE_REQUIRE) {
      require(modules, (...m) => {
        resolve(m);
      });
    } else {
      const opt = {};
      if (window.dojoConfig) {
        opt.dojoConfig = window.dojoConfig;
      }

      if (window.apiRoot) {
        opt.url = window.apiRoot;
      } else {
        opt.url = DEFAULT_URL;
      }

      esriLoader.loadModules(modules, opt).then((...m) => {
        resolve(m);
      });
    }
  });
}

export default { load };
