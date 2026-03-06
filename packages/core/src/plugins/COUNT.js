import { Plugin } from '../plugin.js'

// 用于应对 React 18 Strict Mode 在开发环境下对 useEffect 的双重执行
const DEBOUNCE_MS = 100

export default class COUNT extends Plugin {
  init() {
    console.log('COUNT init')
    this._lastStorySend = {} // { `${name}_${storyEnd}`: timestamp }
    if (!this.isClose) {
      this.addCommonData('TYPES', 'COUNT', {
        text: '点击统计',
        value: 'UI.COUNT',
      })
      this.addCommonData('TYPES', 'STORY', {
        text: '用户故事',
        value: 'UI.STORY',
      })
      const plugin = this
      this.mt.startRecord = (...args) => plugin.startRecord(...args)
      this.mt.endRecord = (...args) => plugin.endRecord(...args)
      this.mt.count = (...args) => plugin.count(...args)
    }
  }
  _shouldSkipStory(name, storyEnd) {
    const key = `${name}_${storyEnd}`
    const now = Date.now()
    const last = this._lastStorySend[key]
    if (last && now - last < DEBOUNCE_MS) {
      return true
    }
    this._lastStorySend[key] = now
    return false
  }
  startRecord(name, _data = {}, time = null) {
    if (this._shouldSkipStory(name, 0)) return
    const params = {
      type: this.TYPES.STORY,
      level: this.LEVELS.INFO,
      data: {
        name,
        storyEnd: 0,
        isStory: 1,
        ..._data,
      },
    }
    if (time) {
      params.time = time
    }
    this.send(params)
  }
  endRecord(name) {
    if (this._shouldSkipStory(name, 1)) return
    this.send({
      type: this.TYPES.STORY,
      level: this.LEVELS.INFO,
      data: {
        name: name,
        storyEnd: 1,
        isStory: 1,
      },
    })
  }
  count(name, _data = {}) {
    this.send({
      type: this.TYPES.COUNT,
      level: this.LEVELS.INFO,
      data: {
        name,
        isStory: 0,
        ..._data,
      },
    })
  }
  destroy() {
    this._lastStorySend = {}
    // 清空函数，不上传埋点，不直接清空是防止客户端报错
    this.mt.startRecord = () => {}
    this.mt.endRecord = () => {}
    this.mt.count = () => {}
  }
}
