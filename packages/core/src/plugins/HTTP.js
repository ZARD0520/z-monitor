import { isFalse } from '../utils/index'
export default class HTTP {
  constructor({ mt }) {
    this.mt = mt
  }
  init(options) {
    this.url = options.url + '/api/monitor/add'
    this.method = options.requestConfig.method
    this.headers = options.requestConfig.headers
    this.customMethod = options.customMethod || null
    if (!options.url && !this.customMethod) {
      console.error('url or customMethod is required')
    }
  }
  // data上传数据   done方法手动控制请求是否完毕
  async request(data, done, errCatch) {
    if (window.log_report) {
      return
    }
    window.log_report = true
    // 数据预处理
    if (this.mt.beforeReport) {
      let _data = this.mt.beforeReport(data)
      if (isFalse(_data)) {
        return
      }
      data = _data
    }
    // 自定义处理
    if (this.customMethod) {
      this.customMethod(data, done, errCatch)
      return
    }
    this.report(data, done, errCatch)
  }

  // 检查beacon
  shouldUseBeacon(data) {
    if (typeof navigator.sendBeacon !== 'function') {
      return false
    }
    const dataSize = new Blob([data]).size
    return dataSize <= 60 * 1024
  }

  // 检查fetch
  shouldUseFetch() {
    return typeof fetch === 'function'
  }

  // beacon上报
  reportWithBeacon(data) {
    const blob = new Blob([data], { type: 'application/json' })
    const success = navigator.sendBeacon(this.url, blob)
    if (!success) {
      console.warn('sendBeacon failed, falling back to other methods')
      return
    }
    return success
  }

  // fetch上报
  async reportWithFetch(data) {
    const response = await fetch(this.url, {
      method: this.method,
      headers: this.headers,
      body: data,
      keepalive: true,
      signal: AbortSignal.timeout(5000),
      priority: 'low',
    })
    return {
      status: response.status,
      responseText: await response.text(),
    }
  }

  // 内置请求
  async report(data, done, errCatch) {
    // 数据参数
    const requestParams = JSON.stringify({
      platform: this.mt.platformName,
      projectId: this.mt.key,
      sessionId: this.mt.sessionId,
      data,
    })

    try {
      let result
      // 不同请求方法处理
      /* if (this.shouldUseBeacon(requestParams)) {
        result = this.reportWithBeacon(requestParams)
      } else  */
      if (this.shouldUseFetch()) {
        result = await this.reportWithFetch(requestParams)
      } else {
        result = await this.customRequest({
          method: this.method,
          url: this.url,
          headers: this.headers,
          data: requestParams,
        })
      }
      done && done(result)
    } catch (err) {
      errCatch && errCatch(err)
      console.error('Request failed:', err)
    }
  }

  customRequest({ method = 'GET', url, params = {}, data = null, headers = {} }) {
    return new Promise((resolve, reject) => {
      // 创建 XMLHttpRequest 对象
      const xhr = new XMLHttpRequest()

      // 拼接 URL 参数（适用于 GET 请求）
      const queryString = new URLSearchParams(params).toString()
      const requestUrl = queryString ? `${url}?${queryString}` : url

      // 初始化请求
      xhr.open(method, requestUrl, true)

      // 设置请求头
      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          xhr.setRequestHeader(key, value)
        }
      }

      // 监听请求完成事件
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          // 请求成功，解析响应数据
          try {
            const response = JSON.parse(xhr.responseText)
            resolve({ status: xhr.status, data: response, error: null })
          } catch (error) {
            resolve({ status: xhr.status, data: null, error }) // 如果响应不是 JSON，直接返回原始数据
          }
        } else {
          // 请求失败，返回错误信息
          reject(new Error(`Request failed with status ${xhr.status}: ${xhr.statusText}`))
        }
      }

      // 监听请求错误事件
      xhr.onerror = function () {
        reject(new Error('Network error: Failed to send request'))
      }

      // 监听请求超时事件
      xhr.ontimeout = function () {
        reject(new Error('Request timeout'))
      }

      // 发送请求
      if (data) {
        // 如果是 POST 请求，发送请求体数据
        if (headers['Content-Type'] === 'application/json') {
          xhr.send(typeof data === 'string' ? data : JSON.stringify(data)) // 发送 JSON 数据
        } else {
          const formData = new FormData()
          for (const [key, value] of Object.entries(data)) {
            formData.append(key, value)
          }
          xhr.send(formData) // 发送 FormData
        }
      } else {
        xhr.send() // GET 请求不需要发送请求体
      }
    })
  }
}
