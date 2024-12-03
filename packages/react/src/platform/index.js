import { register, ERROR, createRouterMonitor } from './react'
import { Plugin } from '@libc/core'

function createPerformanceObserve(entryTypes, React, useLocation) {
  return class extends Plugin {
    init() {
      if (!useLocation) {
        return console.error('缺少路由相关参数')
      }
      if (!entryTypes?.length) {
        return console.error('缺少监控目标参数')
      }

      const location = useLocation();

      React.useEffect(() => {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.send(
              {
                type: this.TYPES.PERFORMANCE,
                level: this.LEVELS.INFO,
                data: {
                  entry
                },
              }
            )
          }
        });
        observer.observe({ entryTypes });

        return () => {
          observer.disconnect();
        };
      }, [location]);
    }
  }
}

export function usePlatform(platform) {
  if (platform === 'react') {
    return {
      register,
      ERROR,
      createRouterMonitor,
      createPerformanceObserve
    }
  }
}