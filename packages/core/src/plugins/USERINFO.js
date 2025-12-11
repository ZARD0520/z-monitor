import { Plugin } from '../plugin.js'

export default class USERINFO extends Plugin {
  init(options) {
    this.options = options
    console.log('init userinfo')
  }
  async getUserInfo() {
    if (!this.options.getData) {
      return console.error('getData is required')
    }
    const data = this.options.getData()
    return data || null
  }
}
