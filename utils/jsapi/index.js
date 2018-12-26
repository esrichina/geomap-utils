import esriLoader from 'esri-loader';

function load(modules) {
  const opt = {};
  if (window.dojoConfig) {
    opt.dojoConfig = window.dojoConfig;
  }

  if (window.apiRoot) {
    opt.url = window.apiRoot;
  }

  if (!esriLoader.utils.Promise) {
    esriLoader.utils.Promise = window['Promise'];
  }
  return esriLoader.loadModules(modules, opt);
}

export default { load };
