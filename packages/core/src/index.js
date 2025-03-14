import { getObj, getObjType, hasValue, reLog, isFalse } from './utils/index'
import { LEVELS, TYPES, EMIT_ERROR } from './constant/index'
import {
  HTTP,
  LOG,
} from './plugins/index'

export const defaultPluginConfig = {
  ajax: {
    open: true, // 是否开启此插件
    req: true, // 是否开启对请求参数的记录
    excludeUrls: [],
    customMethod: (data, [ajax]) => { return data } // 自定义处理ajax数据方法
  },
  log: {
    open: true,
    type: 'time', // type为time时，用时间来控制上传频率；type为num时，则用采集次数控制
    time: 30 * 1000, // 隔30s上传一次日志
    MAX_HTTP_FAIL: 3, // 超过3次失败关闭监控，服务端接口可能错误
    customMethod: null/* (item) => { return item } */
  },
  http: {
    open: true,
    isCustomRequest: false,
    requestConfig: {
      method: '', // 请求类型：POST、GET等
      headers: {}, // 请求头配置
    },
    customMethod: null/* (data, done) => { } */, // 自定义请求，data为采集上报的参数数据
  },
  userInfo: {
    open: true,
    customMethod: null/* () => { return {} } */
  },
  videoRecord: {
    open: false,
    waitTime: 2000, // 延迟多久上报，采集报错后的内容
    checkoutEveryNth: 300, // 每N个数据做切片
    customRecordId: ''
  },
  pagePerformance: {
    open: false,
    entryTypes: ['paint', 'resource', 'longtask', 'first-input', 'largest-contentful-paint']
  }
}

export class Monitor {
  constructor(options) {
    console.log('Monitor加载...');
    if (!options.key) {
      console.error('没有设置key值，请传递一个唯一的key值保证功能使用');
      return;
    }
    this.key = options.key;
    this.log = null;
    // 插件
    this.plugins = {};
    this.options = options;
    // 参数回调函数存放数组
    this.commonParams = [];
    // 发布订阅事件
    this.events = {};
    // 平台
    this.platform = null;
    // 平台名字
    this.platformName = null;
    // 会话ID
    this.sessionId = null;
    // 重试计数器
    this.retryCount = 0;
    // 最大重试次数
    this.MAX_RETRY_COUNT = 3;
    // 上传预处理
    this.beforeReport = options.beforeReport || null;
    // 初始化选项
    this.init(options);
  }
  async init(options) {
    console.log('Monitor init');
    // 初始化全局需要的数据
    this.initGlobal();
    // 初始化选项
    this.initOptions(options);
    // 初始化class
    this.initClass(options);

    // 初始化 sessionId
    try {
      await this.initSessionId(options);
    } catch (error) {
      console.error(error.message);
    }
  }
  // 初始化sessionId
  async initSessionId(options) {
    try {
      // 使用 HTTP 插件发送请求
      const response = await this.plugins.http.request({
        url: (options.url || '110.41.131.208') + '/api/session/id', // 替换为实际的 API 地址
        method: 'GET',
      });

      // 检查响应是否有效
      if (response && response.sessionId) {
        this.sessionId = response.sessionId;
        console.log('SessionId 初始化成功:', this.sessionId);
      } else {
        throw new Error('无效的响应数据');
      }
    } catch (error) {
      // 请求失败，递增重试计数器
      this.retryCount++;
      console.error(`SessionId 初始化失败，重试次数: ${this.retryCount}`, error);

      // 如果重试次数未达到最大值，则继续重试
      if (this.retryCount < this.MAX_RETRY_COUNT) {
        console.log('重试中...');
        await this.initSessionId(); // 递归调用
      } else {
        // 重试次数达到最大值，关闭埋点功能
        console.error('重试次数达到上限，关闭埋点功能');
        this.close(); // 关闭埋点
        this.emit('error', EMIT_ERROR.SESSION_FAILED);
        throw new Error('初始失败：无法获取 sessionId');
      }
    }
  }
  // 初始化全局需要的数据
  initGlobal() {
    this.TYPES = { ...TYPES };
    this.LEVELS = { ...LEVELS };
  }
  // 初始化选项
  initOptions(options) {
    this.appName = this.key + '-Monitor';
  }
  initClass() {
    // 注册日志插件
    this.pluginCall('log', LOG);
    // 注册 http 插件
    this.pluginCall('http', HTTP);
  }
  // 判断该插件是否是内部插件
  isInnerPlugins(name) {
    return ['log', 'http'].includes(name);
  }
  // 注册插件
  pluginCall(name, module) {
    try {
      const options = getObj(this.options.plugins, name);
      this.plugins[name] = new module({ mt: this, options: this.options, name }, options);
      // 初始化插件
      const plugin = this.plugins[name];
      plugin.init && plugin.init(options);
    } catch (e) {
      console.log('插件注册错误', name);
      this.emit('error', EMIT_ERROR.PLUGIN_ERROR);
    }
  }
  // 注销插件
  pluginDestroy(name) {
    if (!this.plugins[name]) {
      console.error(`插件${name}不存在`);
      return;
    }
    this.plugins[name].isClose = true;
    this.plugins[name].destroy && this.plugins[name].destroy();
    // 卸载插件
    setTimeout(() => {
      delete this.plugins[name];
    });
  }
  close() {
    for (let name in this.plugins) {
      if (!this.isInnerPlugins(name)) {
        this.pluginDestroy(name);
      }
    }
  }
  addCommonData(prop, key, value) {
    if (!hasValue(value)) {
      reLog(`${key} 必须要设置`);
      return;
    }
    if (this[prop][key]) {
      reLog(`${key} 已经存在，其值为${this[prop][key]}`);
      return;
    }
    this[prop][key] = value;
  }

  assignConfig(data) {
    const config = this.getCommonConfig(data);
    return { ...config, ...data };
  }
  send(item) {
    item = this.assignConfig(item);
    this.plugins.log.push(item);
  }
  getCommonConfig() {
    let total = {
      time: window.Date.now(),
      info: {
        pageTitle: document.title,
        pageUrl: window.location.href,
      },
    };
    const len = this.commonParams.length;
    if (len) {
      for (let i = 0; i <= len - 1; i++) {
        let temp = this.commonParams[i](total);
        if (getObjType(total, 'object')) {
          reLog(
            `setCommonConfig 传递函数需要\n${this.commonParams[
              i
            ].toString()}\n返回值不是 object 类型`,
            'warn',
          );
          continue;
        }
        total = temp;
      }
    }
    return total;
  }
  /**
   * 记录插件的回调函数，方便外部插件扩展公共配置
   */
  setCommonConfig(cb) {
    if (getObjType(cb, 'function')) {
      this.commonParams.push(cb);
      return;
    }
    reLog(`setCommonConfig 方法必须要传递函数类型`, 'error');
  }
  // 调用监听事件
  emit(type, value) {
    this.events[type] && this.events[type](value);
  }
  // 存放监听事件
  on(type, cb) {
    this.events[type] = cb;
  }
  // 移除监听事件
  off(type) {
    delete this.events[type];
  }
  /**
   * 清空当前传递日志
   */
  clear() {
    this.plugins.log.clear();
  }
}

export * from './plugin'