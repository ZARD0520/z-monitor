import { getObj, getObjType, hasValue, reLog } from "./utils/index"
import { LEVELS, TYPES, EMIT_ERROR } from "./constant/index"
import { HTTP, LOG } from "./plugins/index"
import { DEFAULT_SESSION_URL, SESSION_STORAGE_KEY } from "./constant/config"

export const defaultPluginConfig = {
  ajax: {
    req: true, // 是否开启对请求参数的记录
    excludeUrls: [],
    customMethod: (data, [ajax]) => {
      return data
    }, // 自定义处理ajax数据方法
  },
  log: {
    type: "time", // type为time时，用时间来控制上传频率；type为num时，则用采集次数控制；type为hybrid时，两者同时控制
    time: 30 * 1000, // 隔30s上传一次日志
    MAX_HTTP_FAIL: 3, // 超过3次失败关闭监控，服务端接口可能错误
    customMethod: null /* (item) => { return item } */,
  },
  click: {
    isPartial: false,
    globalDebounce: false,
    partialAttribute: "data-monitor",
    debounceAttribute: "data-monitor-debounce",
  },
  http: {
    isCustomRequest: false,
    requestConfig: {
      method: "POST", // 请求类型：POST、GET等
      headers: {
        "Content-Type": "application/json",
      }, // 请求头配置
    },
    customMethod: null /* (data, done) => { } */, // 自定义请求，data为采集上报的参数数据
  },
  userInfo: {
    getData: null /* () => { return {} } */,
  },
  videoRecord: {
    waitTime: 2000, // 延迟多久上报，采集报错后的内容
    checkoutEveryNth: 300, // 每N个数据做切片
    customRecordId: "",
  },
  pagePerformance: {
    entryTypes: [
      "paint",
      "resource",
      "longtask",
      "first-input",
      "largest-contentful-paint",
    ],
  },
}

export class Monitor {
  constructor(options) {
    console.log("Monitor加载...")
    if (!options.key) {
      console.error("没有设置key值，请传递一个唯一的key值保证功能使用")
      return
    }
    this.key = options.key
    this.log = null
    // 插件
    this.plugins = {}
    this.options = options
    // 参数回调函数存放数组
    this.commonParams = []
    // 发布订阅事件
    this.events = {}
    // 平台
    this.platform = null
    // 平台名字
    this.platformName = null
    // 会话ID
    this.sessionId = null
    // 重试计数器
    this.retryCount = 0
    // 最大重试次数
    this.MAX_RETRY_COUNT = 3
    // 基础信息
    this.baseInfo = null
    // 上传预处理
    this.beforeReport = options.beforeReport || null
    // 初始化选项
    this.init(options)
  }
  async init(options) {
    console.log("Monitor init")
    // 初始化全局需要的数据
    this.initGlobal()
    // 初始化基础数据
    this.initBaseInfo()
    // 初始化选项
    this.initOptions(options)
    // 初始化class
    this.initClass(options)
    // 初始化 sessionId
    try {
      await this.initSessionId(options)
    } catch (error) {
      console.error(error.message)
    }
  }
  // 初始化sessionId
  async initSessionId(options) {
    try {
      if (this.sessionId) {
        return
      }
      const storedSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY)
      if (storedSessionId) {
        this.sessionId = storedSessionId
        return
      }
      // 使用 HTTP 插件发送请求
      const response = await this.plugins.http.customRequest({
        method: "GET",
        url: (options.url || DEFAULT_SESSION_URL) + "/api/session/id",
      })

      // 检查响应是否有效
      if (response && response.data?.sessionId) {
        this.sessionId = response.data?.sessionId
        sessionStorage.setItem(SESSION_STORAGE_KEY, this.sessionId)
        console.log("SessionId 初始化成功:", this.sessionId)
      } else {
        throw new Error("无效的响应数据")
      }
    } catch (error) {
      // 请求失败，递增重试计数器
      this.retryCount++
      console.error(`SessionId 初始化失败，重试次数: ${this.retryCount}`, error)

      // 如果重试次数未达到最大值，则继续重试
      if (this.retryCount < this.MAX_RETRY_COUNT) {
        console.log("重试中...")
        await this.initSessionId(options) // 递归调用
      } else {
        // 重试次数达到最大值，关闭埋点功能
        console.error("重试次数达到上限，关闭埋点功能")
        this.close() // 关闭埋点
        this.emit("error", EMIT_ERROR.SESSION_FAILED)
        throw new Error("初始失败：无法获取 sessionId")
      }
    }
  }
  // 初始化全局需要的数据
  initGlobal() {
    this.TYPES = { ...TYPES }
    this.LEVELS = { ...LEVELS }
  }
  // 初始化选项
  initOptions() {
    this.appName = this.key + "-Monitor"
  }
  // 初始化基础信息
  initBaseInfo() {
    const timeZoneOffset = new Date().getTimezoneOffset()
    const offsetHours = Math.floor(Math.abs(timeZoneOffset) / 60)
    const offsetDirection = timeZoneOffset > 0 ? "-" : "+"
    const timezone = offsetDirection + offsetHours
    const networkInfo =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection ||
      {}
    this.baseInfo = {
      timezone,
      language: navigator.language || navigator.userLanguage || "en",
      deviceInfo: {
        userAgent: navigator.userAgent,
        networkInfo: {
          downlink: networkInfo.downlink, // 下行速度（Mbps）
          effectiveType: networkInfo.effectiveType, // 网络类型（如 '4g'）
          type: networkInfo.type, // 连接类型（如 'wifi'）
          rtt: networkInfo.rtt,
          saveData: networkInfo.saveData,
        },
      },
    }
  }
  initClass() {
    // 注册日志插件
    this.pluginCall("log", LOG)
    // 注册 http 插件
    this.pluginCall("http", HTTP)
  }
  // 判断该插件是否是内部插件
  isInnerPlugins(name) {
    return ["log", "http"].includes(name)
  }
  // 注册插件
  pluginCall(name, module) {
    try {
      let options = getObj(this.options.plugins, name)
      this.plugins[name] = new module(
        { mt: this, options: this.options, name },
        options
      )
      // 初始化插件
      const plugin = this.plugins[name]
      if (name === "http") {
        options = { ...options, url: this.options.url }
      }
      plugin.init && plugin.init(options)
    } catch (e) {
      console.warn("插件注册错误", name, e)
      this.emit("error", EMIT_ERROR.PLUGIN_ERROR)
    }
  }
  // 注销插件
  pluginDestroy(name) {
    if (!this.plugins[name]) {
      console.error(`插件${name}不存在`)
      return
    }
    this.plugins[name].isClose = true
    this.plugins[name].destroy && this.plugins[name].destroy()
    // 卸载插件
    setTimeout(() => {
      delete this.plugins[name]
    })
  }
  close() {
    this.plugins.log.isClose = true
    for (let name in this.plugins) {
      if (!this.isInnerPlugins(name)) {
        this.pluginDestroy(name)
      }
    }
  }
  addCommonData(prop, key, value) {
    if (!hasValue(value)) {
      reLog(`${key} 必须要设置`)
      return
    }
    if (this[prop][key]) {
      reLog(`${key} 已经存在，其值为${this[prop][key]}`)
      return
    }
    this[prop][key] = value
  }

  assignConfig(data) {
    const config = this.getCommonConfig(data)
    return { ...config, ...data }
  }
  send(item) {
    item = this.assignConfig(item)
    this.plugins.log.push(item)
  }
  getCommonConfig() {
    this.initBaseInfo()
    let total = {
      info: {
        pageTitle: document.title,
        pageUrl: window.location.href,
        timezone: this.baseInfo?.timezone,
        language: this.baseInfo?.language,
        deviceInfo: this.baseInfo?.deviceInfo || {},
        locationInfo: this.baseInfo?.locationInfo || {},
      },
    }
    const len = this.commonParams.length
    if (len) {
      for (let i = 0; i <= len - 1; i++) {
        let temp = this.commonParams[i](total)
        if (getObjType(total, "object")) {
          reLog(
            `setCommonConfig 传递函数需要\n${this.commonParams[
              i
            ].toString()}\n返回值不是 object 类型`,
            "warn"
          )
          continue
        }
        total = temp
      }
    }
    return total
  }
  /**
   * 记录插件的回调函数，方便外部插件扩展公共配置
   */
  setCommonConfig(cb) {
    if (getObjType(cb, "function")) {
      this.commonParams.push(cb)
      return
    }
    reLog("setCommonConfig 方法必须要传递函数类型", "error")
  }
  // 调用监听事件
  emit(type, value) {
    this.events[type] && this.events[type](value)
  }
  // 存放监听事件
  on(type, cb) {
    this.events[type] = cb
  }
  // 移除监听事件
  off(type) {
    delete this.events[type]
  }
  /**
   * 清空当前传递日志
   */
  clear() {
    this.plugins.log.clear()
  }
}

export * from "./plugin"
