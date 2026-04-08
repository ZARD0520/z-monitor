/**
 * 埋点上报体 AES-256-GCM 加密（浏览器 Web Crypto）。
 * 密钥：对 UTF-8 字符串做 SHA-256 得到 32 字节原始密钥。
 */

function utf8Bytes(str) {
  return new TextEncoder().encode(str)
}

async function sha256Key(secret) {
  const buf = await crypto.subtle.digest('SHA-256', utf8Bytes(secret))
  return new Uint8Array(buf)
}

function bytesToBase64url(bytes) {
  let bin = ''
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i])
  const b64 = btoa(bin)
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * @param {string} plainText 待加密的字符串（通常为 JSON 字符串）
 * @param {string} secret 与服务端约定的密钥（任意字符串，内部经 SHA-256 派生 AES 密钥）
 * @returns {Promise<string>} 可 POST 的 JSON 字符串，含 v / encrypted / alg / iv / data
 */
export async function encryptReportPayload(plainText, secret) {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('当前环境不支持 Web Crypto（需 HTTPS 或 localhost）')
  }
  if (!secret || typeof secret !== 'string') {
    throw new Error('reportEncryptSecret 无效')
  }
  const rawKey = await sha256Key(secret)
  const key = await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['encrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    utf8Bytes(plainText)
  )
  const data = new Uint8Array(cipherBuf)
  return JSON.stringify({
    v: 1,
    encrypted: true,
    alg: 'AES-256-GCM',
    iv: bytesToBase64url(iv),
    data: bytesToBase64url(data),
  })
}

export function isReportEncryptSupported() {
  return typeof crypto !== 'undefined' && !!crypto.subtle
}
