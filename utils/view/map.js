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
 * 根据点画缓冲区
 * @author liugh mapviewer-06
 * @param {*} point 点对象
 * @param {*} radius 缓冲范围 默认 5
 * @param {*} radiusUnit 缓冲单位 默认 米
 * @return {object} pointBuffer 缓冲对象
 */
async function drawBuffer(point, wishRadius = 5, wishRadiusUnit) {
  if (!point) return null;
  const radiusUnit = wishRadiusUnit || 'meters';
  const [geometryEngine] = await jsapi.load(['esri/geometry/geometryEngine']);
  const pointBuffer = geometryEngine.pointBuffer(point, wishRadius, radiusUnit);
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

/**
 * 根据图层的title删除图层
 * @author  lee  mapviewer-07
 * @param {object} view  场景
 * @param {string} title  名称
 */
function removeLayerByTitle(view, title) {
  const foundLayer = view.map.layers.find(lyr => {
    return lyr.title === title;
  });
  view.map.remove(foundLayer);
}
/**
 * 根据字段对图层添加标注
 * @author liugh mapviewer-08
 * @param {*} layer 要添加标注的FeatureLayer
 * @param {*} field 要添加标注的字段
 */
async function renderLayerLabelByField(layer, field) {
  if (layer.type !== 'feature') {
    const err = new Error('图层需为FeatureLayer');
    throw err;
  }
  debugger;
  if (!layer) return;
  const labelClass = {
    symbol: {
      type: 'text',
      color: 'green',
      haloColor: 'black',
      font: {
        size: 12,
        weight: 'bold',
      },
    },
    labelPlacement: 'above-center',
    labelExpressionInfo: {
      expression: '$feature.' + field,
    },
  };

  layer.labelingInfo = [labelClass];
}

/**
 * 根据图层标题调整图层顺序
 * @author liugh  mapviewer-09
 * @param {*} view 场景
 * @param {*} title 图层标题
 * @param {*} index 要放置的索引
 */
function reorderLayerByTitle(view, title, index) {
  const layer = view.map.layers.find(l => l.title === title);
  if (layer) view.map.rereorder(layer, index);
}
/**
 * 根据条件添加镶嵌数据集的某一副影像
 * @author  lee  mapviewer-15
 * @param {object} view  场景
 * @param {string} layerUrl  镶嵌数据集服务地址
 * @param {string} attribute  属性名称
 * @param {string} value  属性值
 * @param {string} goto  是否goto
 */

async function addImageryLayer(view, layerUrl, attribute, value, goto) {
  const [ImageryLayer] = await jsapi.load(['esri/layers/ImageryLayer']);
  var AirportDensityLayer = new ImageryLayer({
    title: '镶嵌数据集查询结果图层',
    url: layerUrl,
    mosaicRule: {
      mosaicMethod: 'esriMosaicAttribute',
      where: attribute + "='" + value + "'",
    },
  });
  view.map.add(AirportDensityLayer);
  if (goto) {
    AirportDensityLayer.when(async () => {
      const [QueryTask, Query] = await jsapi.load([
        'esri/tasks/QueryTask',
        'esri/tasks/support/Query',
      ]);
      var queryTask = new QueryTask({
        url: layerUrl,
      });
      var query = new Query();
      query.where = attribute + "='" + value + "'";
      query.returnGeometry = true;
      query.outFields = ['*'];
      queryTask.execute(query).then(function(results) {
        view.goTo({
          target: results.features[0],
        });
      });
    });
  }
}

const mapViewUtil = {
  initMapView, //mapviewer-01
  switchBaseMapByWebmapId, //mapviewer-02
  getLayerByTitle, //mapviewer-03
  setLayerVisible, //mapviewer-04
  pointArr2Line, //mapviewer-05
  drawBuffer, //mapviewer-06
  removeLayerByTitle, //mapviewer-07
  renderLayerLabelByField, //mapviewer-08
  reorderLayerByTitle, //mapviewer-09
  addImageryLayer, //mapviewer-15
};

export default mapViewUtil;
