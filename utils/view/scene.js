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

/**
 * 切换三维的旋转方式：平移或者渲染
 * @author  lee  sceneviewer-05
 * @param {object} view  三维场景
 * @param {string} tool  pan or rotate
 */
async function changeToggle(view, tool) {
  const [NavigationToggleViewModel] = await jsapi.load([
    'esri/widgets/NavigationToggle/NavigationToggleViewModel',
  ]);
  const vm = new NavigationToggleViewModel();
  vm.view = view;
  if (vm.navigationMode !== tool) {
    vm.toggle();
  }
}

/**
 * 右键切换二三维场景
 * @author  lee  sceneviewer-06
 * @param {object} view  三维场景
 */
const viewStatus = '2d';
function convertViewTile(view) {
  view.on('immediate-click', function (evt) {
    if (evt.button === 2) { // evt.button === 2  右键操作
      if (viewStatus === '2d') {
        viewStatus = '3d'
        view.goTo({
          tilt: 45
        });
      } else if (viewStatus === '3d') {
        viewStatus = '2d'
        view.goTo({
          tilt: 0
        });
      }
    }
  });
}

/**
 * 根据渲染字段值的集合创建唯一值渲染信息对象
 * @author  wangxd  sceneviewer-07
 * @param {object} view  三维场景
 * @param {*} renderFieldValues
 * @param {*} materialcolor
 * @param {*} materialcolorMixMode
 */
function createUniqueValueInfos(
  renderFieldValues,
  materialcolor,
  materialcolorMixMode,
) {
  const uniqueValueInfos = [];
  for (let i = 0; i < renderFieldValues.length; i += 1) {
    const tmp = {
      value: renderFieldValues[i],
      symbol: {
        type: 'mesh-3d', // autocasts as new MeshSymbol3D()
        symbolLayers: [
          {
            type: 'fill', // autocasts as new FillSymbol3DLayer()
            material: {
              color: materialcolor,
              colorMixMode: materialcolorMixMode,
            },
          },
        ],
      },
    };
    uniqueValueInfos.push(tmp);
  }
  return uniqueValueInfos;
}

/**
 * 创建唯一值渲染
 * @param {*} renderField
 * @param {*} materialcolor
 * @param {*} materialcolorMixMode
 * @param {*} renderFieldValues
 */
function getUniqueValueRenderer(
  renderField,
  materialcolor,
  materialcolorMixMode,
  renderFieldValues,
) {
  return {
    type: 'unique-value', // autocasts as new UniqueValueRenderer()
    field: renderField,
    defaultSymbol: null,
    uniqueValueInfos: createUniqueValueInfos(
      renderFieldValues,
      materialcolor,
      materialcolorMixMode,
    ),
  };
}

function fineModelRenderer(scenelayer){
  const solidEdges = {
    type: 'solid',
    color: [ 0, 0, 0, 0.6 ],
    size: 1
  }
  if(scenelayer){
    scenelayer.when(()=>{
      const newRender = scenelayer.renderer.clone();
      newRender.symbol.symbolLayers.getItemAt(0).edges = solidEdges;
      scenelayer.renderer = newRender
    })
  }
}

const sceneViewUtil = {
  initSceneView, //sceneviewer-01
  roamByHeading, //sceneviewer-02
  gotoBySliderName, //sceneviewer-03
  roamByLongtitude, //sceneviewer-04
  changeToggle, //sceneviewer-05
  convertViewTile, //sceneviewer-06
  getUniqueValueRenderer, //sceneviewer-07
  fineModelRenderer, //sceneviewer-08
};

export default sceneViewUtil;
