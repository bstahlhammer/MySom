import { useState } from 'react'

export function useScan() {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)

  async function scanImage(file, onWine) {
    setScanning(true)
    setError(null)

    try {
      const base64 = await resizeAndEncode(file)

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: 'image/jpeg' }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Server error ${res.status}`)
      }

      // Stream NDJSON lines — each line is one wine object
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      const wines = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete last line
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          try {
            const wine = JSON.parse(trimmed)
            wines.push(wine)
            onWine?.(wine) // notify caller of each wine as it arrives
          } catch {
            // ignore malformed lines
          }
        }
      }

      return wines
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setScanning(false)
    }
  }

  return { scanImage, scanning, error }
}

// Resize to max 1200px wide, encode as JPEG at 85% quality
function resizeAndEncode(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 800
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX }
        else { width = Math.round(width * MAX / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      resolve(dataUrl.split(',')[1])
    }
    img.onerror = reject
    img.src = url
  })
}
