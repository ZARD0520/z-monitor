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

export default function createMonitor(React, { useHistory, useLocation }, configs, pluginConfig) {
  const options = {
    url: DEFAULT_TRACK_URL,
    platform: 'react', // 监听的平台，默认为React
    key: 'z-app', // 唯一key
    trackList: ['userInfo'],
    ...configs
  }
  try {
    const { register, ERROR: REACT_ERROR, createRouterMonitor, createPerformanceObserve } = usePlatform(options.platform)
    const mergeConfig = {
      url: options.url,
      key: options.key,
      plugins: {}
    }
    const mergePluginConfig = Object.assign({}, defaultPluginConfig, pluginConfig)
    const pluginList = ['ajax', 'log', 'http', ...options.trackList]
    Object.keys(mergePluginConfig).forEach((plugin) => {
      if (pluginList.includes(plugin)) {
        mergeConfig.plugins[plugin] = mergePluginConfig[plugin]
      }
    })
    const monitor = new Monitor(mergeConfig)
    // 注册平台监控
    const withMt = register(React)(monitor)
    // 注册插件
    monitor.pluginCall('click', CLICK) // 监听点击
    monitor.pluginCall('ERROR', ERROR) // 监听全局错误
    monitor.pluginCall('platform_error', REACT_ERROR) // 监听react组件错误
    monitor.pluginCall('reject_error', REJECT_ERROR) // 监听异步错误
    monitor.pluginCall('count', COUNT)// 监听统计
    if (React && useHistory) {
      monitor.pluginCall('routerChange', createRouterMonitor({ React, useHistory }))// 监听路由改变
    }
    if (React && useLocation) {
      if (mergeConfig.plugins.pagePerformance) {
        monitor.pluginCall('pagePerformance', createPerformanceObserve(mergeConfig.pagePerformance.entryTypes, React, useLocation))// 监听页面性能
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
    return {
      withMt,
      ErrorHanding: monitor.plugins.platform_error.ErrorBoundary
    }
  } catch (e) {
    console.error(e, 'monitor错误')
    return null
  }
}