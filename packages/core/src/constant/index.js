export const EVENTS = ['console', 'dom', 'event'];

export const TYPES = {
  CLICK: {
    value: 'UI.CLICK',
    text: 'UI点击',
  }, // 点击
  RES_ERROR: {
    value: 'RES.ERROR',
    text: '资源加载错误',
  }, // 资源加载错误
  AJAX_SUCCESS: {
    value: 'AJAX.SUCCESS',
    text: '请求成功',
  }, //  ajax 成功
  AJAX_FAIL: {
    value: 'AJAX.FAIL',
    text: '请求失败',
  }, // ajax 失败
  CODE_ERROR: {
    value: 'CODE.ERROR',
    text: '代码错误',
  }, // 代码错误
  PROMISE_ERROR: {
    text: 'promise.reject的错误',
    value: 'PROMISE.ERROR',
  }, // promise-reject的错误
  CONSOLE: {
    value: 'CONSOLE',
    text: '控制台打印',
  }, // 开发者console上报
  CUSTOM: {
    value: 'CUSTOM',
    text: '自定义日志',
  }, // 自定义数据
  USERINFO: {
    value: 'USERINFO',
    text: '用户信息',
  }, // 用户信息
  VideoRecord: {
    value: 'VideoRecord',
    text: '视频回放',
  },
  PERFORMANCE: {
    value: 'PERFORMANCE',
    text: '页面性能'
  }
};

export const LEVELS = {
  ERROR: {
    value: 1,
    text: '严重',
  }, // 代码错误
  WARN: {
    value: 2,
    text: '警告',
  }, // 资源加载错误
  INFO: {
    value: 3,
    text: '正常行为',
  }, // 正常记录
};

// emit error type
export const EMIT_ERROR = {
  HTTP_FAIL: 'HTTP_FAIL', // 日志发送失败
  PLUGIN_ERROR: 'PLUGIN_ERROR', // 插件错误
  SESSION_FAILED: 'SESSION_FAILED' // sessionId获取失败或过期
};
