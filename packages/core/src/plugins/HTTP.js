import { isFalse } from '../utils/index'

const config = {
  url: 'http://localhost:8001',
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
    this.url = (options.url || config.url) + '/api/monitor/add';
    this.method = options.requestConfig.method || config.method;
    this.headers = options.requestConfig.headers || config.headers;
    this.customMethod = options.customMethod || null;
    if (!this.url && !this.customMethod) {
      console.error('url is required');
    }
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
    const requestParams = {
      platform: this.mt.platform,
      projectId: this.mt.key,
      sessionId: this.mt.sessionId,
      data
    }
    xhr.send(JSON.stringify(requestParams));
    xhr.onreadystatechange = function () {
      // 这步为判断服务器是否正确响应
      if (xhr.readyState == 4) {
        done(xhr);
      }
    };
  }
  customRequest({ method = 'GET', url, params = {}, data = null, headers = {} }) {
    return new Promise((resolve, reject) => {
      // 创建 XMLHttpRequest 对象
      const xhr = new XMLHttpRequest();

      // 拼接 URL 参数（适用于 GET 请求）
      const queryString = new URLSearchParams(params).toString();
      const requestUrl = queryString ? `${url}?${queryString}` : url;

      // 初始化请求
      xhr.open(method, requestUrl, true);

      // 设置请求头
      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          xhr.setRequestHeader(key, value);
        }
      }

      // 监听请求完成事件
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          // 请求成功，解析响应数据
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            resolve(xhr.responseText); // 如果响应不是 JSON，直接返回原始数据
          }
        } else {
          // 请求失败，返回错误信息
          reject(new Error(`Request failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      };

      // 监听请求错误事件
      xhr.onerror = function () {
        reject(new Error('Network error: Failed to send request'));
      };

      // 监听请求超时事件
      xhr.ontimeout = function () {
        reject(new Error('Request timeout'));
      };

      // 发送请求
      if (data) {
        // 如果是 POST 请求，发送请求体数据
        if (headers['Content-Type'] === 'application/json') {
          xhr.send(JSON.stringify(data)); // 发送 JSON 数据
        } else {
          const formData = new FormData();
          for (const [key, value] of Object.entries(data)) {
            formData.append(key, value);
          }
          xhr.send(formData); // 发送 FormData
        }
      } else {
        xhr.send(); // GET 请求不需要发送请求体
      }
    });
  }
}
