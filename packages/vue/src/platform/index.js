import { register as registerVue2, ERROR as ErrorVue2 } from './vue2'
import { register as registerVue3, ERROR as ErrorVue3 } from './vue3'
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

      this.observers = new Map()
      this.currentRoute = null
      this.entryTypes = entryTypes

      /* 首次加载资源指标 */
      window.addEventListener('load', () => {
        setTimeout(() => {
          const performanceData = {
            resources: window.performance.getEntriesByType('resource').map((res) => ({
              name: res.name,
              type: res.initiatorType,
              duration: res.duration,
              size: res.transferSize,
              protocol: res.nextHopProtocol,
            })),
            content: {
              domCount: document.getElementsByTagName('*').length,
              imgCount: document.images.length,
              scriptCount: document.scripts.length,
            },
          }
          this.send({
            type: this.TYPES.PERFORMANCE,
            level: this.LEVELS.INFO,
            data: {
              performanceData,
            },
          })
        }, 1000)
      })

      /* 持续监控性能 */
      this.startRouteMonitoring(window.location.pathname)

      /* 路由切换时重新启动监控 */
      router.afterEach((to, from) => {
        this.stopRouteMonitoring(from.fullPath)
        this.startRouteMonitoring(to.fullPath)
      })
    }

    startRouteMonitoring(routePath) {
      if (this.observers.has(routePath)) return

      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // 过滤出指定类型的性能指标
          if (!this.entryTypes.includes(entry.entryType)) return
          // 过滤请求指标
          if (['xmlhttprequest', 'fetch'].includes(entry.initiatorType)) return
          this.send({
            type: this.TYPES.PERFORMANCE,
            level: this.LEVELS.INFO,
            data: entry,
          })
        })
      })

      observer.observe({ entryTypes: this.entryTypes })
      this.observers.set(routePath, observer)
      this.currentRoute = routePath
    }

    stopRouteMonitoring(routePath) {
      const observer = this.observers.get(routePath)
      if (observer) {
        observer.disconnect()
        this.observers.delete(routePath)
      }
    }

    destroy() {
      this.observers.forEach((observer) => observer.disconnect())
      this.observers.clear()
    }
  }
}

function createRouterMonitor(router) {
  return class extends Plugin {
    init() {
      const isVue = this.mt.platformName?.includes('vue')
      if (!isVue) {
        return console.error('检测当前不是vue app环境，必须调用register(Vue)(monitor)注册')
      }

      this.addCommonData('TYPES', 'ROUTER', {
        text: '页面跳转',
        value: 'ROUTER.CHANGE',
      })

      let startTime = 0
      router.beforeEach((to, from, next) => {
        startTime = Date.now()
        next()
      })
      router.afterEach((to, from) => {
        if (!this.isClose) {
          const duration = Date.now() - startTime
          this.send(
            {
              type: this.TYPES.ROUTER,
              level: this.LEVELS.INFO,
              data: {
                fromPath: from.fullPath,
                toPath: to.fullPath,
                fromTitle: from.name ? from.name : document.title,
                fromMeta: from.meta,
                duration,
              },
            },
            from,
            to
          )
        }
      })
    }
  }
}

export function usePlatform(platform) {
  if (platform === 'vue2') {
    return {
      register: registerVue2,
      ERROR: ErrorVue2,
      createRouterMonitor,
      createPerformanceObserve,
    }
  } else if (platform === 'vue3') {
    return {
      register: registerVue3,
      ERROR: ErrorVue3,
      createRouterMonitor,
      createPerformanceObserve,
    }
  }
}
