export function reLog(value, type = "log") {
  if (typeof console[type] === "function") {
    console[type](value)
  } else {
    console.log(value)
  }
}

export function hasValue(value) {
  return value !== null && value !== undefined
}

export function isFalse(data) {
  return !data
}

export const getObjType = (obj, type) => {
  let toString = Object.prototype.toString
  let map = {
    "[object Boolean]": "boolean",
    "[object Number]": "number",
    "[object String]": "string",
    "[object Function]": "function",
    "[object Array]": "array",
    "[object Date]": "date",
    "[object RegExp]": "regExp",
    "[object Undefined]": "undefined",
    "[object Null]": "null",
    "[object Object]": "object",
  }
  if (obj instanceof Element) {
    return "element"
  }
  return map[toString.call(obj)] === type
}

export function getObj(value, name) {
  return value ? value[name] || {} : {}
}

// DOM相关
/**
 * 获取event的path
 */
export function getPath(event) {
  return event.path || (event.composedPath && event.composedPath()) || ""
}

export function getCurHtml(dom, saveText = false) {
  if (dom.innerHTML)
    return dom.outerHTML.replace(
      dom.innerHTML,
      saveText ? dom.innerText.slice(0, 15) : ""
    )
  return dom.outerHTML
}

export function isNormalTag(dom) {
  return (
    [
      "[object Window]",
      "[object HTMLDocument]",
      "[object HTMLHtmlElement]",
      "[object HTMLBodyElement]",
    ].indexOf(dom.toString()) === -1
  )
}

export function AttrContent(dom) {
  if (dom.id) {
    return "#" + dom.id
  }
  if (dom.getAttribute("class")) {
    return "." + dom.getAttribute("class").replace(" ", ".")
  }
  if (dom.getAttribute("style")) {
    return "(" + dom.getAttribute("style") + ")"
  }
  return ""
}

// 埋点标识识别
export function hasMonitorAttribute(element, attrName) {
  let current = element
  while (current) {
    if (current.hasAttribute(attrName)) {
      return true
    }
    current = current.parentElement
  }
  return false
}

// 埋点防抖时长识别
export function getElementDebounce(element, attrName) {
  let current = element
  while (current) {
    const debounceValue = current.getAttribute(attrName)
    if (debounceValue) {
      const debounceNum = parseInt(debounceValue, 10)
      if (!isNaN(debounceNum) && debounceNum >= 0) {
        return debounceNum
      }
    }
    current = current.parentElement
  }
  return null
}

// 获取规范化路径
export function getNormalizedPath(path) {
  let pathStr = ""
  const len = Math.min(path.length - 1, 5)

  for (let i = len; i >= 0; i--) {
    if (isNormalTag(path[i])) {
      pathStr = pathStr
        ? `${path[i].localName}${AttrContent(path[i])} > ${pathStr}`
        : `${path[i].localName}${AttrContent(path[i])}`
    }
  }

  return pathStr
}

// 处理防抖集合
export function addToDebounceMap(element, debounceMs, debounceMap) {
  const actualDebounce = Math.min(debounceMs, 5000)

  if (debounceMap.size >= 1000) {
    const firstKey = debounceMap.keys().next().value
    debounceMap.delete(firstKey)
  }

  debounceMap.set(element, Date.now())
  setTimeout(() => {
    debounceMap.delete(element)
  }, actualDebounce)
}

// 获取调度器
export function getScheduler(fn) {
  let scheduleFlush = () => setTimeout(fn, 0)
  if (typeof requestIdleCallback === 'function') {
    scheduleFlush = () => {
      requestIdleCallback(fn)
    }
  } else if (typeof MessageChannel === 'function') {
    const channel = new MessageChannel()
    channel.port1.onmessage = () => fn()
    scheduleFlush = () => channel.port2.postMessage(null)
  }
  return scheduleFlush
}
