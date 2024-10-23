import { Plugin } from '../index.js';

export default class REJECT_ERROR extends Plugin {
  init(options) {
    console.log('reject init');
    this.options = options;
    this.errorEvent = (e) => this.handleError(e);
    window.addEventListener('unhandledrejection', (e) => this.handleError(e), true);
  }
  handleError(event) {
    // 普通异步错误
    const { reason = {} } = event;
    const { message = null, stack = null } = reason;
    this.send({
      type: this.TYPES.CODE_ERROR,
      level: this.LEVELS.ERROR,
      data: {
        message,
        stack,
        targetType: '异步错误',
      },
    });
  }
  destroy() {
    window.removeEventListener('unhandledrejection', this.errorEvent);
  }
}
