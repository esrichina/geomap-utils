import { default as jsapi } from './jsapi';
import { default as view } from './view';
// import { default as geometry } from './geometry';
// import { default as layer } from './layer';
// import { default as event } from './event';

const utils = {
  jsapi,
  view,
  // layer,
  // geometry,
  // event,
};
export default utils;

if (typeof window !== 'undefined') {
  // running in browser
  // inject the utils into window
  window.agsUtils = utils;
}
