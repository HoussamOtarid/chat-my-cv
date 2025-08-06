import { config } from '@/config'

const algorithm = 'AES-GCM'
const keyLength = 256
const ivLength = 12
const saltLength = 16
const tagLength = 16
const iterations = 100000

async function getKey(salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(config.encryption.key),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as ArrayBuffer,
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: algorithm, length: keyLength },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encrypt(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  
  const salt = crypto.getRandomValues(new Uint8Array(saltLength))
  const iv = crypto.getRandomValues(new Uint8Array(ivLength))
  const key = await getKey(salt)
  
  const encrypted = await crypto.subtle.encrypt(
    { name: algorithm, iv },
    key,
    data
  )
  
  const encryptedArray = new Uint8Array(encrypted)
  const tag = encryptedArray.slice(-tagLength)
  const ciphertext = encryptedArray.slice(0, -tagLength)
  
  const combined = new Uint8Array(salt.length + iv.length + tag.length + ciphertext.length)
  combined.set(salt, 0)
  combined.set(iv, saltLength)
  combined.set(tag, saltLength + ivLength)
  combined.set(ciphertext, saltLength + ivLength + tagLength)
  
  return Buffer.from(combined).toString('base64')
}

export async function decrypt(encryptedText: string): Promise<string> {
  const combined = Buffer.from(encryptedText, 'base64')
  const combinedArray = new Uint8Array(combined)
  
  const salt = combinedArray.slice(0, saltLength)
  const iv = combinedArray.slice(saltLength, saltLength + ivLength)
  const tag = combinedArray.slice(saltLength + ivLength, saltLength + ivLength + tagLength)
  const ciphertext = combinedArray.slice(saltLength + ivLength + tagLength)
  
  const key = await getKey(salt)
  
  const encryptedData = new Uint8Array(ciphertext.length + tagLength)
  encryptedData.set(ciphertext, 0)
  encryptedData.set(tag, ciphertext.length)
  
  const decrypted = await crypto.subtle.decrypt(
    { name: algorithm, iv },
    key,
    encryptedData
  )
  
  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

export function validateEncryptionKey(): boolean {
  const key = config.encryption.key
  return typeof key === 'string' && key.length >= 32
}