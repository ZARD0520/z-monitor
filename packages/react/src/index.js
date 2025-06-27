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

export default function createMonitor(React, { history } = {}, configs = {}, pluginConfig = {}) {
  // 初始化监控实例
  const monitor = React.useRef(null)
  const MonitorWrapper = React.useRef(({ children }) => <>{children}</>)

  // 合并配置
  const options = {
    ...DEFAULT_CONFIG,
    ...configs
  }

  const { register, ERROR: REACT_ERROR, RouterMonitorPlugin, useRouterMonitor, PerformanceMonitorPlugin } = usePlatform(options.platform)

  // 未存在实例，初始化
  if (!monitor.current) {
    // 初始化监控系统
    try {
      const mergePluginConfig = {};
      for (const key in defaultPluginConfig) {
        mergePluginConfig[key] = {
          ...defaultPluginConfig[key],
          ...pluginConfig[key]
        };
      }

      // 性能监控配置
      const performanceConfig =
        options.trackList?.includes('pagePerformance') &&
          mergePluginConfig?.pagePerformance
          ? {
            enabled: true,
            entryTypes: mergePluginConfig.pagePerformance.entryTypes
          }
          : null

      const mergeConfig = {
        url: options.url,
        key: options.key,
        plugins: {
          http: mergePluginConfig.http,
          log: mergePluginConfig.log
        }
      };

      const monitorInstance = new Monitor(mergeConfig);

      const withMt = register(React, monitorInstance);

      // 注册核心插件
      Object.entries(CORE_PLUGINS).forEach(([name, plugin]) => {
        monitorInstance.pluginCall(name, plugin);
      });

      // 注册平台错误处理插件
      monitorInstance.pluginCall('platform_error', REACT_ERROR);
      // 注册可选插件
      options.trackList?.forEach(pluginName => {
        if (OPTIONAL_PLUGINS[pluginName] && mergePluginConfig[pluginName]) {
          mergeConfig.plugins[pluginName] = mergePluginConfig[pluginName];
          monitorInstance.pluginCall(pluginName, OPTIONAL_PLUGINS[pluginName]);
        }
      });

      // 注册路由插件（但不立即启用）
      if (React && history) {
        monitorInstance.pluginCall('routerChange', RouterMonitorPlugin);
      }

      // 注册性能监控插件（但不立即启用）
      if (performanceConfig) {
        monitorInstance.pluginCall('pagePerformance', PerformanceMonitorPlugin);
      }

      MonitorWrapper.current = withMt(({ children }) => <>{children}</>)
      monitor.current = monitorInstance
    } catch (e) {
      console.error('[Z-Monitor] Initialization failed:', {
        error: e,
        config: { ...options, trackList: options.trackList },
        platform: options.platform
      });
    }
  }

  // 处理路由插件的启用/禁用，TODO
  useRouterMonitor(monitor.current, React, history)

  return {
    MonitorWrapper: MonitorWrapper.current,
    mt: monitor.current
  }
}