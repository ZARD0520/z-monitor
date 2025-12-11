import { Plugin } from '../plugin'

export default class AJAX extends Plugin {
  init(options = {}) {
    console.log('AJAX init')

    this.requestURL = ''
    this.finalOptions = {
      req: true,
      res: false,
      ...options,
    }

    this.listenXhr()
  }

  listenXhr() {
    const _this = this
    const { req, res, excludeUrls } = this.finalOptions
    const open = XMLHttpRequest.prototype.open

    XMLHttpRequest.prototype.open = function (...args) {
      if (!_this.isClose) {
        // 记录开始时间
        this.startTime = Date.now()
        this.requestURL = args[1]
      }
      return open.apply(this, args)
    }

    const send = XMLHttpRequest.prototype.send
    XMLHttpRequest.prototype.send = function (...rest) {
      if (!_this.isClose) {
        const body = rest[0]
        const requestData = body
        const recordUrl = this.responseURL || this.requestURL
        this.addEventListener('readystatechange', function () {
          if (isExcludeUrl(recordUrl, excludeUrls)) {
            return
          }
          // 获取请求间隔
          const interval = Date.now() - this.startTime + 'ms'
          const data = {
            url: recordUrl + ` [${this.status}]`,
            interval,
          }
          if (req && requestData) {
            data.req = requestData
          }

          // 网络错误的处理
          if (!recordUrl && this.status === 0) {
            _this.send(
              {
                type: _this.TYPES.AJAX_FAIL,
                level: _this.LEVELS.ERROR,
                time: this.startTime, // 用ajax开始时间，而不是响应后时间
                data,
              },
              this
            )
            return
          }
          // 响应正常的处理
          if (this.readyState === 4) {
            if (res && this.responseText) {
              data.res = this.responseText
            }
            if (this.status >= 200 && this.status < 300) {
              _this.send(
                {
                  type: _this.TYPES.AJAX_SUCCESS,
                  level: _this.LEVELS.INFO,
                  time: this.startTime, // 用ajax开始时间，而不是响应后时间
                  data,
                },
                this
              )
            } else {
              _this.send(
                {
                  type: _this.TYPES.AJAX_FAIL,
                  level: _this.LEVELS.ERROR,
                  time: this.startTime, // 用ajax开始时间，而不是响应后时间
                  data,
                },
                this
              )
            }
          }
        })
      }
      return send.apply(this, rest)
    }
  }

  listenFetch() {
    const nativeFetch = window.fetch
    if (!nativeFetch) {
      return
    }
    const _this = this
    const { req, res, excludeUrls } = this.finalOptions

    window.fetch = async (input, init = {}) => {
      if (_this.isClose) {
        return nativeFetch(input, init)
      }

      const url = typeof input === 'string' ? input : input.url
      if (isExcludeUrl(url, excludeUrls)) {
        return nativeFetch(input, init)
      }

      const startTime = Date.now()
      // const method = (init.method || 'GET').toUpperCase()
      const body = init.body || null

      let fetchData = { url: `${url} [fetch]`, interval: '' }
      if (req && body) {
        fetchData.req = body
      }

      try {
        const response = await nativeFetch(input, init)

        const clone = response.clone()
        const text = await clone.text()

        fetchData.interval = Date.now() - startTime + 'ms'
        if (res && text) fetchData.res = text
        fetchData.url = `${url} [${response.status}]`

        if (response.status >= 200 && response.status < 300) {
          _this.send({
            type: _this.TYPES.AJAX_SUCCESS,
            level: _this.LEVELS.INFO,
            time: startTime,
            data: fetchData,
          })
        } else {
          _this.send({
            type: _this.TYPES.AJAX_FAIL,
            level: _this.LEVELS.ERROR,
            time: startTime,
            data: fetchData,
          })
        }
        return response
      } catch (err) {
        fetchData.interval = Date.now() - startTime + 'ms'
        fetchData.url = `${url} [0]`
        _this.send({
          type: _this.TYPES.AJAX_FAIL,
          level: _this.LEVELS.ERROR,
          time: startTime,
          data: fetchData,
        })
        throw err
      }
    }
  }
}

function isExcludeUrl(url, excludeUrls) {
  return excludeUrls?.some((excludeUrl) => url?.includes(excludeUrl))
}
