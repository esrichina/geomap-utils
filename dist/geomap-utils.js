/*!
  * geomap-utils v0.1.0
  * (c) 2019 Esri China PS
  * @license MIT
  */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.GeomapUtils = factory());
}(this, function () { 'use strict';

    /* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
     * Apache-2.0 */
    var DEFAULT_VERSION = '4.11';
    function parseVersion(version) {
        var match = version && version.match(/^(\d)\.(\d+)/);
        return match && {
            major: parseInt(match[1], 10),
            minor: parseInt(match[2], 10)
        };
    }
    /**
     * Get the CDN url for a given version
     *
     * @param version Ex: '4.11' or '3.28'. Defaults to the latest 4.x version.
     */
    function getCdnUrl(version) {
        if (version === void 0) { version = DEFAULT_VERSION; }
        return "https://js.arcgis.com/" + version + "/";
    }
    /**
     * Get the CDN url for a the CSS for a given version and/or theme
     *
     * @param version Ex: '4.11' or '3.28'. Defaults to the latest 4.x version.
     */
    function getCdnCssUrl(version) {
        if (version === void 0) { version = DEFAULT_VERSION; }
        var baseUrl = getCdnUrl(version);
        var parsedVersion = parseVersion(version);
        if (parsedVersion.major === 3) {
            // NOTE: at 3.11 the CSS moved from the /js folder to the root
            var path = parsedVersion.minor <= 10 ? 'js/' : '';
            return "" + baseUrl + path + "esri/css/esri.css";
        }
        else {
            // assume 4.x
            return baseUrl + "esri/css/main.css";
        }
    }

    /* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
     * Apache-2.0 */
    function createStylesheetLink(href) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        return link;
    }
    function insertLink(link, before) {
        if (before) {
            // the link should be inserted before a specific node
            var beforeNode = document.querySelector(before);
            beforeNode.parentNode.insertBefore(link, beforeNode);
        }
        else {
            // append the link to then end of the head tag
            document.head.appendChild(link);
        }
    }
    // check if the css url has been injected or added manually
    function getCss(url) {
        return document.querySelector("link[href*=\"" + url + "\"]");
    }
    function getCssUrl(urlOrVersion) {
        return !urlOrVersion || parseVersion(urlOrVersion)
            // if it's a valid version string return the CDN URL
            ? getCdnCssUrl(urlOrVersion)
            // otherwise assume it's a URL and return that
            : urlOrVersion;
    }
    // lazy load the CSS needed for the ArcGIS API
    function loadCss(urlOrVersion, before) {
        var url = getCssUrl(urlOrVersion);
        var link = getCss(url);
        if (!link) {
            // create & load the css link
            link = createStylesheetLink(url);
            insertLink(link, before);
        }
        return link;
    }

    /* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
     * Apache-2.0 */
    var isBrowser = typeof window !== 'undefined';
    // allow consuming libraries to provide their own Promise implementations
    var utils = {
        Promise: isBrowser ? window['Promise'] : undefined
    };

    /* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
     * Apache-2.0 */
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
        // URL to load
        var version = options.version;
        var url = options.url || getCdnUrl(version);
        return new utils.Promise(function (resolve, reject) {
            var script = getScript();
            if (script) {
                // the API is already loaded or in the process of loading...
                // NOTE: have to test against scr attribute value, not script.src
                // b/c the latter will return the full url for relative paths
                var src = script.getAttribute('src');
                if (src !== url) {
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
                    var css = options.css;
                    if (css) {
                        var useVersion = css === true;
                        // load the css before loading the script
                        loadCss(useVersion ? version : css, options.insertCssBefore);
                    }
                    if (options.dojoConfig) {
                        // set dojo configuration parameters before loading the script
                        window['dojoConfig'] = options.dojoConfig;
                    }
                    // create a script object whose source points to the API
                    script = createScript(url);
                    // _currentUrl = url;
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

    /* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
     * Apache-2.0 */
    // wrap Dojo's require() in a promise
    function requireModules(modules) {
        return new utils.Promise(function (resolve, reject) {
            // If something goes wrong loading the esri/dojo scripts, reject with the error.
            var errorHandler = window['require'].on('error', reject);
            window['require'](modules, function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
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
            // script is not yet loaded, is it in the process of loading?
            var script = getScript();
            var src = script && script.getAttribute('src');
            if (!loadScriptOptions.url && src) {
                // script is still loading and user did not specify a URL
                // in this case we want to default to the URL that's being loaded
                // instead of defaulting to the latest 4.x URL
                loadScriptOptions.url = src;
            }
            // attempt to load the script then load the modules
            return loadScript(loadScriptOptions).then(function () { return requireModules(modules); });
        }
        else {
            // script is already loaded, just load the modules
            return requireModules(modules);
        }
    }

    /*
      Copyright (c) 2017 Esri
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
    // NOTE: rollup ignores the default export
    // and builds the UMD namespace out of the above named exports
    // so this is only needed so that consumers of the ESM build
    // can do esriLoader.loadModules(), etc
    // TODO: remove this next breaking change
    var esriLoader = {
        getScript: getScript,
        isLoaded: isLoaded,
        loadModules: loadModules,
        loadScript: loadScript,
        loadCss: loadCss,
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

      if (!esriLoader.utils.Promise) {
        esriLoader.utils.Promise = window['Promise'];
      }

      return esriLoader.loadModules(modules, opt);
    }

    var jsapi = {
      load: load
    };

    var jsapi$1 = /*#__PURE__*/Object.freeze({
        'default': jsapi
    });

    function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
      try {
        var info = gen[key](arg);
        var value = info.value;
      } catch (error) {
        reject(error);
        return;
      }

      if (info.done) {
        resolve(value);
      } else {
        Promise.resolve(value).then(_next, _throw);
      }
    }

    function _asyncToGenerator(fn) {
      return function () {
        var self = this,
            args = arguments;
        return new Promise(function (resolve, reject) {
          var gen = fn.apply(self, args);

          function _next(value) {
            asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
          }

          function _throw(err) {
            asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
          }

          _next(undefined);
        });
      };
    }

    function _slicedToArray(arr, i) {
      return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
    }

    function _arrayWithHoles(arr) {
      if (Array.isArray(arr)) return arr;
    }

    function _iterableToArrayLimit(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"] != null) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    function _nonIterableRest() {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }

    /**
     * 初始化二维场景
     * @author  lee  
     * @param {object} portal  portal地址
     * @param {string} itemid  webmapId
     * @param {string} container  地图的div
     * @returns {object}  view 场景
     */

    function initMapView(_x, _x2, _x3) {
      return _initMapView.apply(this, arguments);
    }
    /**
     * 通过webmapid 切换底图  适用于二三维场景
     * @author  lee  
     * @param {object} view 场景
     * @param {string} webmapId webmap的itmid
     */


    function _initMapView() {
      _initMapView = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee(portal, itemid, container) {
        var _ref, _ref2, WebMap, MapView, webmap, view;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return undefined(['esri/WebMap', 'esri/views/MapView']);

              case 2:
                _ref = _context.sent;
                _ref2 = _slicedToArray(_ref, 2);
                WebMap = _ref2[0];
                MapView = _ref2[1];
                webmap = new WebMap({
                  portalItem: {
                    id: itemid,
                    portal: portal
                  }
                });
                view = new MapView({
                  container: container,
                  map: webmap,
                  ui: {
                    components: []
                  }
                });
                return _context.abrupt("return", view);

              case 9:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));
      return _initMapView.apply(this, arguments);
    }

    function switchBaseMapByWebmapId(_x4, _x5) {
      return _switchBaseMapByWebmapId.apply(this, arguments);
    }
    /**
     * 根据图层的title获取图层
     * @author  lee  20181209
     * @param {object} view  场景
     * @param {string} title  名称
     */


    function _switchBaseMapByWebmapId() {
      _switchBaseMapByWebmapId = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee2(view, webmapId) {
        var _ref3, _ref4, WebMap, map;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return undefined(['esri/WebMap']);

              case 2:
                _ref3 = _context2.sent;
                _ref4 = _slicedToArray(_ref3, 1);
                WebMap = _ref4[0];
                map = new WebMap({
                  portalItem: {
                    id: webmapId
                  }
                });
                map.load().then(function () {
                  map.basemap.load().then(function () {
                    view.map.basemap = map.basemap;
                  });
                });

              case 7:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));
      return _switchBaseMapByWebmapId.apply(this, arguments);
    }

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
      view.whenLayerView(layer).then(function (layerView) {
        if (highlightSelect) highlightSelect.remove();
        highlightSelect = layerView.highlight(graphic);
      });
      view.on('click', function (e) {
        if (highlightSelect) highlightSelect.remove();
      });

      if (isGoto) {
        view.goTo({
          target: graphic.geometry,
          tilt: 70
        }, {
          duration: 2000,
          easing: 'in-out-expo'
        });
      }
    }

    var mapViewUtil = {
      initMapView: initMapView,
      getLayerByTitle: getLayerByTitle,
      getLayerByIndex: getLayerByIndex,
      getLayerById: getLayerById,
      setLayerVisible: setLayerVisible,
      highlightByLayerObjid: highlightByLayerObjid,
      queryFeathersFromLayer: queryFeathersFromLayer,
      highlightByLayerGraphic: highlightByLayerGraphic,
      switchBaseMapByWebmapId: switchBaseMapByWebmapId
    };

    /**
     * 环绕漫游 环绕漫游（longitude）比如：整个地图旋转
     * @no sceneviewer-03
     * @author  lee  
     * @param {object} view  三维场景
     */

    var roamByLongtitudeInterval;

    function roamByLongtitude(view) {
      if (roamByLongtitudeInterval) {
        clearInterval(roamByLongtitudeInterval);
        roamByLongtitudeInterval = null;
      } else {
        roamByLongtitudeInterval = setInterval(function () {
          var camera = view.camera.clone();
          camera.position.longitude += 5;
          view.goTo(camera);
        }, 100);
      }
    } // export { roamByLongtitude }

    function gotoBySliderName(view, title) {
      var slides = view.map.presentation.slides.items;
      var options = {
        duration: 3000,
        maxDuration: 3000
      }; // 飞行到视线分析 幻灯片

      slides.forEach(function (slide) {
        if (slide.title.text === title) {
          view.goTo(slide.viewpoint, options);
        }
      });
    }

    var sceneViewUtil = {
      gotoBySliderName: gotoBySliderName,
      roamByLongtitude: roamByLongtitude
    };

    var viewUtil = {
      map2d: mapViewUtil,
      map3d: sceneViewUtil
    };

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var js_cookie = createCommonjsModule(function (module, exports) {
    (function (factory) {
    	var registeredInModuleLoader = false;
    	{
    		module.exports = factory();
    		registeredInModuleLoader = true;
    	}
    	if (!registeredInModuleLoader) {
    		var OldCookies = window.Cookies;
    		var api = window.Cookies = factory();
    		api.noConflict = function () {
    			window.Cookies = OldCookies;
    			return api;
    		};
    	}
    }(function () {
    	function extend () {
    		var i = 0;
    		var result = {};
    		for (; i < arguments.length; i++) {
    			var attributes = arguments[ i ];
    			for (var key in attributes) {
    				result[key] = attributes[key];
    			}
    		}
    		return result;
    	}

    	function init (converter) {
    		function api (key, value, attributes) {
    			var result;
    			if (typeof document === 'undefined') {
    				return;
    			}

    			// Write

    			if (arguments.length > 1) {
    				attributes = extend({
    					path: '/'
    				}, api.defaults, attributes);

    				if (typeof attributes.expires === 'number') {
    					var expires = new Date();
    					expires.setMilliseconds(expires.getMilliseconds() + attributes.expires * 864e+5);
    					attributes.expires = expires;
    				}

    				// We're using "expires" because "max-age" is not supported by IE
    				attributes.expires = attributes.expires ? attributes.expires.toUTCString() : '';

    				try {
    					result = JSON.stringify(value);
    					if (/^[\{\[]/.test(result)) {
    						value = result;
    					}
    				} catch (e) {}

    				if (!converter.write) {
    					value = encodeURIComponent(String(value))
    						.replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);
    				} else {
    					value = converter.write(value, key);
    				}

    				key = encodeURIComponent(String(key));
    				key = key.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent);
    				key = key.replace(/[\(\)]/g, escape);

    				var stringifiedAttributes = '';

    				for (var attributeName in attributes) {
    					if (!attributes[attributeName]) {
    						continue;
    					}
    					stringifiedAttributes += '; ' + attributeName;
    					if (attributes[attributeName] === true) {
    						continue;
    					}
    					stringifiedAttributes += '=' + attributes[attributeName];
    				}
    				return (document.cookie = key + '=' + value + stringifiedAttributes);
    			}

    			// Read

    			if (!key) {
    				result = {};
    			}

    			// To prevent the for loop in the first place assign an empty array
    			// in case there are no cookies at all. Also prevents odd result when
    			// calling "get()"
    			var cookies = document.cookie ? document.cookie.split('; ') : [];
    			var rdecode = /(%[0-9A-Z]{2})+/g;
    			var i = 0;

    			for (; i < cookies.length; i++) {
    				var parts = cookies[i].split('=');
    				var cookie = parts.slice(1).join('=');

    				if (!this.json && cookie.charAt(0) === '"') {
    					cookie = cookie.slice(1, -1);
    				}

    				try {
    					var name = parts[0].replace(rdecode, decodeURIComponent);
    					cookie = converter.read ?
    						converter.read(cookie, name) : converter(cookie, name) ||
    						cookie.replace(rdecode, decodeURIComponent);

    					if (this.json) {
    						try {
    							cookie = JSON.parse(cookie);
    						} catch (e) {}
    					}

    					if (key === name) {
    						result = cookie;
    						break;
    					}

    					if (!key) {
    						result[name] = cookie;
    					}
    				} catch (e) {}
    			}

    			return result;
    		}

    		api.set = api;
    		api.get = function (key) {
    			return api.call(api, key);
    		};
    		api.getJSON = function () {
    			return api.apply({
    				json: true
    			}, [].slice.call(arguments));
    		};
    		api.defaults = {};

    		api.remove = function (key, attributes) {
    			api(key, '', extend(attributes, {
    				expires: -1
    			}));
    		};

    		api.withConverter = init;

    		return api;
    	}

    	return init(function () {});
    }));
    });

    var has = Object.prototype.hasOwnProperty;
    var isArray = Array.isArray;

    var hexTable = (function () {
        var array = [];
        for (var i = 0; i < 256; ++i) {
            array.push('%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase());
        }

        return array;
    }());

    var compactQueue = function compactQueue(queue) {
        while (queue.length > 1) {
            var item = queue.pop();
            var obj = item.obj[item.prop];

            if (isArray(obj)) {
                var compacted = [];

                for (var j = 0; j < obj.length; ++j) {
                    if (typeof obj[j] !== 'undefined') {
                        compacted.push(obj[j]);
                    }
                }

                item.obj[item.prop] = compacted;
            }
        }
    };

    var arrayToObject = function arrayToObject(source, options) {
        var obj = options && options.plainObjects ? Object.create(null) : {};
        for (var i = 0; i < source.length; ++i) {
            if (typeof source[i] !== 'undefined') {
                obj[i] = source[i];
            }
        }

        return obj;
    };

    var merge = function merge(target, source, options) {
        if (!source) {
            return target;
        }

        if (typeof source !== 'object') {
            if (isArray(target)) {
                target.push(source);
            } else if (target && typeof target === 'object') {
                if ((options && (options.plainObjects || options.allowPrototypes)) || !has.call(Object.prototype, source)) {
                    target[source] = true;
                }
            } else {
                return [target, source];
            }

            return target;
        }

        if (!target || typeof target !== 'object') {
            return [target].concat(source);
        }

        var mergeTarget = target;
        if (isArray(target) && !isArray(source)) {
            mergeTarget = arrayToObject(target, options);
        }

        if (isArray(target) && isArray(source)) {
            source.forEach(function (item, i) {
                if (has.call(target, i)) {
                    var targetItem = target[i];
                    if (targetItem && typeof targetItem === 'object' && item && typeof item === 'object') {
                        target[i] = merge(targetItem, item, options);
                    } else {
                        target.push(item);
                    }
                } else {
                    target[i] = item;
                }
            });
            return target;
        }

        return Object.keys(source).reduce(function (acc, key) {
            var value = source[key];

            if (has.call(acc, key)) {
                acc[key] = merge(acc[key], value, options);
            } else {
                acc[key] = value;
            }
            return acc;
        }, mergeTarget);
    };

    var assign = function assignSingleSource(target, source) {
        return Object.keys(source).reduce(function (acc, key) {
            acc[key] = source[key];
            return acc;
        }, target);
    };

    var decode = function (str, decoder, charset) {
        var strWithoutPlus = str.replace(/\+/g, ' ');
        if (charset === 'iso-8859-1') {
            // unescape never throws, no try...catch needed:
            return strWithoutPlus.replace(/%[0-9a-f]{2}/gi, unescape);
        }
        // utf-8
        try {
            return decodeURIComponent(strWithoutPlus);
        } catch (e) {
            return strWithoutPlus;
        }
    };

    var encode = function encode(str, defaultEncoder, charset) {
        // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
        // It has been adapted here for stricter adherence to RFC 3986
        if (str.length === 0) {
            return str;
        }

        var string = typeof str === 'string' ? str : String(str);

        if (charset === 'iso-8859-1') {
            return escape(string).replace(/%u[0-9a-f]{4}/gi, function ($0) {
                return '%26%23' + parseInt($0.slice(2), 16) + '%3B';
            });
        }

        var out = '';
        for (var i = 0; i < string.length; ++i) {
            var c = string.charCodeAt(i);

            if (
                c === 0x2D // -
                || c === 0x2E // .
                || c === 0x5F // _
                || c === 0x7E // ~
                || (c >= 0x30 && c <= 0x39) // 0-9
                || (c >= 0x41 && c <= 0x5A) // a-z
                || (c >= 0x61 && c <= 0x7A) // A-Z
            ) {
                out += string.charAt(i);
                continue;
            }

            if (c < 0x80) {
                out = out + hexTable[c];
                continue;
            }

            if (c < 0x800) {
                out = out + (hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)]);
                continue;
            }

            if (c < 0xD800 || c >= 0xE000) {
                out = out + (hexTable[0xE0 | (c >> 12)] + hexTable[0x80 | ((c >> 6) & 0x3F)] + hexTable[0x80 | (c & 0x3F)]);
                continue;
            }

            i += 1;
            c = 0x10000 + (((c & 0x3FF) << 10) | (string.charCodeAt(i) & 0x3FF));
            out += hexTable[0xF0 | (c >> 18)]
                + hexTable[0x80 | ((c >> 12) & 0x3F)]
                + hexTable[0x80 | ((c >> 6) & 0x3F)]
                + hexTable[0x80 | (c & 0x3F)];
        }

        return out;
    };

    var compact = function compact(value) {
        var queue = [{ obj: { o: value }, prop: 'o' }];
        var refs = [];

        for (var i = 0; i < queue.length; ++i) {
            var item = queue[i];
            var obj = item.obj[item.prop];

            var keys = Object.keys(obj);
            for (var j = 0; j < keys.length; ++j) {
                var key = keys[j];
                var val = obj[key];
                if (typeof val === 'object' && val !== null && refs.indexOf(val) === -1) {
                    queue.push({ obj: obj, prop: key });
                    refs.push(val);
                }
            }
        }

        compactQueue(queue);

        return value;
    };

    var isRegExp = function isRegExp(obj) {
        return Object.prototype.toString.call(obj) === '[object RegExp]';
    };

    var isBuffer = function isBuffer(obj) {
        if (!obj || typeof obj !== 'object') {
            return false;
        }

        return !!(obj.constructor && obj.constructor.isBuffer && obj.constructor.isBuffer(obj));
    };

    var combine = function combine(a, b) {
        return [].concat(a, b);
    };

    var utils$1 = {
        arrayToObject: arrayToObject,
        assign: assign,
        combine: combine,
        compact: compact,
        decode: decode,
        encode: encode,
        isBuffer: isBuffer,
        isRegExp: isRegExp,
        merge: merge
    };

    var replace = String.prototype.replace;
    var percentTwenties = /%20/g;

    var formats = {
        'default': 'RFC3986',
        formatters: {
            RFC1738: function (value) {
                return replace.call(value, percentTwenties, '+');
            },
            RFC3986: function (value) {
                return value;
            }
        },
        RFC1738: 'RFC1738',
        RFC3986: 'RFC3986'
    };

    var has$1 = Object.prototype.hasOwnProperty;

    var arrayPrefixGenerators = {
        brackets: function brackets(prefix) { // eslint-disable-line func-name-matching
            return prefix + '[]';
        },
        comma: 'comma',
        indices: function indices(prefix, key) { // eslint-disable-line func-name-matching
            return prefix + '[' + key + ']';
        },
        repeat: function repeat(prefix) { // eslint-disable-line func-name-matching
            return prefix;
        }
    };

    var isArray$1 = Array.isArray;
    var push = Array.prototype.push;
    var pushToArray = function (arr, valueOrArray) {
        push.apply(arr, isArray$1(valueOrArray) ? valueOrArray : [valueOrArray]);
    };

    var toISO = Date.prototype.toISOString;

    var defaults = {
        addQueryPrefix: false,
        allowDots: false,
        charset: 'utf-8',
        charsetSentinel: false,
        delimiter: '&',
        encode: true,
        encoder: utils$1.encode,
        encodeValuesOnly: false,
        formatter: formats.formatters[formats['default']],
        // deprecated
        indices: false,
        serializeDate: function serializeDate(date) { // eslint-disable-line func-name-matching
            return toISO.call(date);
        },
        skipNulls: false,
        strictNullHandling: false
    };

    var stringify = function stringify( // eslint-disable-line func-name-matching
        object,
        prefix,
        generateArrayPrefix,
        strictNullHandling,
        skipNulls,
        encoder,
        filter,
        sort,
        allowDots,
        serializeDate,
        formatter,
        encodeValuesOnly,
        charset
    ) {
        var obj = object;
        if (typeof filter === 'function') {
            obj = filter(prefix, obj);
        } else if (obj instanceof Date) {
            obj = serializeDate(obj);
        } else if (generateArrayPrefix === 'comma' && isArray$1(obj)) {
            obj = obj.join(',');
        }

        if (obj === null) {
            if (strictNullHandling) {
                return encoder && !encodeValuesOnly ? encoder(prefix, defaults.encoder, charset) : prefix;
            }

            obj = '';
        }

        if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean' || utils$1.isBuffer(obj)) {
            if (encoder) {
                var keyValue = encodeValuesOnly ? prefix : encoder(prefix, defaults.encoder, charset);
                return [formatter(keyValue) + '=' + formatter(encoder(obj, defaults.encoder, charset))];
            }
            return [formatter(prefix) + '=' + formatter(String(obj))];
        }

        var values = [];

        if (typeof obj === 'undefined') {
            return values;
        }

        var objKeys;
        if (isArray$1(filter)) {
            objKeys = filter;
        } else {
            var keys = Object.keys(obj);
            objKeys = sort ? keys.sort(sort) : keys;
        }

        for (var i = 0; i < objKeys.length; ++i) {
            var key = objKeys[i];

            if (skipNulls && obj[key] === null) {
                continue;
            }

            if (isArray$1(obj)) {
                pushToArray(values, stringify(
                    obj[key],
                    typeof generateArrayPrefix === 'function' ? generateArrayPrefix(prefix, key) : prefix,
                    generateArrayPrefix,
                    strictNullHandling,
                    skipNulls,
                    encoder,
                    filter,
                    sort,
                    allowDots,
                    serializeDate,
                    formatter,
                    encodeValuesOnly,
                    charset
                ));
            } else {
                pushToArray(values, stringify(
                    obj[key],
                    prefix + (allowDots ? '.' + key : '[' + key + ']'),
                    generateArrayPrefix,
                    strictNullHandling,
                    skipNulls,
                    encoder,
                    filter,
                    sort,
                    allowDots,
                    serializeDate,
                    formatter,
                    encodeValuesOnly,
                    charset
                ));
            }
        }

        return values;
    };

    var normalizeStringifyOptions = function normalizeStringifyOptions(opts) {
        if (!opts) {
            return defaults;
        }

        if (opts.encoder !== null && opts.encoder !== undefined && typeof opts.encoder !== 'function') {
            throw new TypeError('Encoder has to be a function.');
        }

        var charset = opts.charset || defaults.charset;
        if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
            throw new TypeError('The charset option must be either utf-8, iso-8859-1, or undefined');
        }

        var format = formats['default'];
        if (typeof opts.format !== 'undefined') {
            if (!has$1.call(formats.formatters, opts.format)) {
                throw new TypeError('Unknown format option provided.');
            }
            format = opts.format;
        }
        var formatter = formats.formatters[format];

        var filter = defaults.filter;
        if (typeof opts.filter === 'function' || isArray$1(opts.filter)) {
            filter = opts.filter;
        }

        return {
            addQueryPrefix: typeof opts.addQueryPrefix === 'boolean' ? opts.addQueryPrefix : defaults.addQueryPrefix,
            allowDots: typeof opts.allowDots === 'undefined' ? defaults.allowDots : !!opts.allowDots,
            charset: charset,
            charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults.charsetSentinel,
            delimiter: typeof opts.delimiter === 'undefined' ? defaults.delimiter : opts.delimiter,
            encode: typeof opts.encode === 'boolean' ? opts.encode : defaults.encode,
            encoder: typeof opts.encoder === 'function' ? opts.encoder : defaults.encoder,
            encodeValuesOnly: typeof opts.encodeValuesOnly === 'boolean' ? opts.encodeValuesOnly : defaults.encodeValuesOnly,
            filter: filter,
            formatter: formatter,
            serializeDate: typeof opts.serializeDate === 'function' ? opts.serializeDate : defaults.serializeDate,
            skipNulls: typeof opts.skipNulls === 'boolean' ? opts.skipNulls : defaults.skipNulls,
            sort: typeof opts.sort === 'function' ? opts.sort : null,
            strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults.strictNullHandling
        };
    };

    var stringify_1 = function (object, opts) {
        var obj = object;
        var options = normalizeStringifyOptions(opts);

        var objKeys;
        var filter;

        if (typeof options.filter === 'function') {
            filter = options.filter;
            obj = filter('', obj);
        } else if (isArray$1(options.filter)) {
            filter = options.filter;
            objKeys = filter;
        }

        var keys = [];

        if (typeof obj !== 'object' || obj === null) {
            return '';
        }

        var arrayFormat;
        if (opts && opts.arrayFormat in arrayPrefixGenerators) {
            arrayFormat = opts.arrayFormat;
        } else if (opts && 'indices' in opts) {
            arrayFormat = opts.indices ? 'indices' : 'repeat';
        } else {
            arrayFormat = 'indices';
        }

        var generateArrayPrefix = arrayPrefixGenerators[arrayFormat];

        if (!objKeys) {
            objKeys = Object.keys(obj);
        }

        if (options.sort) {
            objKeys.sort(options.sort);
        }

        for (var i = 0; i < objKeys.length; ++i) {
            var key = objKeys[i];

            if (options.skipNulls && obj[key] === null) {
                continue;
            }
            pushToArray(keys, stringify(
                obj[key],
                key,
                generateArrayPrefix,
                options.strictNullHandling,
                options.skipNulls,
                options.encode ? options.encoder : null,
                options.filter,
                options.sort,
                options.allowDots,
                options.serializeDate,
                options.formatter,
                options.encodeValuesOnly,
                options.charset
            ));
        }

        var joined = keys.join(options.delimiter);
        var prefix = options.addQueryPrefix === true ? '?' : '';

        if (options.charsetSentinel) {
            if (options.charset === 'iso-8859-1') {
                // encodeURIComponent('&#10003;'), the "numeric entity" representation of a checkmark
                prefix += 'utf8=%26%2310003%3B&';
            } else {
                // encodeURIComponent('✓')
                prefix += 'utf8=%E2%9C%93&';
            }
        }

        return joined.length > 0 ? prefix + joined : '';
    };

    var has$2 = Object.prototype.hasOwnProperty;

    var defaults$1 = {
        allowDots: false,
        allowPrototypes: false,
        arrayLimit: 20,
        charset: 'utf-8',
        charsetSentinel: false,
        comma: false,
        decoder: utils$1.decode,
        delimiter: '&',
        depth: 5,
        ignoreQueryPrefix: false,
        interpretNumericEntities: false,
        parameterLimit: 1000,
        parseArrays: true,
        plainObjects: false,
        strictNullHandling: false
    };

    var interpretNumericEntities = function (str) {
        return str.replace(/&#(\d+);/g, function ($0, numberStr) {
            return String.fromCharCode(parseInt(numberStr, 10));
        });
    };

    // This is what browsers will submit when the ✓ character occurs in an
    // application/x-www-form-urlencoded body and the encoding of the page containing
    // the form is iso-8859-1, or when the submitted form has an accept-charset
    // attribute of iso-8859-1. Presumably also with other charsets that do not contain
    // the ✓ character, such as us-ascii.
    var isoSentinel = 'utf8=%26%2310003%3B'; // encodeURIComponent('&#10003;')

    // These are the percent-encoded utf-8 octets representing a checkmark, indicating that the request actually is utf-8 encoded.
    var charsetSentinel = 'utf8=%E2%9C%93'; // encodeURIComponent('✓')

    var parseValues = function parseQueryStringValues(str, options) {
        var obj = {};
        var cleanStr = options.ignoreQueryPrefix ? str.replace(/^\?/, '') : str;
        var limit = options.parameterLimit === Infinity ? undefined : options.parameterLimit;
        var parts = cleanStr.split(options.delimiter, limit);
        var skipIndex = -1; // Keep track of where the utf8 sentinel was found
        var i;

        var charset = options.charset;
        if (options.charsetSentinel) {
            for (i = 0; i < parts.length; ++i) {
                if (parts[i].indexOf('utf8=') === 0) {
                    if (parts[i] === charsetSentinel) {
                        charset = 'utf-8';
                    } else if (parts[i] === isoSentinel) {
                        charset = 'iso-8859-1';
                    }
                    skipIndex = i;
                    i = parts.length; // The eslint settings do not allow break;
                }
            }
        }

        for (i = 0; i < parts.length; ++i) {
            if (i === skipIndex) {
                continue;
            }
            var part = parts[i];

            var bracketEqualsPos = part.indexOf(']=');
            var pos = bracketEqualsPos === -1 ? part.indexOf('=') : bracketEqualsPos + 1;

            var key, val;
            if (pos === -1) {
                key = options.decoder(part, defaults$1.decoder, charset);
                val = options.strictNullHandling ? null : '';
            } else {
                key = options.decoder(part.slice(0, pos), defaults$1.decoder, charset);
                val = options.decoder(part.slice(pos + 1), defaults$1.decoder, charset);
            }

            if (val && options.interpretNumericEntities && charset === 'iso-8859-1') {
                val = interpretNumericEntities(val);
            }

            if (val && options.comma && val.indexOf(',') > -1) {
                val = val.split(',');
            }

            if (has$2.call(obj, key)) {
                obj[key] = utils$1.combine(obj[key], val);
            } else {
                obj[key] = val;
            }
        }

        return obj;
    };

    var parseObject = function (chain, val, options) {
        var leaf = val;

        for (var i = chain.length - 1; i >= 0; --i) {
            var obj;
            var root = chain[i];

            if (root === '[]' && options.parseArrays) {
                obj = [].concat(leaf);
            } else {
                obj = options.plainObjects ? Object.create(null) : {};
                var cleanRoot = root.charAt(0) === '[' && root.charAt(root.length - 1) === ']' ? root.slice(1, -1) : root;
                var index = parseInt(cleanRoot, 10);
                if (!options.parseArrays && cleanRoot === '') {
                    obj = { 0: leaf };
                } else if (
                    !isNaN(index)
                    && root !== cleanRoot
                    && String(index) === cleanRoot
                    && index >= 0
                    && (options.parseArrays && index <= options.arrayLimit)
                ) {
                    obj = [];
                    obj[index] = leaf;
                } else {
                    obj[cleanRoot] = leaf;
                }
            }

            leaf = obj;
        }

        return leaf;
    };

    var parseKeys = function parseQueryStringKeys(givenKey, val, options) {
        if (!givenKey) {
            return;
        }

        // Transform dot notation to bracket notation
        var key = options.allowDots ? givenKey.replace(/\.([^.[]+)/g, '[$1]') : givenKey;

        // The regex chunks

        var brackets = /(\[[^[\]]*])/;
        var child = /(\[[^[\]]*])/g;

        // Get the parent

        var segment = brackets.exec(key);
        var parent = segment ? key.slice(0, segment.index) : key;

        // Stash the parent if it exists

        var keys = [];
        if (parent) {
            // If we aren't using plain objects, optionally prefix keys that would overwrite object prototype properties
            if (!options.plainObjects && has$2.call(Object.prototype, parent)) {
                if (!options.allowPrototypes) {
                    return;
                }
            }

            keys.push(parent);
        }

        // Loop through children appending to the array until we hit depth

        var i = 0;
        while ((segment = child.exec(key)) !== null && i < options.depth) {
            i += 1;
            if (!options.plainObjects && has$2.call(Object.prototype, segment[1].slice(1, -1))) {
                if (!options.allowPrototypes) {
                    return;
                }
            }
            keys.push(segment[1]);
        }

        // If there's a remainder, just add whatever is left

        if (segment) {
            keys.push('[' + key.slice(segment.index) + ']');
        }

        return parseObject(keys, val, options);
    };

    var normalizeParseOptions = function normalizeParseOptions(opts) {
        if (!opts) {
            return defaults$1;
        }

        if (opts.decoder !== null && opts.decoder !== undefined && typeof opts.decoder !== 'function') {
            throw new TypeError('Decoder has to be a function.');
        }

        if (typeof opts.charset !== 'undefined' && opts.charset !== 'utf-8' && opts.charset !== 'iso-8859-1') {
            throw new Error('The charset option must be either utf-8, iso-8859-1, or undefined');
        }
        var charset = typeof opts.charset === 'undefined' ? defaults$1.charset : opts.charset;

        return {
            allowDots: typeof opts.allowDots === 'undefined' ? defaults$1.allowDots : !!opts.allowDots,
            allowPrototypes: typeof opts.allowPrototypes === 'boolean' ? opts.allowPrototypes : defaults$1.allowPrototypes,
            arrayLimit: typeof opts.arrayLimit === 'number' ? opts.arrayLimit : defaults$1.arrayLimit,
            charset: charset,
            charsetSentinel: typeof opts.charsetSentinel === 'boolean' ? opts.charsetSentinel : defaults$1.charsetSentinel,
            comma: typeof opts.comma === 'boolean' ? opts.comma : defaults$1.comma,
            decoder: typeof opts.decoder === 'function' ? opts.decoder : defaults$1.decoder,
            delimiter: typeof opts.delimiter === 'string' || utils$1.isRegExp(opts.delimiter) ? opts.delimiter : defaults$1.delimiter,
            depth: typeof opts.depth === 'number' ? opts.depth : defaults$1.depth,
            ignoreQueryPrefix: opts.ignoreQueryPrefix === true,
            interpretNumericEntities: typeof opts.interpretNumericEntities === 'boolean' ? opts.interpretNumericEntities : defaults$1.interpretNumericEntities,
            parameterLimit: typeof opts.parameterLimit === 'number' ? opts.parameterLimit : defaults$1.parameterLimit,
            parseArrays: opts.parseArrays !== false,
            plainObjects: typeof opts.plainObjects === 'boolean' ? opts.plainObjects : defaults$1.plainObjects,
            strictNullHandling: typeof opts.strictNullHandling === 'boolean' ? opts.strictNullHandling : defaults$1.strictNullHandling
        };
    };

    var parse = function (str, opts) {
        var options = normalizeParseOptions(opts);

        if (str === '' || str === null || typeof str === 'undefined') {
            return options.plainObjects ? Object.create(null) : {};
        }

        var tempObj = typeof str === 'string' ? parseValues(str, options) : str;
        var obj = options.plainObjects ? Object.create(null) : {};

        // Iterate over the keys and setup the new object

        var keys = Object.keys(tempObj);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            var newObj = parseKeys(key, tempObj[key], options);
            obj = utils$1.merge(obj, newObj, options);
        }

        return utils$1.compact(obj);
    };

    var lib = {
        formats: formats,
        parse: parse,
        stringify: stringify_1
    };

    var utils$2 = {
      jsapi: jsapi,
      view: viewUtil,
      // ajax,
      globals: {
        // axios,
        cookies: js_cookie,
        qs: lib // layer,
        // geometry,
        // event,

      }
    };

    if (typeof window !== 'undefined') {
      // running in browser
      // inject the utils into window
      window.agsUtils = utils$2;
    }

    var geomapUtils = utils$2;

    return geomapUtils;

}));
