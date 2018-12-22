import { default as jsapi } from "./jsapi";
import { default as view } from "./view";

const utils = {
  jsapi,
  view
};
export default utils;

if (typeof window !== "undefined") {
  // running in browser
  // inject the utils into window
  window.agsUtils = utils;
}
