import jsapi from '../jsapi';

/**
 * 初始化三维场景
 * @author  lee  sceneviewer-01
 * @param {object} portal  portal地址
 * @param {string} itemid  webscenenId
 * @param {string} container  地图的div
 */
async function initSceneView(portal, itemid, container) {
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
  return view;
}
/**
 * 环绕漫游（heading）比如：沿着建筑漫游
 * @author  lee  sceneviewer-02
 * @param {object} view  三维场景
 */
let roamHandle
function roamByHeading(view) {
  if (roamHandle) {
    clearInterval(roamHandle);
    roamHandle = null;
  } else {
    roamHandle = setInterval(() => {
      view.goTo({ heading: view.camera.heading + 0.5 });
    }, 100);
  }

}
/**
 * 环绕漫游 环绕漫游（longitude）比如：整个地图旋转
 * @author  lee  sceneviewer-03
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

/**
 * 根据幻灯片的名称，切换到对应的视角
 * @author  lee  sceneviewer-04
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

const sceneViewUtil = { initSceneView,roamByHeading, gotoBySliderName, roamByLongtitude };

export default sceneViewUtil;
