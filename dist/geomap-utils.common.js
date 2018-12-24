/*!
  * geomap-utils v0.1.0
  * (c) 2018 Esri China PS
  * @license MIT
  */
'use strict';

function createStylesheetLink(url) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    return link;
}
// TODO: export this function?
// check if the css url has been injected or added manually
function getCss(url) {
    return document.querySelector("link[href*=\"" + url + "\"]");
}
// lazy load the CSS needed for the ArcGIS API
function loadCss(url) {
    var link = getCss(url);
    if (!link) {
        // create & load the css library
        link = createStylesheetLink(url);
        document.head.appendChild(link);
    }
    return link;
}

/*
  Copyright 2017 Esri
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
var isBrowser = typeof window !== 'undefined';
var DEFAULT_URL = 'https://js.arcgis.com/4.10/';
// this is the url that is currently being, or already has loaded
var _currentUrl;
function createScript(url) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.setAttribute('data-esri-loader', 'loading');
    return script;
}
// add a one-time load handler to script
// and optionally add a one time error handler as well
function handleScriptLoad(script, callback, errback) {
    var onScriptError;
    if (errback) {
        // set up an error handler as well
        onScriptError = handleScriptError(script, errback);
    }
    var onScriptLoad = function () {
        // pass the script to the callback
        callback(script);
        // remove this event listener
        script.removeEventListener('load', onScriptLoad, false);
        if (onScriptError) {
            // remove the error listener as well
            script.removeEventListener('error', onScriptError, false);
        }
    };
    script.addEventListener('load', onScriptLoad, false);
}
// add a one-time error handler to the script
function handleScriptError(script, callback) {
    var onScriptError = function (e) {
        // reject the promise and remove this event listener
        callback(e.error || new Error("There was an error attempting to load " + script.src));
        // remove this event listener
        script.removeEventListener('error', onScriptError, false);
    };
    script.addEventListener('error', onScriptError, false);
    return onScriptError;
}
// allow consuming libraries to provide their own Promise implementations
var utils = {
    Promise: isBrowser ? window['Promise'] : undefined
};
// get the script injected by this library
function getScript() {
    return document.querySelector('script[data-esri-loader]');
}
// has ArcGIS API been loaded on the page yet?
function isLoaded() {
    var globalRequire = window['require'];
    // .on() ensures that it's Dojo's AMD loader
    return globalRequire && globalRequire.on;
}
// load the ArcGIS API on the page
function loadScript(options) {
    if (options === void 0) { options = {}; }
    // default options
    if (!options.url) {
        options.url = DEFAULT_URL;
    }
    return new utils.Promise(function (resolve, reject) {
        var script = getScript();
        if (script) {
            // the API is already loaded or in the process of loading...
            // NOTE: have to test against scr attribute value, not script.src
            // b/c the latter will return the full url for relative paths
            var src = script.getAttribute('src');
            if (src !== options.url) {
                // potentially trying to load a different version of the API
                reject(new Error("The ArcGIS API for JavaScript is already loaded (" + src + ")."));
            }
            else {
                if (isLoaded()) {
                    // the script has already successfully loaded
                    resolve(script);
                }
                else {
                    // wait for the script to load and then resolve
                    handleScriptLoad(script, resolve, reject);
                }
            }
        }
        else {
            if (isLoaded()) {
                // the API has been loaded by some other means
                // potentially trying to load a different version of the API
                reject(new Error("The ArcGIS API for JavaScript is already loaded."));
            }
            else {
                // this is the first time attempting to load the API
                if (options.css) {
                    // load the css before loading the script
                    loadCss(options.css);
                }
                if (options.dojoConfig) {
                    // set dojo configuration parameters before loading the script
                    window['dojoConfig'] = options.dojoConfig;
                }
                // create a script object whose source points to the API
                script = createScript(options.url);
                _currentUrl = options.url;
                // once the script is loaded...
                handleScriptLoad(script, function () {
                    // update the status of the script
                    script.setAttribute('data-esri-loader', 'loaded');
                    // return the script
                    resolve(script);
                }, reject);
                // load the script
                document.body.appendChild(script);
            }
        }
    });
}
// wrap dojo's require() in a promise
function requireModules(modules) {
    return new utils.Promise(function (resolve, reject) {
        // If something goes wrong loading the esri/dojo scripts, reject with the error.
        var errorHandler = window['require'].on('error', reject);
        window['require'](modules, function () {
            var arguments$1 = arguments;

            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments$1[_i];
            }
            // remove error handler
            errorHandler.remove();
            // Resolve with the parameters from dojo require as an array.
            resolve(args);
        });
    });
}
// returns a promise that resolves with an array of the required modules
// also will attempt to lazy load the ArcGIS API if it has not already been loaded
function loadModules(modules, loadScriptOptions) {
    if (loadScriptOptions === void 0) { loadScriptOptions = {}; }
    if (!isLoaded()) {
        // script is not yet loaded
        if (!loadScriptOptions.url && _currentUrl) {
            // alredy in the process of loading, so default to the same url
            loadScriptOptions.url = _currentUrl;
        }
        // attept to load the script then load the modules
        return loadScript(loadScriptOptions).then(function () { return requireModules(modules); });
    }
    else {
        // script is already loaded, just load the modules
        return requireModules(modules);
    }
}
// NOTE: rollup ignores the default export
// and builds the UMD namespace out of named exports
// so this is only needed so that consumers of the ESM build
// can do esriLoader.loadModules(), etc
// TODO: remove this next breaking change?
var esriLoader = {
    getScript: getScript,
    isLoaded: isLoaded,
    loadModules: loadModules,
    loadScript: loadScript,
    loadCss: loadCss,
    // TODO: export getCss too?
    utils: utils
};

function load(modules) {
  var opt = {};
  if (window.dojoConfig) {
    opt.dojoConfig = window.dojoConfig;
  }

  if (window.apiRoot) {
    opt.url = window.apiRoot;
  }

  return esriLoader.loadModules(modules, opt);
}

var jsapi = { load: load };

/**
 * 根据图层的title获取图层
 * @author  lee  20181209
 * @param {object} view  场景
 * @param {string} title  名称
 */
function getLayerByTitle(view, title) {
  var foundLayer = view.map.layers.find(function (lyr) {
    return lyr.title === title;
  });
  return foundLayer;
}
/**
 * @summary 根据图层的索引获取图层
 * @description 适用范围：二、三维
 * @author  lee  20181209
 * @param {*} view  场景
 * @param {*} index  图层索引
 */
function getLayerByIndex(view, index) {
  var foundLayer = view.map.layers.getItemAt(index);
  return foundLayer;
}
/**
 * @summary 根据图层的id获取图层
 * @author  lee  20181209
 * @param {*} view  场景
 * @param {*} id  图层id
 */
function getLayerById(view, index) {
  var foundLayer = view.map.findLayerById();
  return foundLayer;
}
/**
 * 根据图层名称，控制图层显隐藏
 * @author  lee  20181208
 * @param {*} view  场景
 * @param {*} title  名称
 * @param {*} visible 显示/隐藏  true or false
 */
function setLayerVisible(view, title, visible) {
  var foundLayer = getLayerByTitle(view, title);
  foundLayer.visible = visible;
}
/**
 * 根据要素的ObjectId高亮
 * @author  lee  20181208
 * @param {*} view  场景
 * @param {*} title  名称
 * @param {*} objectid 高亮要素的objectid
 */
function highlightByLayerObjid(view, title, objectid) {
  var foundLayer = getLayerByTitle(view, title);
  view.whenLayerView(foundLayer).then(function (view) {
    view.highlight(objectid * 1);
  });
}
/**
 * 根据条件过滤要素图层中符合条件的要素
 * @author  lee  20181209
 * @param {*} layer  图层
 * @param {*} queryWhere  查询条件
 */
function queryFeathersFromLayer(layer, queryWhere) {
  var queryString = layer.createQuery();
  queryString.where = queryWhere;
  return layer.queryFeatures(queryString);
}
/**
 * 根据图层,Graphic或Feature
 * @author  liugh  20181209
 * @param {*} view view
 * @param {*} layer 图层
 * @param {*} graphic  要高亮的要素
 * @param {*} isGoto 是否跳转
 */
function highlightByLayerGraphic(view, layer, graphic, isGoto) {
  var highlightSelect = null;
  view.whenLayerView(layer).then(function(layerView) {
    if (highlightSelect) { highlightSelect.remove(); }
    highlightSelect = layerView.highlight(graphic);
  });
  view.on('click', function (e) {
    if (highlightSelect) { highlightSelect.remove(); }
  });
  if (isGoto) {
    view.goTo(
      {
        target: graphic.geometry,
        tilt: 70,
      },
      {
        duration: 2000,
        easing: 'in-out-expo',
      }
    );
  }
}
var mapViewUtil = {
  getLayerByTitle: getLayerByTitle,
  getLayerByIndex: getLayerByIndex,
  getLayerById: getLayerById,
  setLayerVisible: setLayerVisible,
  highlightByLayerObjid: highlightByLayerObjid,
  queryFeathersFromLayer: queryFeathersFromLayer,
  queryFeathersFromLayer: queryFeathersFromLayer,
  highlightByLayerGraphic: highlightByLayerGraphic,
};

/**
 * 根据幻灯片的名称，切换到对应的视角
 * @author  lee 
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

var utils$1 = {
  jsapi: jsapi,
  view: viewUtil
};

if (typeof window !== "undefined") {
  // running in browser
  // inject the utils into window
  window.agsUtils = utils$1;
}

var utils$2 = /*#__PURE__*/Object.freeze({
    default: utils$1
});

function getCjsExportFromNamespace (n) {
	return n && n.default || n;
}

var require$$0 = getCjsExportFromNamespace(utils$2);

var geomapUtils = require$$0;

module.exports = geomapUtils;
