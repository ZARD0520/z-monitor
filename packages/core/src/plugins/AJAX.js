import { Plugin } from '../index';

export default class AJAX extends Plugin {
  init(options = {}) {
    console.log('AJAX init');
    const _this = this;
    // 默认传递请求参数
    if (options.req === null || options.req === undefined) {
      options.req = true;
    }
    // 默认不传递响应结果
    if (options.res === null || options.res === undefined) {
      options.res = false;
    }

    const open = XMLHttpRequest.prototype.open;

    XMLHttpRequest.prototype.open = function (...args) {
      if (!_this.isClose) {
        // 记录开始时间
        this.startTime = Date.now();
      }
      return open.apply(this, args);
    };
    const send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (...rest) {
      if (!_this.isClose) {
        const body = rest[0];
        const requestData = body;
        this.addEventListener('readystatechange', function () {
          if (!this.responseURL || options.excludeUrls?.includes(this.responseURL)) {
            return;
          }
          // 获取请求间隔
          const interval = Date.now() - this.startTime + 'ms';
          const data = {
            url: this.responseURL + ` [${this.status}]`,
            interval,
          };
          if (this.readyState === 4) {
            if (options.req && requestData) {
              data.req = requestData;
            }
            if (options.res && this.responseText) {
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
