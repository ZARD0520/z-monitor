import { getCurHtml, getPath, isNormalTag, AttrContent } from '../utils/index.js';
import { Plugin } from '../plugin.js';
import { EMIT_ERROR } from '../constant/index.js';

export default class CLICK extends Plugin {
  init(options) {
    console.log('Click init');
    this.options = options;
    this.clickEvent = (e) => this.handleClick(e);
    window.addEventListener('mouseup', this.clickEvent);
  }
  handleClick(event) {
    try {
      const target = event.target;
      if (!isNormalTag(target)) return;
      let path = getPath(event);
      let pathStr = '';
      const len = Math.min(path.length - 1, 5);
      for (let i = len; i >= 0; i--) {
        if (isNormalTag(path[i]))
          pathStr = pathStr + (pathStr ? ' > ' : '') + path[i].localName + AttrContent(path[i]);
      }
      this.send({
        type: this.TYPES.CLICK,
        level: this.LEVELS.INFO,
        data: {
          target: getCurHtml(path[0], true),
          path: pathStr,
        },
      });
    } catch (e) {
      this.mt.emit('error', EMIT_ERROR.PLUGIN_ERROR);
      this.destroy();
    }
  }
  destroy() {
    window.removeEventListener('mouseup', this.clickEvent);
  }
}
