import { EMIT_ERROR } from "../constant"
import { isFalse } from "../utils"

export default class LOG {
  constructor({ mt, options: allOptions }) {
    this.data = []; // 上传的数据
    this.mt = mt;
    this.allOptions = allOptions;
    this.HTTP_FAIL_COUNT = 0;
  }
  set isClose(value) {
    if (value) {
      this.cancelInterval();
      this.clear();
    }
  }
  setData(data) {
    this.data = data;
    // setStorage(this.mt.appName, this.data);
  }
  init(options) {
    this.max = options.max || 20;
    this.type = options.type || 'num';
    this.time = options.time || 60 * 1000;
    this.customMethod = options.customMethod || null;
    this.MAX_HTTP_FAIL = options.MAX_HTTP_FAIL || 20;
    if (this.type === 'time') {
      this.openInterval();
    }
  }
  openInterval() {
    this.cancelInterval();
    this.interval = setInterval(() => {
      if (this.data.length) {
        this.uploadData();
      }
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
    // 每次存一份在缓存，防止刷新丢失
    // setStorage(this.mt.appName, this.data);
    if ((this.data.length / this.max) % 1 === 0) {
      this.uploadData();
    }
  }
  uploadData() {
    const data = this.data.slice(0, this.data.length);
    const currentLen = data.length;
    // 条数够了发送日志
    this.mt.plugins.http.request(data, (isDone) => {
      // 如果上报成功，从刚才条数开始截取
      // 因为在请求期间已经有新的日志过来，不能直接清空
      if (isDone) {
        this.data = this.data.slice(currentLen, this.data.length);
      } else {
        this.mt.emit('error', EMIT_ERROR.HTTP_FAIL);
        this.HTTP_FAIL_COUNT++;
        // 当失败超过 MAX_HTTP_FAIL 自动关闭日志收集，防止一直发请求
        if (this.HTTP_FAIL_COUNT >= this.MAX_HTTP_FAIL) {
          this.mt.close();
        }
      }
    });
  }
  clear() {
    this.data = [];
    // setStorage(this.mt.appName, this.data); 该方法可结合浏览器的一个api，作浏览器关闭的埋点数据备案
  }
}