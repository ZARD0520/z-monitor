export as namespace Monitor

// Monitor-React函数
export function useMonitor(
  React: any,
  options?: { history?: any },
  configs?: DEFAULT_CONFIG,
  pluginConfig?: PLUGIN_CONFIG
): {
  MonitorWrapper: React.ComponentType<{ children: React.ReactNode }>
  mt: any
}

// Monitor-React插件配置
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

export default useMonitor
