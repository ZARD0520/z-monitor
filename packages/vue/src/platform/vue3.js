import { Plugin } from 'z-monitor-core'
import { nextTick } from 'vue'

export function register(Vue) {
  return function (mt, plugins = null) {
    if (!Vue) {
      return console.error('必须要传入Vue')
    }
    if (!mt) {
      return console.error('必须要传入monitor实例')
    }
    mt.platformName = 'vue3'
    mt.platform = Vue
    Vue.config.globalProperties.mt = mt
    if (plugins) {
      for (let i in plugins) {
        if (!plugins[i]) {
          return console.error(`找不到${plugins[i]}模块`)
        }
        if (!plugins[i].open) {
          return console.error(`${plugins[i]}模块未激活`)
        }
        mt.pluginCall(i, plugins[i])
      }
    }
  }
}

export class ERROR extends Plugin {
  init() {
    const isVue3 = this.mt.platformName === 'vue3';
    if (!isVue3) {
      return console.error('检测当前不是vue3 app环境，必须调用register(Vue)(monitor)注册');
    }
    console.log('Vue Error init');
    const Vue = this.mt.platform;
    const _this = this;
    // 异步调用，防止主进程覆盖重写的Vue.config.errorHandler方法
    setTimeout(() => {
      const errorHandler = Vue.config.errorHandler;
      Vue.config.errorHandler = function (...args) {
        if (!_this.isClose) {
          const [err, vm, info] = args;
          nextTick(() => {
            _this.send({
              type: _this.TYPES.CODE_ERROR,
              level: _this.LEVELS.ERROR,
              data: {
                message: err.message,
                stack: err.stack,
                hook: info,
                vmName: vm.tag || vm.$vnode ? vm.$vnode.tag : '',
              },
            });
          });
        }
        return errorHandler && errorHandler.apply(this, args);
      };
    });
  }
}

export function createRouterMonitor(router) {
  return class extends Plugin {
    init() {
      const isVue3 = this.mt.platformName === 'vue3';
      if (!isVue3) {
        return console.error('检测当前不是vue3 app环境，必须调用register(Vue)(monitor)注册');
      }
      console.log('Vue Router change');
      this.addCommonData('TYPES', 'ROUTER', {
        text: '页面跳转',
        value: 'ROUTER.CHANGE',
      });
      // const Vue = this.mt.platform;
      router.afterEach((to, from) => {
        if (!this.isClose) {
          this.send(
            {
              type: this.TYPES.ROUTER,
              level: this.LEVELS.INFO,
              data: {
                fromPath: from.fullPath,
                toPath: to.fullPath,
                fromTitle: from.name ? from.name : document.title,
              },
            },
            from,
            to,
          );
        }
      });
    }
  };
}