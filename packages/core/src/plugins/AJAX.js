import { Plugin } from '../plugin';

export default class AJAX extends Plugin {
  init(options = {}) {
    console.log('AJAX init');
    const _this = this;

    const finalOptions = {
      req: true,
      res: false,
      ...options
    }

    const { req, res, excludeUrls } = finalOptions

    const open = XMLHttpRequest.prototype.open;
    this.requestURL = ''

    XMLHttpRequest.prototype.open = function (...args) {
      if (!_this.isClose) {
        // 记录开始时间
        this.startTime = Date.now();
        this.requestURL = args[1]
      }
      return open.apply(this, args);
    };

    const send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (...rest) {
      if (!_this.isClose) {
        const body = rest[0];
        const requestData = body;
        const recordUrl = this.responseURL || this.requestURL
        this.addEventListener('readystatechange', function () {
          if (isExcludeUrl(recordUrl, excludeUrls)) {
            return
          }
          // 获取请求间隔
          const interval = Date.now() - this.startTime + 'ms';
          const data = {
            url: recordUrl + ` [${this.status}]`,
            interval,
          };
          if (req && requestData) {
            data.req = requestData;
          }

          // 网络错误的处理
          if (!recordUrl && this.status === 0) {
            _this.send(
              {
                type: _this.TYPES.AJAX_FAIL,
                level: _this.LEVELS.ERROR,
                time: this.startTime, // 用ajax开始时间，而不是响应后时间
                data
              },
              this,
            )
            return;
          }
          // 响应正常的处理
          if (this.readyState === 4) {
            if (res && this.responseText) {
              data.res = this.responseText;
            }
            if (this.status >= 200 && this.status < 300) {
              _this.send(
                {
                  type: _this.TYPES.AJAX_SUCCESS,
                  level: _this.LEVELS.INFO,
                  time: this.startTime, // 用ajax开始时间，而不是响应后时间
                  data,
                },
                this,
              );
            } else {
              _this.send(
                {
                  type: _this.TYPES.AJAX_FAIL,
                  level: _this.LEVELS.ERROR,
                  time: this.startTime, // 用ajax开始时间，而不是响应后时间
                  data,
                },
                this,
              );
            }
          }
        });
      }
      return send.apply(this, rest);
    };
  }
}

function isExcludeUrl(url, excludeUrls) {
  return excludeUrls?.some(excludeUrl => url?.includes(excludeUrl))
}
