import http from 'node:http'
import Anthropic from '@anthropic-ai/sdk'

const PORT = process.env.PORT || 3001

const PROMPT = `You are a wine expert analyzing an image of a wine list or wine shelf.

Extract every wine visible. Output one JSON object per line (NDJSON) as soon as you identify each wine — do not wait.

Required fields per wine:
- id: integer starting at 1
- name: string
- vintage: string (estimate if not shown)
- region: string
- grape: string
- price: string with $ or null
- priceNum: number or null
- rating: integer 85-100
- ratingLabel: "Popular pick"|"Widely praised"|"Excellent"|"Highly rated"|"Outstanding"|"Extraordinary"
- body: integer 0-100
- sweetness: integer 0-100
- tannin: integer 0-100
- acidity: integer 0-100
- tasting: one sentence string
- pairings: array of 2 strings
- isValue: boolean
- isCrowd: boolean

One wine per line, no markdown, no wrapper array:
{"id":1,"name":"..."}
{"id":2,"name":"..."}`

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(data)) } catch { reject(new Error('Invalid JSON')) }
    })
    req.on('error', reject)
  })
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST',
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS)
    return res.end()
  }

  if (req.method === 'POST' && req.url === '/api/scan') {
    let body
    try {
      body = await readBody(req)
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json', ...CORS })
      return res.end(JSON.stringify({ error: 'Invalid JSON body' }))
    }

    const { image, mimeType = 'image/jpeg' } = body
    if (!image) {
      res.writeHead(400, { 'Content-Type': 'application/json', ...CORS })
      return res.end(JSON.stringify({ error: 'Missing image field' }))
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      res.writeHead(500, { 'Content-Type': 'application/json', ...CORS })
      return res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }))
    }

    // Start streaming response
    res.writeHead(200, { 'Content-Type': 'application/x-ndjson', ...CORS })

    try {
      const stream = await client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: image } },
            { type: 'text', text: PROMPT },
          ],
        }],
      })

      let buffer = ''
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
          buffer += chunk.delta.text
          // Flush complete lines immediately
          const lines = buffer.split('\n')
          buffer = lines.pop()
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue
            try {
              JSON.parse(trimmed) // validate before sending
              res.write(trimmed + '\n')
            } catch {
              // skip malformed lines
            }
          }
        }
      }

      // Flush any remaining buffer
      if (buffer.trim()) {
        try {
          JSON.parse(buffer.trim())
          res.write(buffer.trim() + '\n')
        } catch { /* ignore */ }
      }
    } catch (err) {
      console.error('Anthropic error:', err.message)
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json', ...CORS })
        res.end(JSON.stringify({ error: 'Vision analysis failed' }))
      }
    }

    return res.end()
  }

  res.writeHead(404, { 'Content-Type': 'application/json', ...CORS })
  res.end(JSON.stringify({ error: 'Not found' }))
})

server.listen(PORT, () => {
  console.log(`Uncork API server running on http://localhost:${PORT}`)
})
