import esriLoader from 'esri-loader';

function load(modules) {
  const opt = {};
  if (window.dojoConfig) {
    opt.dojoConfig = window.dojoConfig;
  }

  if (window.apiRoot) {
    opt.url = window.apiRoot;
  }

  return esriLoader.loadModules(modules);
}

export default { load };
