import { EMIT_ERROR } from "../constant/index"
import { isFalse } from "../utils/index"

export default class LOG {
  constructor({ mt, options: allOptions }) {
    this.data = []; // 上传的数据
    this.mt = mt;
    this.allOptions = allOptions;
    this.HTTP_FAIL_COUNT = 0;
    this.SESSION_RETRY_COUNT = 0; // 重试计数器
    this.MAX_SESSION_RETRY = 3; // 最大重试次数
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
  init(options) {
    this.max = options.max || 20;
    this.type = options.type || 'num';
    this.time = options.time || 60 * 1000;
    this.customMethod = options.customMethod || null;
    this.MAX_HTTP_FAIL = options.MAX_HTTP_FAIL || 20;
    this.data = getNotUploadedData()
    listenUnload()
    if (this.type === 'time') {
      this.openInterval();
    }
  }
  getNotUploadedData() {
    const saveDataStr = localStorage.getItem(`monitor_not_uploaded_${this.mt.appName}`)
    if (saveDataStr) {
      this.data = JSON.parse(saveDataStr)
      localStorage.removeItem(`monitor_not_uploaded_${this.mt.appName}`)
    }
  }
  listenUnload() {
    window.addEventListener('beforeunload', () => {
      if (this.data?.length) {
        const saveData = JSON.stringify(this.data)
        localStorage.setItem(`monitor_not_uploaded_${this.mt.appName}`, saveData)
      }
    })
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
    if ((this.data.length / this.max) % 1 === 0) {
      this.uploadData();
    }
  }
  async uploadData() {
    const data = this.data.slice(0, this.data.length);
    const currentLen = data.length;
    // 条数够了发送日志
    this.mt.plugins.http.request(data, async (xhr) => {
      // 如果上报成功，从刚才条数开始截取
      // 因为在请求期间已经有新的日志过来，不能直接清空
      if (xhr.status === 200) {
        this.data = this.data.slice(currentLen, this.data.length);
      } else if(xhr.status === 403){
        this.mt.emit('error', EMIT_ERROR.SESSION_FAILED);
        // 重试获取 sessionId
        if (this.SESSION_RETRY_COUNT < this.MAX_SESSION_RETRY) {
          this.SESSION_RETRY_COUNT++;
          console.log(`SessionId 失效，尝试重新获取 (${this.SESSION_RETRY_COUNT}/${this.MAX_SESSION_RETRY})`);
          try {
            // 重新获取 sessionId
            await this.mt.initSessionId();
            // 获取成功后，重置重试计数器并重新上传
            this.SESSION_RETRY_COUNT = 0;
            this.uploadData();
          } catch (error) {
            console.error('重新获取 sessionId 失败:', error);
            this.mt.emit('error', EMIT_ERROR.SESSION_INIT_FAILED);
          }
        } else {
          // 重试次数达到上限，关闭日志收集
          console.error('重试次数达到上限，关闭日志收集');
          this.mt.close();
        }
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
  }
}