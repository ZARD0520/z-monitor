import { Plugin } from 'z-monitor-core'
import { isNext } from './utils'

export function register(React, mt) {
  if (!React) {
    return console.error('必须要传入React')
  }
  if (!mt) {
    return console.error('必须要传入monitor实例')
  }
  mt.platformName = 'React'
  mt.platform = React

  // eslint-disable-next-line no-unused-vars
  return function (WrappedComponent) {
    const ErrorBoundary = mt.plugins.platform_error?.ErrorBoundary
    function WithErrorBoundary(props) {
      if (!ErrorBoundary) {
        console.warn('错误边界不可用, 已跳过')
        return <WrappedComponent {...props} />
      }
      return (
        <ErrorBoundary fallback={props.fallback}>
          <WrappedComponent {...props} />
        </ErrorBoundary>
      )
    }
    WithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`
    return WithErrorBoundary
  }
}

export class ERROR extends Plugin {
  init() {
    const isReact = this.mt.platformName === 'React'
    if (!isReact) {
      return console.error('检测当前不是react app环境，必须调用register(React)(monitor)注册')
    }
    console.log('React Error init')
    const React = this.mt.platform
    const _this = this
    // 创建一个错误处理函数
    const handleError = (error, errorInfo) => {
      if (!_this.isClose) {
        _this.send({
          type: _this.TYPES.CODE_ERROR,
          level: _this.LEVELS.ERROR,
          data: {
            message: error.message,
            stack: errorInfo.componentStack,
            targetType: '组件边界错误',
            vmName: errorInfo.componentName,
          },
        })
      }
    }

    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { hasError: false }
      }

      static getDerivedStateFromError(error) {
        return { hasError: true, error }
      }

      componentDidCatch(error, errorInfo) {
        handleError(error, errorInfo)
      }

      render() {
        if (this.state.hasError) {
          return this.props.fallback || <h1>Something went wrong.</h1>
        }

        return this.props.children
      }
    }

    // 使用错误边界组件包裹你的应用或组件
    this.ErrorBoundary = ErrorBoundary
  }
}

export class RouterMonitorPlugin extends Plugin {
  init() {
    const isReact = this.mt.platformName === 'React'
    if (!isReact) {
      return console.error('检测当前不是react app环境，必须调用register(React)(monitor)注册')
    }

    this.addCommonData('TYPES', 'ROUTER', {
      text: '页面跳转',
      value: 'ROUTER.CHANGE',
    })
  }

  sendRouteChange(to, from) {
    if (!this.isClose) {
      this.send({
        type: this.TYPES.ROUTER,
        level: this.LEVELS.INFO,
        data: {
          fromPath: from.pathname || from,
          toPath: to.pathname || to,
          fromTitle: from.name || (typeof document !== 'undefined' ? document.title : ''),
        },
      })
    }
  }
}

export function useRouterMonitor(mt, React, history, pathnameFromHook) {
  const ifNext = typeof window !== 'undefined' && isNext()
  const initialPath = history?.location?.pathname ?? pathnameFromHook ?? ''
  const [prevRoutePath, setPrevRoutePath] = React.useState(initialPath)
  const hasReportedInitial = React.useRef(false)

  React.useEffect(() => {
    if (!mt) return
    const routerPlugin = mt?.plugins?.routerChange
    const performancePlugin = mt?.plugins?.pagePerformance

    if (!routerPlugin) return
    // Next.js App Router: 使用 pathname 监听路由变化（由 usePathname() 传入）
    if (pathnameFromHook !== undefined) {
      const currentPath = pathnameFromHook ?? ''
      // 首屏 PV：SSR 落地页、直接访问、刷新时上报初始页面
      if (!hasReportedInitial.current) {
        hasReportedInitial.current = true
        routerPlugin.sendRouteChange({ pathname: currentPath }, { pathname: '', name: 'initial' })
        if (performancePlugin) performancePlugin.startRouteMonitoring(currentPath)
        setPrevRoutePath(currentPath)
        return
      }
      if (prevRoutePath !== currentPath) {
        routerPlugin.sendRouteChange({ pathname: currentPath }, { pathname: prevRoutePath })
        if (performancePlugin) {
          performancePlugin.stopRouteMonitoring(prevRoutePath)
          performancePlugin.startRouteMonitoring(currentPath)
        }
        setPrevRoutePath(currentPath)
      }
      return
    }
    if (!history) return

    const sendRouteChange = (url, path) => {
      const toObj = typeof url === 'string' ? { pathname: url } : url
      const fromObj = typeof path === 'string' ? { pathname: path } : path
      routerPlugin.sendRouteChange(toObj, fromObj)
      if (performancePlugin) {
        if (prevRoutePath !== (toObj.pathname || url)) {
          performancePlugin.stopRouteMonitoring(prevRoutePath)
        }
        performancePlugin.startRouteMonitoring(toObj.pathname || url)
      }
    }

    if (ifNext) {
      const handleRouteChange = (url, { shallow }) => {
        if (!shallow) sendRouteChange(url, prevRoutePath)
      }
      history.events.on('routeChangeComplete', handleRouteChange)
      return () => history.events.off('routeChangeComplete', handleRouteChange)
    } else {
      const unlisten = history.listen((location) => {
        sendRouteChange(location.pathname, prevRoutePath)
        setPrevRoutePath(location.pathname)
      })
      return () => unlisten()
    }
  }, [mt, ifNext, history, pathnameFromHook, prevRoutePath])
}

export class PerformanceMonitorPlugin extends Plugin {
  init(options = {}) {
    this.observers = new Map()
    this.currentRoute = null
    this.entryTypes = options.entryTypes || ['navigation', 'resource']
    this.startRouteMonitoring(window.location.pathname)
  }

  startRouteMonitoring(routePath) {
    if (this.observers?.has(routePath)) return

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
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
