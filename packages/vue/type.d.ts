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
