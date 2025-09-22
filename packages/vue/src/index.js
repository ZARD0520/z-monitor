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
  platform: 'vue2',
  key: 'z-app',
  trackList: ['userInfo'],
  Router: null
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

export default {
  install(Vue, configs = {}) {
    const options = {
      ...DEFAULT_CONFIG,
      ...configs
    }
    try {
      const { register, ERROR: VUE_ERROR, createRouterMonitor, createPerformanceObserve } = usePlatform(options.platform)
      
      const mergePluginConfig = {}
      for (const key in defaultPluginConfig) {
        mergePluginConfig[key] =
          Object.assign({}, defaultPluginConfig[key], options.pluginConfig[key])
      }
  
      const mergeConfig = {
        key: options.key,
        url: options.url,
        plugins: {
          http: mergePluginConfig.http,
          log: mergePluginConfig.log,
          click: mergePluginConfig.click
        }
      }

      const monitor = new Monitor(mergeConfig)
      // 注册平台监控
      register(Vue)(monitor)

      // 注册核心插件
      Object.entries(CORE_PLUGINS).forEach(([name, plugin]) => {
        monitor.pluginCall(name, plugin)
      })

      // 注册Vue错误处理插件
      monitor.pluginCall('platform_error', VUE_ERROR)

      // 注册可选插件
      options.trackList?.forEach(pluginName => {
        if (OPTIONAL_PLUGINS[pluginName] && mergePluginConfig[pluginName]) {
          mergeConfig.plugins[pluginName] = mergePluginConfig[pluginName]
          monitor.pluginCall(pluginName, OPTIONAL_PLUGINS[pluginName])
        }
      })

      // 注册路由相关插件
      if (options.Router) {
        monitor.pluginCall('routerChange', createRouterMonitor(options.Router))
        // 注册性能监控
        if (options.trackList?.includes('pagePerformance') &&
          mergePluginConfig.pagePerformance) {
          mergeConfig.plugins.pagePerformance = mergePluginConfig.pagePerformance
          monitor.pluginCall(
            'pagePerformance',
            createPerformanceObserve(
              mergePluginConfig.pagePerformance.entryTypes,
              options.Router
            )
          )
        }
      }

    } catch (e) {
      console.error('[Z-Monitor] Vue plugin initialization failed:', {
        error: e,
        config: { ...options, trackList: options.trackList },
        platform: options.platform
      })
    }
  }
}