import { Plugin } from 'z-monitor-core'
import { isNext } from './utils'

export function register(React) {
  return function (mt, plugins = null) {
    if (!React) {
      return console.error('必须要传入React')
    }
    if (!mt) {
      return console.error('必须要传入monitor实例')
    }
    mt.platformName = 'React'
    mt.platform = React
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
    return function (WrappedComponent) {
      const ErrorBoundary = mt.plugins.platform_error?.ErrorBoundary
      return function (props) {
        if (!ErrorBoundary) {
          console.warn('错误边界不可用, 已跳过')
          return <WrappedComponent {...props} mt={mt} />
        }
        return (
          <ErrorBoundary fallback={props.fallback}>
            <WrappedComponent {...props} mt={mt} />
          </ErrorBoundary>
        )
      }
    }
  }
}

export class ERROR extends Plugin {
  init() {
    const isReact = this.mt.platformName === 'React';
    if (!isReact) {
      return console.error('检测当前不是react app环境，必须调用register(React)(monitor)注册')
    }
    console.log('React Error init');
    const React = this.mt.platform;
    const _this = this;
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
            vmName: errorInfo.componentName
          }
        })
      }
    }

    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false };
      }

      static getDerivedStateFromError(error) {
        return { hasError: true };
      }

      componentDidCatch(error, errorInfo) {
        handleError(error, errorInfo);
      }

      render() {
        if (this.state.hasError) {
          return this.props.fallback || <h1>Something went wrong.</h1>;
        }

        return this.props.children;
      }
    }

    // 使用错误边界组件包裹你的应用或组件
    this.ErrorBoundary = ErrorBoundary
  }
}

export class RouterMonitorPlugin extends Plugin {
  init() {
    const isReact = this.mt.platformName === 'React';
    if (!isReact) {
      return console.error('检测当前不是react app环境，必须调用register(React)(monitor)注册');
    }

    this.addCommonData('TYPES', 'ROUTER', {
      text: '页面跳转',
      value: 'ROUTER.CHANGE',
    });
  }

  sendRouteChange(to, from) {
    if (!this.isClose) {
      this.send({
        type: this.TYPES.ROUTER,
        level: this.LEVELS.INFO,
        data: {
          fromPath: from.pathname || from,
          toPath: to.pathname || to,
          fromTitle: from.name || document.title
        }
      });
    }
  }
}

export function useRouterMonitor(mt, React, history) {
  const ifNext = isNext()
  const [prevRoutePath, setPrevRoutePath] = React.useState(history.location.pathname)

  React.useEffect(() => {
    const routerPlugin = mt?.plugins?.routerChange;
    const performancePlugin = mt?.plugins?.pagePerformance;

    // 前置判断
    if (!routerPlugin) {
      return console.error('尚未注册路由监控插件')
    }
    if (!history) {
      return console.error('路由监控需要传入history对象')
    }

    const sendRouteChange = (url, path) => {
      routerPlugin.sendRouteChange(url, path);
      // 性能相关的监控
      if (performancePlugin) {
        // 停止前一路由的监控（保留数据）
        if (prevRoutePath !== url) {
          performancePlugin.stopRouteMonitoring(prevRoutePath);
        }

        // 启动新路由监控
        performancePlugin.startRouteMonitoring(url);
      }
    }

    if (ifNext) {
      const handleRouteChange = (url, { shallow }) => {
        if (!shallow) {
          sendRouteChange(url, prevRoutePath);
        }
      };

      history.events.on('routeChangeComplete', handleRouteChange);

      return () => {
        history.events.off('routeChangeComplete', handleRouteChange);
      };
    } else {
      const unlisten = history.listen((location) => {
        sendRouteChange(
          location.pathname,
          prevRoutePath
        );
        setPrevRoutePath(location.pathname)
      });

      return () => unlisten()
    }
  }, [ifNext, history])
}

export class PerformanceMonitorPlugin extends Plugin {
  init(options = {}) {
    this.observers = new Map();
    this.currentRoute = null;
    this.entryTypes = options.entryTypes || ['navigation', 'resource'];
    this.startRouteMonitoring(window.location.pathname);
  }

  startRouteMonitoring(routePath) {
    if (this.observers.has(routePath)) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach(entry => {
        this.send({
          type: this.TYPES.PERFORMANCE,
          level: this.LEVELS.INFO,
          data: entry
        });
      });
    });

    observer.observe({ entryTypes: this.entryTypes });
    this.observers.set(routePath, observer);
    this.currentRoute = routePath;
  }

  stopRouteMonitoring(routePath) {
    const observer = this.observers.get(routePath);
    console.log(routePath, this.observers)
    if (observer) {
      console.log('this is stop2')
      observer.disconnect();
      this.observers.delete(routePath);
    }
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}