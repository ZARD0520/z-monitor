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

const DEFAULT_CONFIG = {
  url: DEFAULT_TRACK_URL,
  platform: 'react',
  key: 'z-app',
  trackList: ['userInfo']
}

const CORE_PLUGINS = {
  click: CLICK,
  ERROR: ERROR,
  reject_error: REJECT_ERROR,
  count: COUNT
}

const OPTIONAL_PLUGINS = {
  ajax: AJAX,
  videoRecord: VIDEO_RECORD,
  userInfo: USERINFO,
  pagePerformance: null
}

export default function createMonitor(React, { useHistory, useLocation } = {}, configs = {}, pluginConfig = {}) {
  const options = {
    ...DEFAULT_CONFIG,
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

    const monitor = new Monitor(mergeConfig)
    // 注册平台监控
    const withMt = register(React)(monitor)

    // 注册核心插件
    Object.entries(CORE_PLUGINS).forEach(([name, plugin]) => {
      monitor.pluginCall(name, plugin)
    })

    // 注册平台错误处理插件
    monitor.pluginCall('platform_error', REACT_ERROR)

    // 注册可选插件
    options.trackList?.forEach(pluginName => {
      if (OPTIONAL_PLUGINS[pluginName] && mergePluginConfig[pluginName]) {
        mergeConfig.plugins[pluginName] = mergePluginConfig[pluginName]
        monitor.pluginCall(pluginName, OPTIONAL_PLUGINS[pluginName])
      }
    })

    // 注册路由相关插件
    if (React && useHistory) {
      monitor.pluginCall('routerChange', createRouterMonitor({ React, useHistory }))
    }

    // 注册性能监控
    if (options.trackList?.includes('pagePerformance') &&
      mergePluginConfig.pagePerformance && React && useLocation) {
      mergeConfig.plugins.pagePerformance = mergePluginConfig.pagePerformance
      monitor.pluginCall('pagePerformance',
        createPerformanceObserve(
          mergePluginConfig.pagePerformance.entryTypes,
          React,
          useLocation
        )
      )
    }
    return {
      withMt,
      ErrorHanding: monitor.plugins.platform_error?.ErrorBoundary || null
    }
  } catch (e) {
    console.error('[Z-Monitor] Initialization failed:', {
      error: e,
      config: options,
      platform: options.platform
    })
    return null
  }
}