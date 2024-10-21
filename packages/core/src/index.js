export const defaultPluginConfig = {
  ajax: {
    open: true, // 是否开启此插件
    req: true, // 是否开启对请求参数的记录
    customMethod: (data, [ajax]) => { return data } // 自定义处理ajax数据方法
  },
  log: {
    open: true,
    type: 'time', // type为time时，用时间来控制上传频率；type为num时，则用采集次数控制
    time: 30 * 1000, // 隔30s上传一次日志
    MAX_HTTP_FAIL: 3, // 超过3次失败关闭监控，服务端接口可能错误
    customMethod: (item) => { return item }
  },
  http: {
    open: true,
    isCustomRequest: false,
    requestConfig: {
      url: '', // 请求地址
      method: '', // 请求类型：POST、GET等
      headers: {}, // 请求头配置
    },
    customMethod: (data, done) => { }, // 自定义请求，data为采集上报的参数数据
  },
  userInfo: {
    open: false
  },
  videoRecord: {
    open: false,
    waitTime: 2000, // 延迟多久上报，采集报错后的内容
    checkoutEveryNth: 300, // 每N个数据做切片
  }
}

export class Monitor { }