import { default as view } from "./view";

const utils = {
  view
};
export default utils;

if (typeof window !== "undefined") {
  // running in browser
  // inject the utils into window
  window.agsUtils = utils;
}
