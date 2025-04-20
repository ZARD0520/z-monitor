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
      return function (props) {
        return <WrappedComponent {...props} mt={mt} />;
      }
    }
  }
}

export class ERROR extends Plugin {
  init() {
    const isReact = this.mt.platformName === 'React';
    if (isReact) {
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
            message: error,
            stack: errorInfo.componentStack,
            hook: {
              props: errorInfo.props,
              state: errorInfo.state
            },
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
          return <h1>Something went wrong.</h1>;
        }

        return this.props.children;
      }
    }

    // 使用错误边界组件包裹你的应用或组件
    this.ErrorBoundary = ErrorBoundary
  }
}

export function createRouterMonitor({
  React,
  useHistory
}) {
  return class extends Plugin {
    init() {
      const isReact = this.mt.platformName === 'React';
      if (!isReact) {
        return console.error('检测当前不是react app环境，必须调用register(React)(monitor)注册');
      }
      if (!React || !useHistory) {
        return console.error('React或路由相关hooks未传入，请先传入相关参数')
      }
      console.log('React Router change');
      this.addCommonData('TYPES', 'ROUTER', {
        text: '页面跳转',
        value: 'ROUTER.CHANGE',
      });

      const history = useHistory()

      const sendRouteChange = (to, from) => {
        if (!this.isClose) {
          this.send({
            type: this.TYPES.ROUTER,
            level: this.LEVELS.INFO,
            data: {
              fromPath: from.pathname,
              toPath: to.pathname,
              fromTitle: from.name || document.title
            }
          })
        }
      }

      const ifNext = isNext()
      React.useEffect(() => {
        // 区分next和react
        if (ifNext) {
          history.events.on('routeChangeComplete', (url, { shallow }) => {
            if (!shallow) {
              sendRouteChange(url, history.asPath)
            }
          })
          return () => {
            history.events.off('routeChangeComplete', (url, { shallow }) => {
              if (!shallow) {
                sendRouteChange(url, history.asPath)
              }
            })
          }
        } else {
          const unlisten = history.listen((location, action) => {
            sendRouteChange(location.pathname, history.location.pathname)
          })
          return () => unlisten()
        }
      }, [history, sendRouteChange])
    }
  }
}