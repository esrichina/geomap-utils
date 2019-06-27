/**
 * 受控的ArcGIS Layer类型，为Layer类包裹生命周期
 * 目的是使应用中的业务逻辑处理趋向统一
 */
export default class BaseLayerWrap {
  constructor(opts) {
    this.beforeOnLoad = opts.before;
    this.afterUnload = opts.after;
    this.layer = opts.layer;
  }

  async beforeOnLoad() {}
  async afterUnload() {}

  async addToView(view) {
    await this.beforeOnLoad();
    view.map.add(this.layer);
  }

  async removeFromView(view) {
    await this.afterUnload();
    view.map.layers.remove(this.layer);
  }
}
