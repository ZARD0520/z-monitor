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

const defaultConfig = {
  platform: 'react', // 监听的平台，默认为React
  key: 'z-app' // 唯一key
}

export default function createMonitor(React, { useHistory, useLocation }, config = defaultConfig, pluginConfig = defaultPluginConfig) {
  try {
    const { register, ERROR: REACT_ERROR, createRouterMonitor, createPerformanceObserve } = usePlatform(config.platform)
    const mergeConfig = {
      key: config.key,
      plugins: {}
    }
    Object.keys(pluginConfig).forEach((plugin) => {
      if (pluginConfig[plugin].open) {
        mergeConfig.plugins[plugin] = pluginConfig[plugin]
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
      if (mergeConfig.pagePerformance?.open) {
        monitor.pluginCall('pagePerformance', createPerformanceObserve(mergeConfig.pagePerformance.entryTypes, React, useLocation))// 监听页面性能
      }
    }
    if (mergeConfig.ajax?.open) {
      monitor.pluginCall('ajax', AJAX) // 监听ajax请求
    }
    if (mergeConfig.videoRecord?.open) {
      monitor.pluginCall('videoRecord', VIDEO_RECORD) // 错误录制
    }
    if (mergeConfig.userInfo?.open) {
      monitor.pluginCall('userInfo', USERINFO) // 用户信息
    }
    return {
      withMt,
      ErrorHanding: monitor.plugins.platform_error.ErrorBoundary
    }
  } catch (e) {
    console.error(e, 'monitor错误')
  }
}