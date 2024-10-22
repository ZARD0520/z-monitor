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