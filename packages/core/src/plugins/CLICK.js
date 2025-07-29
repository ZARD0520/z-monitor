import {
  getCurHtml,
  getPath,
  isNormalTag,
  hasMonitorAttribute,
  getElementDebounce,
  getNormalizedPath,
  addToDebounceMap,
} from "../utils/index.js"
import { Plugin } from "../plugin.js"
import { EMIT_ERROR } from "../constant/index.js"

export default class CLICK extends Plugin {
  init(options) {
    console.log("Click init")
    this.options = options
    this.debounceMap = new Map()
    this.clickEvent = (e) => this.handleClick(e)
    window.addEventListener("mouseup", this.clickEvent)
  }
  handleClick(event) {
    try {
      const target = event.target
      const { isPartial, partialAttribute, debounceAttribute, globalDebounce } =
        this.options

      if (!isNormalTag(target)) return
      if (isPartial && !hasMonitorAttribute(target, partialAttribute)) {
        return
      }

      if (this.debounceMap.has(target)) {
        return
      }

      const debounceMs =
        globalDebounce || getElementDebounce(target, debounceAttribute)
      if (debounceMs) {
        addToDebounceMap(target, debounceMs, this.debounceMap)
      }

      const path = getPath(event)
      this.send({
        type: this.TYPES.CLICK,
        level: this.LEVELS.INFO,
        data: {
          target: getCurHtml(path[0], true),
          path: getNormalizedPath(path),
        },
      })
    } catch (e) {
      this.mt.emit("error", EMIT_ERROR.PLUGIN_ERROR)
      this.destroy()
    }
  }
  destroy() {
    this.debounceMap.clear();
    window.removeEventListener("mouseup", this.clickEvent)
  }
}
