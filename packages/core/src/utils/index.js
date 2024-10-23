export function reLog(value, type = 'log') {
  console[type](value)
}

export function hasValue(value) {
  return value !== null || value !== undefined
}

export function isFalse(data) {
  return data === false;
}

export const getObjType = (obj, type) => {
  let toString = Object.prototype.toString;
  let map = {
    '[object Boolean]': 'boolean',
    '[object Number]': 'number',
    '[object String]': 'string',
    '[object Function]': 'function',
    '[object Array]': 'array',
    '[object Date]': 'date',
    '[object RegExp]': 'regExp',
    '[object Undefined]': 'undefined',
    '[object Null]': 'null',
    '[object Object]': 'object',
  };
  if (obj instanceof Element) {
    return 'element';
  }
  return map[toString.call(obj)] === type;
}

export function getObj(value, name) {
  if (!value) {
    return {};
  }
  if (value) {
    return value[name] || {};
  }
  return {};
}

// DOM相关
/**
 * 获取event的path
 */
export function getPath(event) {
  return event.path || (event.composedPath && event.composedPath()) || '';
}

export function getCurHtml(dom, saveText = false) {
  if (dom.innerHTML)
    return dom.outerHTML.replace(dom.innerHTML, saveText ? dom.innerText.slice(0, 15) : '');
  return dom.outerHTML;
}

export function isNormalTag(dom) {
  return (
    [
      '[object Window]',
      '[object HTMLDocument]',
      '[object HTMLHtmlElement]',
      '[object HTMLBodyElement]',
    ].indexOf(dom.toString()) === -1
  );
}

export function AttrContent(dom) {
  if (dom.id) {
    return '#' + dom.id;
  }
  if (dom.getAttribute('class')) {
    return '.' + dom.getAttribute('class').replace(' ', '.');
  }
  if (dom.getAttribute('style')) {
    return '(' + dom.getAttribute('style') + ')';
  }
  return '';
}
