import { isFalse } from '../utils/index'

const config = {
  url: '',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}

export default class HTTP {
  constructor({ mt }) {
    this.mt = mt;
  }
  init(options) {
    if (!options.requestConfig.url && !options.customMethod) {
      console.error('url is required');
    }
    this.url = (options.url || config.url) + '/api/monitor/add';
    this.method = options.requestConfig.method || config.method;
    this.headers = options.requestConfig.headers || config.headers;
    this.customMethod = options.customMethod || null;
  }
  // data上传数据   done方法手动控制请求是否完毕
  request(data, done) {
    // 数据预处理
    if (this.mt.beforeReport) {
      let _data = this.mt.beforeReport(data);
      if (isFalse(_data)) {
        return;
      }
      data = _data;
    }
    if (this.customMethod) {
      window.log_report = true;
      this.customMethod(data, done);
      return;
    } else {
      if (this.mt.plugins.userInfo.open) {
        this.mt.plugins.userInfo.getUserInfo(data[0]?.time)
      }
    }
    this.report(data, done);
  }
  // 内置请求
  report(data, done) {
    //创建异步对象
    let xhr = new XMLHttpRequest();
    window.log_report = true;
    xhr.open(this.method, this.url);
    for (let key in this.headers) {
      xhr.setRequestHeader(key, this.headers[key]);
    }
    //发送请求
    xhr.send(JSON.stringify(data));
    xhr.onreadystatechange = function () {
      // 这步为判断服务器是否正确响应
      if (xhr.readyState == 4) {
        done(xhr);
      }
    };
  }
}
