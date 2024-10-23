import { Plugin } from '../index.js';

export default class USERINFO extends Plugin {
  init(options) {
    this.options = options;
    console.log('init userinfo');
    this.getUserInfo = this.getUserInfo;
  }
  async getUserInfo(time) {
    if (!this.options.customMethod) {
      return console.error('customMethod is required')
    }
    const data = this.options.customMethod
    this.send({
      type: this.TYPES.USERINFO,
      level: this.LEVELS.INFO,
      time: time,
      data,
    });
  }
}
