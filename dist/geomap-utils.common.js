/*!
  * geomap-utils v0.1.0
  * (c) 2018 Esri China PS
  * @license MIT
  */
'use strict';

var mapViewUtil = {};

/**
 * ----------------此文件适合 二维通用方法 --------------------
 * 根据幻灯片的名称，切换到对应的视角
 * @author  lee  20181206
 * @param {*} view  场景
 * @param {*} title  幻灯片的名称
 */
function gotoBySliderName(view, title) {
  var slides = view.map.presentation.slides.items;
  var options = {
    duration: 3000,
    maxDuration: 3000
  };
  // 飞行到视线分析 幻灯片
  slides.forEach(function (slide) {
    if (slide.title.text === title) {
      view.goTo(slide.viewpoint, options);
    }
  });
}

var sceneViewUtil = { gotoBySliderName: gotoBySliderName };

var viewUtil = {
  map2d: mapViewUtil,
  map3d: sceneViewUtil
};

var utils = {
  view: viewUtil
};

if (typeof window !== "undefined") {
  // running in browser
  // inject the utils into window
  window.agsUtils = utils;
}

var utils$1 = /*#__PURE__*/Object.freeze({
  default: utils
});

function getCjsExportFromNamespace (n) {
	return n && n.default || n;
}

var require$$0 = getCjsExportFromNamespace(utils$1);

var geomapUtils = require$$0;

module.exports = geomapUtils;
