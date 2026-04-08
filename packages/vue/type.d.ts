export as namespace Monitor

// Monitor-Vue插件类
export interface MonitorPlugin {
  install(Vue: any, configs?: DEFAULT_CONFIG): void
}

// Monitor-Vue插件配置
export interface DEFAULT_CONFIG {
  key: string
  url: string
  platform: string
  trackList?: string[]
  pluginConfig?: PLUGIN_CONFIG
  Router?: any
  /** 与后端约定相同字符串时，上报 `/monitor/add` 的 body 将使用 AES-256-GCM 加密 */
  reportEncryptSecret?: string
}

export interface PLUGIN_CONFIG {
  log?: {
    type: 'time' | 'num' | 'hybrid'
    time?: number
    max?: number
    MAX_HTTP_FAIL?: number
    customMethod?: (item: any) => any
  }
  ajax?: {
    req?: boolean
    res?: boolean
    customMethod?: (data: any, [ajax]: [any?]) => any
  }
  http?: {
    isCustomRequest?: boolean
    requestConfig?: {
      method: 'POST' | 'GET' | 'PUT'
      headers?: {
        [name: string]: any
      }
    }
  }
  click?: {
    isPartial?: boolean
    globalDebounce?: number
    partialAttribute?: string
    debounceAttribute?: string
  }
  userInfo?: {
    getData?: () => any
  }
  pagePerformance?: {
    entryTypes?: Array<string>
  }
}

declare const plugin: MonitorPlugin
export default plugin
