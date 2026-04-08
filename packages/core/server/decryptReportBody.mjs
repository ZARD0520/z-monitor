/**
 * 服务端解密埋点上报体（Node.js）。
 * 与 packages/core/src/utils/reportCrypto.js 中 encryptReportPayload 对应。
 * 可将本文件复制到任意 Node 服务中使用。
 *
 * @example
 * // Express
 * app.post('/monitor/add', express.json({ limit: '2mb' }), (req, res) => {
 *   const body = req.body
 *   const plain = body.encrypted
 *     ? decryptReportBody(JSON.stringify(body), process.env.MONITOR_REPORT_SECRET)
 *     : JSON.stringify(body)
 *   const payload = JSON.parse(plain)
 *   // payload: { platform, projectId, sessionId, data }
 * })
 */

import crypto from 'node:crypto'

function sha256Key(secret) {
  return crypto.createHash('sha256').update(secret, 'utf8').digest()
}

function base64urlToBuffer(s) {
  return Buffer.from(s, 'base64url')
}

/**
 * 解密 encryptReportPayload 生成的 JSON 字符串，得到原始上报 JSON 字符串。
 *
 * @param {string} envelopeJson - 请求体 JSON 字符串（整段 body）
 * @param {string} secret - 与前端 reportEncryptSecret 相同的密钥
 * @returns {string} 解密后的明文 JSON 字符串，可 JSON.parse 得到 { platform, projectId, sessionId, data }
 */
export function decryptReportBody(envelopeJson, secret) {
  const obj = JSON.parse(envelopeJson)
  if (!obj || !obj.encrypted) {
    throw new Error('请求体不是加密格式（缺少 encrypted 标记）')
  }
  if (obj.v !== 1 || obj.alg !== 'AES-256-GCM') {
    throw new Error(`不支持的加密版本或算法: v=${obj.v}, alg=${obj.alg}`)
  }
  const key = sha256Key(secret)
  const iv = base64urlToBuffer(obj.iv)
  const buf = base64urlToBuffer(obj.data)
  if (buf.length < 17) {
    throw new Error('密文数据过短')
  }
  const tag = buf.subarray(buf.length - 16)
  const ciphertext = buf.subarray(0, buf.length - 16)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plain.toString('utf8')
}

/**
 * 若 body 可能为加密或明文，自动分支解密。
 *
 * @param {object} body - 已解析的 JSON 对象（express.json() 等）
 * @param {string} secret
 * @returns {{ platform?: string, projectId?: string, sessionId?: string, data?: unknown }} 解析后的业务对象
 */
export function parseMonitorAddBody(body, secret) {
  if (!body || typeof body !== 'object') {
    throw new Error('body 无效')
  }
  if (body.encrypted === true) {
    const plain = decryptReportBody(JSON.stringify(body), secret)
    return JSON.parse(plain)
  }
  return body
}
