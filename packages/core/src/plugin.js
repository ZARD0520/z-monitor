import { isFalse, reLog, getScheduler } from "./utils";
export class Plugin {
  constructor({ mt, name }, options) {
    // monitor 实例
    this.mt = mt;
    // 获取当前插件配置
    this.allOptions = mt.options || {};
    // 插件名字
    this.name = name;
    this.customMethod = options.customMethod || null;
    // 控制是不是销毁，关闭不应该进行埋点记录
    this.isClose = false;
  }
  get TYPES() {
    return this.mt.TYPES;
  }
  get LEVELS() {
    return this.mt.LEVELS;
  }
  addCommonData(prop, key, value) {
    if (!this.mt[prop]) {
      reLog('monitor 实例找不到设置参数', 'error');
      return;
    }
    this.mt.addCommonData(prop, key, value);
  }
  send(data, ...other) {
    const time = window.Date.now()
    getScheduler(() => {
      if (this.customMethod) {
        const res = this.customMethod({ time, ...data }, other)
        if (isFalse(res)) {
          return
        } else {
          data = res
        }
      }
      this.mt.send({ time, ...data })
    })()
  }
}