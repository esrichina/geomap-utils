import * as jsapi from '../jsapi';

/**
 * 环绕漫游 环绕漫游（longitude）比如：整个地图旋转
 * @no sceneviewer-03
 * @author  lee  
 * @param {object} view  三维场景
 */
let roamByLongtitudeInterval;
function roamByLongtitude(view) {
  if (roamByLongtitudeInterval) {
    clearInterval(roamByLongtitudeInterval);
    roamByLongtitudeInterval = null;
  } else {
    roamByLongtitudeInterval = setInterval(() => {
      const camera = view.camera.clone();
      camera.position.longitude += 5;
      view.goTo(camera);
    }, 100);
  }
}
// export { roamByLongtitude }
/**
 * 初始化三维场景
 * @author  lee  20190313
 * @param {object} portal  portal地址
 * @param {string} itemid  webscenenId
 * @param {string} container  地图的div
 */
async function initSceneView(portal, itemid, container, layer, lyr) {
  const [WebScene, Sceneview] = await jsapi.load(['esri/WebScene', 'esri/views/SceneView']);
  const scene = new WebScene({
    portalItem: {
      id: itemid,
      portal: portal,
    },
  });

  const view = new Sceneview({
    container: container,
    map: scene,
    environment: {
      atmosphere: {
        // creates a realistic view of the atmosphere
        quality: 'high',
      },
    },
    ui: {
      components: [], // 'zoom', 'navigation-toggle', 'compass'
    },
  });
  if (layer) {
    view.map.add(layer);
  }

  if (lyr) {
    view.map.add(lyr);
  }
  return view;
}
/**
 * 根据幻灯片的名称，切换到对应的视角
 * @author  lee 
 * @param {*} view  场景
 * @param {*} title  幻灯片的名称
 */
function gotoBySliderName(view, title) {
  const slides = view.map.presentation.slides.items;
  const options = {
    duration: 3000,
    maxDuration: 3000
  };
  // 飞行到视线分析 幻灯片
  slides.forEach(slide => {
    if (slide.title.text === title) {
      view.goTo(slide.viewpoint, options);
    }
  });
}

const sceneViewUtil = { gotoBySliderName, roamByLongtitude };

export default sceneViewUtil;
