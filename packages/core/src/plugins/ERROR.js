import { Plugin } from '../index.js';

export default class ERROR extends Plugin {
  init(options) {
    console.log('error init');
    this.options = options;
    this.errorEvent = (e) => this.handleError(e);
    window.addEventListener('error', (e) => this.handleError(e), true);
  }
  handleError(event) {
    // 普通错误
    const { reason = {} } = event;
    const { message = null, stack = null } = reason;
    // 此处可优化-可根据event.target.tagName来判断错误来源的tag(视频？音频？图片？脚本？样式等)
    this.send({
      type: this.TYPES.CODE_ERROR,
      level: this.LEVELS.ERROR,
      data: {
        message,
        stack,
        targetType: '错误',
      },
    });
  }
  destroy() {
    window.removeEventListener('error', this.errorEvent);
  }
}
