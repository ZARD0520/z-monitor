import { defaultPluginConfig, Monitor } from '@libc/core'

const defaultConfig = {
  platform: 'vue2', // 监听的平台，默认为Vue2
  key: 'z-monitor-' + Date.now().toString() // 唯一key
}

export default function createMonitor(config = defaultConfig, pluginConfig = defaultPluginConfig) {
  try {
    const mergeConfig = {
      key: config.key,
      plugins: {}
    }
    Object.keys(pluginConfig).forEach((plugin) => {
      if (plugin.open) {
        mergeConfig.plugins[plugin] = pluginConfig[plugin]
      }
    })
    const monitor = new Monitor(mergeConfig)
    // 注册平台监控
    register(config.platform)(monitor)
    // 分别注册插件
  } catch (e) {
    console.error(e, 'monitor错误')
  }
}