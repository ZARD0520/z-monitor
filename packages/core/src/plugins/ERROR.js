import { Plugin } from '../plugin.js'

export default class ERROR extends Plugin {
  init(options) {
    if (typeof window === 'undefined') return
    console.log('error init')
    this.options = options
    this.errorEvent = (e) => this.handleError(e)
    window.addEventListener('error', this.errorEvent, true)
  }
  handleErrorType(event) {
    let targetType = '错误'
    if (
      event?.target?.tagName === 'VIDEO' ||
      (event?.target?.tagName === 'SOURCE' && event?.target?.parentElement?.tagName === 'VIDEO')
    ) {
      targetType = '错误-视频资源加载异常'
    } else if (event?.target?.tagName === 'IMG') {
      targetType = '错误-图片资源加载异常'
    } else if (
      event?.target?.tagName === 'AUDIO' ||
      (event?.target?.tagName === 'SOURCE' && event?.target?.parentElement?.tagName === 'AUDIO')
    ) {
      targetType = '错误-音频资源加载异常'
    } else if (event?.target?.tagName === 'SCRIPT') {
      targetType = '错误-脚本资源加载异常'
    } else if (event?.target?.tagName === 'STYLE') {
      targetType = '错误-样式资源加载异常'
    }
    return targetType
  }
  handleError(event) {
    const message = event.message ?? event.reason?.message ?? null
    const stack = event.error?.stack ?? event.reason?.stack ?? null
    const targetType = this.handleErrorType(event)
    this.send({
      type: this.TYPES.CODE_ERROR,
      level: this.LEVELS.ERROR,
      data: {
        message,
        stack,
        targetType,
      },
    })
  }
  destroy() {
    if (typeof window !== 'undefined') window.removeEventListener('error', this.errorEvent)
  }
}
