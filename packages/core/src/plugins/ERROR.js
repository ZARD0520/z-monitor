import { Plugin } from '../plugin.js';

export default class ERROR extends Plugin {
  init(options) {
    console.log('error init');
    this.options = options;
    this.errorEvent = (e) => this.handleError(e);
    window.addEventListener('error', (e) => this.handleError(e), true);
  }
  handleErrorType(event) {
    let targetType = '错误'
    if (event?.target?.tagName === 'VIDEO' || (event?.target?.tagName === 'SOURCE' && event?.target?.parentElement?.tagName === 'VIDEO')) {
      targetType = '错误-视频资源加载异常'
    } else if (event?.target?.tagName === 'IMG') {
      targetType = '错误-图片资源加载异常'
    } else if (event?.target?.tagName === 'AUDIO' || (event?.target?.tagName === 'SOURCE' && event?.target?.parentElement?.tagName === 'AUDIO')) {
      targetType = '错误-音频资源加载异常'
    } else if (event?.target?.tagName === 'SCRIPT') {
      targetType = '错误-脚本资源加载异常'
    } else if (event?.target?.tagName === 'STYLE') {
      targetType = '错误-样式资源加载异常'
    }
    return targetType
  }
  handleError(event) {
    // 普通错误
    const { reason = {} } = event;
    const { message = null, stack = null } = reason;
    // 此处可优化-可根据event.target.tagName来判断错误来源的tag(视频？音频？图片？脚本？样式等)
    const targetType = handleErrorType(event)
    this.send({
      type: this.TYPES.CODE_ERROR,
      level: this.LEVELS.ERROR,
      data: {
        message,
        stack,
        targetType
      },
    });
  }
  destroy() {
    window.removeEventListener('error', this.errorEvent);
  }
}
