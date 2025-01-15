import { Plugin } from '../plugin.js';

export default class COUNT extends Plugin {
  init() {
    console.log('COUNT init');
    if (!this.isClose) {
      this.addCommonData('TYPES', 'COUNT', {
        text: '点击统计',
        value: 'UI.COUNT',
      });
      this.addCommonData('TYPES', 'STORY', {
        text: '用户故事',
        value: 'UI.STORY',
      });
      this.mt.startRecord = this.startRecord;
      this.mt.endRecord = this.endRecord;
      this.mt.count = this.count;
    }
  }
  startRecord(name, _data = {}, time = null) {
    const params = {
      type: this.TYPES.STORY,
      level: this.LEVELS.INFO,
      data: {
        name,
        storyEnd: 0,
        isStory: 1,
        ..._data,
      },
    };
    if (time) {
      params.time = time;
    }
    this.send(params);
  }
  endRecord(name) {
    this.send({
      type: this.TYPES.STORY,
      level: this.LEVELS.INFO,
      data: {
        name: name,
        storyEnd: 1,
        isStory: 1,
      },
    });
  }
  count(name, _data = {}) {
    this.send({
      type: this.TYPES.COUNT,
      level: this.LEVELS.INFO,
      data: {
        name,
        isStory: 0,
        ..._data,
      },
    });
  }
  destroy() {
    // 清空函数，不上传埋点，不直接清空是防止客户端报错
    this.mt.startRecord = () => {};
    this.mt.endRecord = () => {};
    this.mt.count = () => {};
  }
}
