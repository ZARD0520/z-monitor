import {
  register,
  ERROR,
  useRouterMonitor,
  RouterMonitorPlugin,
  PerformanceMonitorPlugin,
} from './react'

export function usePlatform(platform) {
  if (platform === 'react') {
    return {
      register,
      ERROR,
      RouterMonitorPlugin,
      PerformanceMonitorPlugin,
      useRouterMonitor,
    }
  }
}
