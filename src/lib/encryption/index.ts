import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // GCM recommended IV length
const AUTH_TAG_LENGTH = 16

/**
 * Get the encryption key from environment variables.
 * The key must be 32 bytes (256 bits) for AES-256.
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }

  // If the key is hex-encoded (64 characters), decode it
  if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
    return Buffer.from(key, 'hex')
  }

  // If the key is base64-encoded, decode it
  if (key.length === 44 && /^[A-Za-z0-9+/=]+$/.test(key)) {
    const decoded = Buffer.from(key, 'base64')
    if (decoded.length === 32) {
      return decoded
    }
  }

  // Otherwise, use the key directly (must be exactly 32 bytes)
  const keyBuffer = Buffer.from(key, 'utf8')
  if (keyBuffer.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must be exactly 32 bytes (256 bits). Got ${keyBuffer.length} bytes. ` +
        'Use a 64-character hex string or 44-character base64 string.'
    )
  }

  return keyBuffer
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a string in the format: iv:authTag:encrypted (all hex-encoded)
 *
 * @param plaintext - The string to encrypt
 * @returns The encrypted string in format iv:authTag:encrypted
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    return ''
  }

  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)

  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  // Format: iv:authTag:encrypted (all hex-encoded)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt a ciphertext string that was encrypted with AES-256-GCM.
 * Expects a string in the format: iv:authTag:encrypted (all hex-encoded)
 *
 * @param ciphertext - The encrypted string in format iv:authTag:encrypted
 * @returns The decrypted plaintext string
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) {
    return ''
  }

  const parts = ciphertext.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format. Expected iv:authTag:encrypted')
  }

  const [ivHex, authTagHex, encryptedHex] = parts
  const key = getEncryptionKey()
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length. Expected ${IV_LENGTH}, got ${iv.length}`)
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error(`Invalid auth tag length. Expected ${AUTH_TAG_LENGTH}, got ${authTag.length}`)
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString('utf8')
}

/**
 * Check if a value is encrypted (has the expected format).
 *
 * @param value - The value to check
 * @returns true if the value appears to be encrypted
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false
  const parts = value.split(':')
  if (parts.length !== 3) return false

  const [ivHex, authTagHex] = parts
  // Check if IV and auth tag are valid hex strings of expected lengths
  return (
    ivHex.length === IV_LENGTH * 2 &&
    /^[0-9a-fA-F]+$/.test(ivHex) &&
    authTagHex.length === AUTH_TAG_LENGTH * 2 &&
    /^[0-9a-fA-F]+$/.test(authTagHex)
  )
}
