<!-- 用法 -->
* Vue
  * 调用createMonitor，传入参数
    * config
      * key：唯一key
      * platform：使用的平台，sdk会根据platform调用相应的方法
    * pluginConfig
      * 每个插件的配置，参数open为true时才启用该插件
      * 更具体配置参考defaultPluginConfig
    * Vue：初始化后的Vue对象
    * Router：初始化后的Router对象
  * 调用后，埋点监控直接就开始工作
* React
  * 调用createMonitor，传入参数
    * config
      * key：唯一key
      * platform：使用的平台，sdk会根据platform调用相应的方法
    * pluginConfig
      * 每个插件的配置，参数open为true时才启用该插件
      * 更具体配置参考defaultPluginConfig
    * React：React对象
    * Router：React-Router对象 
  * 调用后，得到withMt和ErrorHanding
    * withMt是放在React App最外层，用于传递监控mt对象
    * ErrorHanding放在withMt的里一层，用于捕获React的边界错误
    * 在ErrorHanding内部就可以放置项目代码了

<!-- TO DO LIST -->
* 修bug(一切功能还没落地使用过，纯盲打)