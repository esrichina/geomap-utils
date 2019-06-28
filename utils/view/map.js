import jsapi from '../jsapi';
/**
 * 初始化二维场景
 * @author  lee  mapviewer-01
 * @param {object} portal  portal地址
 * @param {string} itemid  webmapId
 * @param {string} container  地图的div
 * @returns {object}  view 场景
 */
async function initMapView(portal, itemid, container) {
  const [WebMap, MapView] = await jsapi.load(['esri/WebMap', 'esri/views/MapView']);
  const webmap = new WebMap({
    portalItem: {
      id: itemid,
      portal: portal,
    },
  });
  const view = new MapView({
    container: container,
    map: webmap,
    ui: {
      components: [],
    },
  });
  return view;
}

/**
 * 通过webmapid 切换底图  适用于二三维场景
 * @author  lee  mapviewer-02
 * @param {object} view 场景
 * @param {string} webmapId webmap的itmid
 */
async function switchBaseMapByWebmapId(view, webmapId) {
  const [WebMap] = await jsapi.load(['esri/WebMap']);
  const map = new WebMap({
    portalItem: {
      id: webmapId,
    },
  });
  map.load().then(function() {
    map.basemap.load().then(function() {
      view.map.basemap = map.basemap;
    });
  });
}

/**
 * 根据图层的title获取图层
 * @author  lee  mapviewer-03
 * @param {object} view  场景
 * @param {string} title  名称
 */
function getLayerByTitle(view, title) {
  const foundLayer = view.map.layers.find(lyr => {
    return lyr.title === title;
  });
  return foundLayer;
}

/**
 * 根据图层名称，控制图层显隐藏
 * @author  lee  mapviewer-04
 * @param {*} view  场景
 * @param {*} title  名称
 * @param {*} visible 显示/隐藏  true or false
 */
function setLayerVisible(view, title, visible) {
  const foundLayer = getLayerByTitle(view, title);
  foundLayer.visible = visible;
}

/**
 * 点对象数组转换为线对象
 * @author  liugh  mapviewer-05
 * @param {Array} pointArr 点对象数组
 * @return {Object} polyline  生成的线对象
 */
async function pointArr2Line(pointArr) {
  const [Polyline] = await jsapi.load(['esri/geometry/Polyline']);
  const ps = [];
  pointArr.map(p => {
    ps.push([p.longitude, p.latitude]);
  });
  return new Polyline({
    paths: [ps],
  });
}

/**
 * @summary 根据图层的索引获取图层
 * @description 适用范围：二、三维
 * @author  lee
 * @param {*} view  场景
 * @param {*} index  图层索引
 */
function getLayerByIndex(view, index) {
  const foundLayer = view.map.layers.getItemAt(index);
  return foundLayer;
}
/**
 * @summary 根据图层的id获取图层
 * @author  lee
 * @param {*} view  场景
 * @param {*} id  图层id
 */
function getLayerById(view, index) {
  const foundLayer = view.map.findLayerById();
  return foundLayer;
}

/**
 * 根据要素的ObjectId高亮
 * @author  lee
 * @param {*} view  场景
 * @param {*} title  名称
 * @param {*} objectid 高亮要素的objectid
 */
function highlightByLayerObjid(view, title, objectid) {
  const foundLayer = getLayerByTitle(view, title);
  view.whenLayerView(foundLayer).then(view => {
    view.highlight(objectid * 1);
  });
}
/**
 * 根据条件过滤要素图层中符合条件的要素
 * @author  lee
 * @param {*} layer  图层
 * @param {*} queryWhere  查询条件
 */
function queryFeathersFromLayer(layer, queryWhere) {
  const queryString = layer.createQuery();
  queryString.where = queryWhere;
  return layer.queryFeatures(queryString);
}
/**
 * 根据图层,Graphic或Feature
 * @author  liugh
 * @param {*} view view
 * @param {*} layer 图层
 * @param {*} graphic  要高亮的要素
 * @param {*} isGoto 是否跳转
 */
function highlightByLayerGraphic(view, layer, graphic, isGoto) {
  let highlightSelect = null;
  view.whenLayerView(layer).then(function(layerView) {
    if (highlightSelect) highlightSelect.remove();
    highlightSelect = layerView.highlight(graphic);
  });
  view.on('click', e => {
    if (highlightSelect) highlightSelect.remove();
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
/**
 * 根据点画缓冲区
 * @author liugh mapviewer-06
 * @param {*} point 点对象
 * @param {*} radius 缓冲范围 默认 5
 * @param {*} radiusUnit 缓冲单位 默认 米
 * @return {object} pointBuffer 缓冲对象
 */
async function drawBuffer(point, wishRadius, wishRadiusUnit) {
  if (!point) return null;
  const radius = wishRadius || 5;
  const radiusUnit = wishRadiusUnit || 'meters';
  const [geometryEngine] = await jsapi.load(['esri/geometry/geometryEngine']);
  const pointBuffer = geometryEngine.pointBuffer(point, radius, radiusUnit);
  pointBuffer.symbol = {
    type: 'simple-fill',
    color: [140, 140, 222, 0.5],
    outline: {
      color: [0, 0, 0, 0.5],
      width: 2,
    },
  };
  return pointBuffer;
}

const mapViewUtil = {
  initMapView,
  getLayerByTitle,
  getLayerByIndex,
  getLayerById,
  setLayerVisible,
  highlightByLayerObjid,
  queryFeathersFromLayer,
  highlightByLayerGraphic,
  switchBaseMapByWebmapId,
  pointArr2Line,
  drawBuffer,
};

export default mapViewUtil;
