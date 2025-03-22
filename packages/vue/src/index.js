import { defaultPluginConfig, Monitor } from 'z-monitor-core'
import { usePlatform } from './platform/index'
import {
  CLICK,
  ERROR,
  REJECT_ERROR,
  AJAX,
  USERINFO,
  COUNT,
  VIDEO_RECORD
} from 'z-monitor-core/plugins'
import { DEFAULT_TRACK_URL } from 'z-monitor-core/constant/config'

export default {
  install(Vue, configs) {
    const options = {
      key: 'z-app',
      platform: 'vue2',
      url: DEFAULT_TRACK_URL,
      trackList: ['userInfo'],
      pluginConfig: null,
      Router: null,
      ...configs
    }
    try {
      const { register, ERROR: VUE_ERROR, createRouterMonitor, createPerformanceObserve } = usePlatform(options.platform)
      const mergeConfig = {
        key: options.key,
        url: options.url,
        plugins: {}
      }
      const mergePluginConfig = Object.assign({}, defaultPluginConfig, options.pluginConfig)
      const pluginList = ['ajax', 'log', 'http', ...options.trackList]
      Object.keys(mergePluginConfig).forEach((plugin) => {
        if (pluginList.includes(plugin)) {
          mergeConfig.plugins[plugin] = mergePluginConfig[plugin]
        }
      })
      const monitor = new Monitor(mergeConfig)
      // 注册平台监控
      register(Vue)(monitor)
      // 注册插件
      monitor.pluginCall('click', CLICK) // 监听点击
      monitor.pluginCall('ERROR', ERROR) // 监听全局错误
      monitor.pluginCall('platform_error', VUE_ERROR) // 监听vue组件错误
      monitor.pluginCall('reject_error', REJECT_ERROR) // 监听异步错误
      monitor.pluginCall('count', COUNT)// 监听统计
      if (options.Router) {
        monitor.pluginCall('routerChange', createRouterMonitor(options.Router))// 监听路由改变
        if (mergeConfig.plugins.pagePerformance) {
          monitor.pluginCall('pagePerformance', createPerformanceObserve(mergeConfig.pagePerformance.entryTypes, options.Router))// 监听页面性能
        }
      }
      if (mergeConfig.plugins.ajax) {
        monitor.pluginCall('ajax', AJAX) // 监听ajax请求
      }
      if (mergeConfig.plugins.videoRecord) {
        monitor.pluginCall('videoRecord', VIDEO_RECORD) // 错误录制
      }
      if (mergeConfig.plugins.userInfo) {
        monitor.pluginCall('userInfo', USERINFO) // 用户信息
      }
    } catch (e) {
      console.error(e, 'monitor错误')
    }
  }
}