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

const sceneViewUtil = { gotoBySliderName };

export default sceneViewUtil;
