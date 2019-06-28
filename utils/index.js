import { default as jsapi } from './jsapi';
import { default as view } from './view';
// import { default as geometry } from './geometry';
import { default as layer } from './layer';
// import { default as event } from './event';
// import * as ajax from './tool/ajax';
// import axios from './tool/ajax';

import cookies from 'js-cookie';
import qs from 'qs';

const utils = {
  jsapi,
  view,
  // ajax,
  globals: {
    // axios,
    cookies,
    qs,
  },
  layer,
  // geometry,
  // event,
};
export default utils;

if (typeof window !== 'undefined') {
  // running in browser
  // inject the utils into window
  window.agsUtils = utils;
}
