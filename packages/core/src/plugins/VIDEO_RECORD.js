import { Plugin } from '../index.js';
const rrweb = require('rrweb');

export default class VIDEO_RECORD extends Plugin {
  init(options) {
    this.options = options;
    console.log('init dataRecord');
    this.reWriteCustomMethods();
    this.eventsMatrix = [[]];
    this.startVideoRecord();
  }
  reWriteCustomMethods() {
    const oldMethod = this.mt.plugins.ajax.customMethod;
    this.mt.plugins.ajax.customMethod = (...args) => {
      // 重写逻辑
      const [data, [ajax]] = args;
      let responseText = JSON.parse(ajax.responseText);
      if (responseText.code === -1 || ajax.status != 200) {
        const recordId = this.createRecordId();
        data.recordId = recordId;
        setTimeout(() => {
          this.waitPostRecord(recordId);
        }, 500);
      }
      oldMethod.apply(this, args);
      return data;
    };
  }
  startVideoRecord() {
    const _this = this;
    rrweb.record({
      emit(event, isCheckout) {
        // isCheckout 是一个标识，告诉你重新制作了快照
        if (isCheckout) {
          _this.eventsMatrix.push([]);
          if (_this.eventsMatrix.length >= 3) {
            _this.eventsMatrix.splice(0, 1);
          }
        }
        const lastEvents = _this.eventsMatrix[_this.eventsMatrix.length - 1];
        lastEvents.push(event);
      },
      checkoutEveryNth: this.options.checkoutEveryNth,
    });
  }
  waitPostRecord(recordId) {
    const recordData = this.endVideoRecord();
    if (!recordData) {
      return;
    }
    const data = [
      {
        type: this.TYPES.VideoRecord,
        level: this.LEVELS.INFO,
        recordId: recordId,
        recordData: recordData,
      },
    ];
    this.mt.plugins.http.request(data, (isDone) => {
      console.log(isDone);
    });
  }
  endVideoRecord() {
    // 选择最后一个上报
    let events = [...this.eventsMatrix[this.eventsMatrix.length - 1]];
    // 如果最后一个采集太少，使用全部记录
    if (events.length < 50 && this.eventsMatrix.length === 2) {
      events = [].concat(...this.eventsMatrix);
    }
    if (events.length < 50) {
      return false;
    }
    return JSON.stringify({ events });
  }
  createRecordId() {
    return new Date().getTime().toString() + '-' + this.options.customRecordId;
  }
}
