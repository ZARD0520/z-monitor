import { register as registerVue2, ERROR as ErrorVue2, createRouterMonitor as createRouterMonitorVue2 } from './vue2'
import { register as registerVue3, ERROR as ErrorVue3, createRouterMonitor as createRouterMonitorVue3 } from './vue3'
import { Plugin } from 'z-monitor-core'

function createPerformanceObserve(entryTypes, router) {
  return class extends Plugin {
    init() {
      if (!router) {
        return console.error('缺少路由对象参数')
      }
      if (!entryTypes?.length) {
        return console.error('缺少监控目标参数')
      }
      router.beforeEach((to, from, next) => {
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
        next();
      });
    }
  }
}

export function usePlatform(platform) {
  if (platform === 'vue2') {
    return {
      register: registerVue2,
      ERROR: ErrorVue2,
      createRouterMonitor: createRouterMonitorVue2,
      createPerformanceObserve
    }
  } else if (platform === 'vue3') {
    return {
      register: registerVue3,
      ERROR: ErrorVue3,
      createRouterMonitor: createRouterMonitorVue3,
      createPerformanceObserve
    }
  }
}