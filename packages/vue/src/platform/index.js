import { register as registerVue2, ERROR as ErrorVue2, createRouterMonitor as createRouterMonitorVue2 } from './vue2'
import { register as registerVue3, ERROR as ErrorVue3, createRouterMonitor as createRouterMonitorVue3 } from './vue3'

export function usePlatform(platform) {
  if (platform === 'vue2') {
    return {
      register: registerVue2,
      ERROR: ErrorVue2,
      createRouterMonitor: createRouterMonitorVue2
    }
  } else if (platform === 'vue3') {
    return {
      register: registerVue3,
      ERROR: ErrorVue3,
      createRouterMonitor: createRouterMonitorVue3
    }
  }
}