import { EMIT_ERROR } from "../constant/index"
import { isFalse } from "../utils/index"

export default class LOG {
  constructor({ mt }, options) {
    this.data = []; // 上传的数据
    this.mt = mt;
    this.HTTP_FAIL_COUNT = 0;
    this.SESSION_RETRY_COUNT = 0; // 重试计数器
    this.MAX_SESSION_RETRY = 3; // 最大重试次数
    this.MAX_HTTP_FAIL = options.MAX_HTTP_FAIL || 20
    this.max = options.max || 20
    this.type = options.type || 'num'
    this.time = options.time || 60 * 1000
    this.customMethod = options.customMethod || null
    this.eventHandlers = {
      unloadHandler: null,
      visibilityHandler: null
    }
    this.STORAGE_KEY = `monitor_not_uploaded_${this.mt.appName}`
    this.unloadEvent = 'onpagehide' in window ? 'pagehide' : 'beforeunload'
  }

  set isClose(value) {
    if (value) {
      this.cancelInterval();
      this.clear();
    }
  }

  setData(data) {
    this.data = data;
  }

  init() {
    this.initUnloadHandler()
    this.restoreUnsentData()
    this.listenUnload()
    if (this.type !== 'num') {
      this.openInterval()
    }
  }

  initUnloadHandler() {
    this.eventHandlers.unloadHandler = (event) => {
      if (this.unloadEvent === 'pagehide' && event.persisted) {
        return
      }
      if (this.data?.length) {
        const httpPlugin = this.mt.plugins.http
        const saveData = JSON.stringify(this.data)
        if (httpPlugin?.shouldUseBeacon(saveData)) {
          let isSuccess = false
          httpPlugin.request(this.data, (success) => {
            isSuccess = !!success
          }, (err)=>{ console.error(err) })
          if (isSuccess) {
            return
          }
        }
        localStorage.setItem(this.STORAGE_KEY, saveData)
      }
    }
    this.eventHandlers.visibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        this.uploadData()
      }
    }
  }

  restoreUnsentData() {
    try {
      const saveDataStr = localStorage.getItem(this.STORAGE_KEY)
      if (saveDataStr) {
        const parsedData = JSON.parse(saveDataStr)
        if (Array.isArray(parsedData)) {
          this.data = parsedData.concat(this.data)
        }
        localStorage.removeItem(this.STORAGE_KEY)
      } else {
        this.data = []
      }
    } catch (err) {
      console.error('恢复未上报数据失败:', err)
    }
  }

   listenUnload() {
    window.addEventListener(this.unloadEvent, this.eventHandlers.unloadHandler)
    document.addEventListener('visibilitychange', this.eventHandlers.visibilityHandler)
  }

  openInterval() {
    this.cancelInterval();
    this.interval = setInterval(() => {
      this.uploadData();
    }, this.time);
  }
  cancelInterval() {
    window.clearInterval(this.interval);
    this.interval = null;
  }
  push(item) {
    if (this.isClose) return;
    // 日志信息预处理
    if (this.customMethod) {
      let data = this.customMethod(item, [this]);
      if (isFalse(data)) {
        return;
      }
      item = data;
    }
    // 存放日志
    this.data.push(item);
    if (this.type === 'time') return;
    if ((this.data.length / this.max) % 1 === 0) {
      this.uploadData();
    }
  }

  async uploadData() {
    if (!this.data.length) return
    const data = this.data.slice(0, this.data.length)
    const currentLen = data.length
    this.mt.plugins.http.request(data, async (xhr) => {
      window.log_report = false
      if ([200, 201].includes(xhr.status)) {
        this.data = this.data.slice(currentLen, this.data.length)
      } else {
        this.handleUploadError()
      }
    }, (err) => {
      console.error(err)
      window.log_report = false
    })
  }

  // 处理session权限错误
  async handleSessionError() {
    this.mt.emit('error', EMIT_ERROR.SESSION_FAILED)

    if (this.SESSION_RETRY_COUNT >= this.MAX_SESSION_RETRY) {
      console.error('重试次数达到上限，关闭日志收集')
      this.mt.close()
      return
    }

    this.SESSION_RETRY_COUNT++
    console.warn(`SessionId 失效，尝试重新获取 (${this.SESSION_RETRY_COUNT}/${this.MAX_SESSION_RETRY})`)

    try {
      await this.mt.initSessionId()
      this.SESSION_RETRY_COUNT = 0
      this.uploadData()
    } catch (error) {
      console.error('重新获取 sessionId 失败:', error)
      this.mt.emit('error', EMIT_ERROR.SESSION_INIT_FAILED)
    }
  }

  // 处理上传错误
  handleUploadError(res) {
    if (res?.status === 403) {
      this.handleSessionError()
    } else {
      this.mt.emit('error', EMIT_ERROR.HTTP_FAIL)
      this.HTTP_FAIL_COUNT++
      if (this.HTTP_FAIL_COUNT >= this.MAX_HTTP_FAIL) {
        console.error('重试次数达到上限，关闭日志收集')
        this.mt.close()
      }
    }
  }

  clear() {
    this.data = [];
    window.removeEventListener(this.unloadEvent, this.eventHandlers.unloadHandler)
    document.removeEventListener('visibilitychange', this.eventHandlers.visibilityHandler)
  }
}