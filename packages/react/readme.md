## 一款轻量、高性能、可扩展的前端埋点 SDK，用于自动化和手动收集用户行为、性能数据与错误信息，并上报至你的数据分析平台。

## ✨ 特性

- 🛠 开箱即用：简单配置，快速集成，自动收集常见用户行为（如 PV/UV、点击、曝光、错误等）。
- 🚀 高性能：采用 fetch(low优先级) 和批量上报机制，对页面性能影响小。
- 📦 轻量无依赖：核心包体积仅 <90>KB。
- 🔧 高度可定制：支持自定义事件、扩展字段、生命周期钩子。
- 🌐 跨框架兼容：支持 React、Vue（目前仅支持SPA，SSR及其他框架暂未兼容），不同框架安装不同的子包。

## 📦 安装

使用 NPM/YARN/PNPM(推荐）

```javascript
// 选择你的包管理器
npm install z-monitor-react
// 或
yarn add z-monitor-react
// 或
pnpm add z-monitor-react
```

## 🚀 快速开始

1. 初始化

   ```javascript
   import useMonitor from 'z-monitor-react'

   const { MonitorWrapper, mt } = useMonitor(
     React,
     {
       history: History, // history实例对象
     },
     {
       url: '服务器地址',
       platform: 'react', // 项目对应框架
       key: 'z-admin', // 唯一key
       trackList: ['userInfo', 'ajax', 'pagePerformance'], // 可选，要采集的信息
     },
     {
       ajax: {
         excludeUrls: [
           /*要排除监控的地址*/
         ],
       },
       userInfo: {
         // 采集的用户信息
         getData: () => {
           const store = useStore()
           return {
             userId: store.state.user.userInfo.nick,
             userName: store.state.user.userInfo.nick,
           }
         },
       },
       log: {
         type: 'num', // 批量上报触发类型
         max: 5, // 超过此值上报
       },
     }
   )
   ```

2. 自动采集

   初始化后，SDK会自动收集以下数据
   - 用户点击（Click）：自动记录点击元素的选择器路径
   - 路由跳转（RouteChange）：自动记录路由跳转路径、标题和时间
   - 错误监控（Error）：捕获 JavaScript 执行错误、异步错误、资源加载失败
   - 基础信息（BaseInfo）：记录当前页面标题、地址、用户设备信息、网络状态、时区、语言等基础信息
   - AJAX（Xhr）：记录通过xhr发起的请求，启用该记录需要参数的trackList上加ajax
   - 用户信息数据（UserInfo）：通过用户自定义方法获取的用户信息，启用该记录需要用户传入自定义获取方法和trackList上加userInfo
   - 页面性能（PagePerformance）：记录当前页面性能数据，启用该记录需要参数的trackList上加pagePerformance

3. 手动上报自定义事件

   ```jsx
   // 创建Context
   export const MtContext = React.createContext(null)

   // 应用顶层使用MtContext进行实例值传递
   <MtContext.Provider value={mt}>{ children }</MtContext.Provider>

   // 获取monitor实例
   const monitor = useContext(MtContext)

   // 记录用户故事
   monitor.startRecord('story name', /* 自定义数据 */, /* 记录时间 */)
   monitor.endRecord('story name')

   // 记录自定义事件
   monitor.count('name', /* 自定义数据 */)

   ```

## ⚙️ 核心配置

|       参数        |   类型   | 默认值 |                         描述                          |
| :---------------: | :------: | :----: | :---------------------------------------------------: |
|        url        |  string  |        |                 必填，上报服务端地址                  |
|     platform      |  string  |        |        必填，前端框架名称（Vue2、Vue3、React）        |
|        key        |  string  |        |                   必填，项目唯一key                   |
|     trackList     | string[] |        | 选填，可选采集的信息：userInfo、ajax、pagePerformance |
|      Router       |  Router  |        |                    必填，路由实例                     |
|   pluginConfig    |  Object  |        |                    选填，插件配置                     |
| pluginConfig.ajax |  Object  |        |                  选填，插件配置-AJAX                  |

```typescript
// pluginConfig 全部可选参数
interface pluginConfig {
  /** ajax请求插件配置 */
  ajax: {
    req: boolean // 是否开启对请求参数的记录
    res: boolean // 是否开启对响应数据的记录
    customMethod: (data: any, [ajax]: [any?]) => any // 自定义处理ajax数据方法
  }
  /** log记录插件配置 */
  log: {
    type: 'time' | 'num' | 'hybrid' // time：用时间来控制上传频率；num：用采集次数控制；hybrid：同时控制
    time: number // x毫秒上传一次日志
    max: number // 超过x条数据触发上传日志
    MAX_HTTP_FAIL: number // 超过x次失败关闭监控，服务端接口可能错误
    customMethod: (item: any) => any // 自定义处理日志数据
  }
  /** click点击插件配置 */
  click: {
    isPartial: boolean // 是否通过埋点标识属性来采集
    globalDebounce: number // 设定全部元素的采集防抖-毫秒值
    partialAttribute: string // 埋点标识属性名称
    debounceAttribute: string // 防抖时长标识属性名称，获取该标识的值作为该元素的点击采集防抖-毫秒值
  }
  /** http插件配置 */
  http: {
    isCustomRequest: boolean // 是否启用自定义请求
    requestConfig: {
      method: 'POST' | 'GET' | 'PUT'
      headers: {
        // 常见headers配置
      }
    }
    customMethod: (data: any, done: any, errCatch: any) => any // 自定义请求，data为采集上报的参数数据，done为成功回调，errCatch为失败回调
  }
  /** userInfo插件配置 */
  userInfo: {
    getData: () => any // 自定义获取用户数据
  }
  /** pagePerformance插件配置 */
  pagePerformance: {
    entryTypes: Array<string> // 要采集的性能数据类型（paint、resource、longtask等常见浏览器性能数据类型）
  }
}
```
