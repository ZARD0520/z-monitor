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
      /* 首次加载资源指标 */
      window.addEventListener('load', () => {
        setTimeout(() => {
          const performanceData = {
            resources: window.performance.getEntriesByType('resource').map((res) => ({
              name: res.name, // 资源URL
              type: res.initiatorType, // 类型（img/script/css等）
              duration: res.duration, // 加载耗时
              size: res.transferSize, // 传输大小（字节）
              protocol: res.nextHopProtocol, // 协议（http/1.1、h2等）
            })),
            content: {
              domCount: document.getElementsByTagName('*').length, // DOM节点数
              imgCount: document.images.length, // 图片数量
              scriptCount: document.scripts.length, // 脚本数量
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
      /* TODO: 持续监控性能 */
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
