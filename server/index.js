import http from 'node:http'
import Anthropic from '@anthropic-ai/sdk'

const PORT = process.env.PORT || 3001

const PROMPT = `You are a wine expert analyzing an image of a wine list or wine shelf.

Extract every wine name visible and return a JSON array. For each wine include:
- id: sequential integer starting at 1
- name: wine name as shown (string)
- vintage: year visible or your best estimate (string, e.g. "2022")
- region: wine region (string)
- grape: primary grape or blend description (string)
- price: price as shown including $ symbol, or null if not visible (string | null)
- priceNum: numeric price only, or null (number | null)
- rating: estimated Wine Spectator / Wine Advocate score 85-100 (integer)
- ratingLabel: one of "Popular pick" (85-87), "Widely praised" (88-89), "Excellent" (90-91), "Highly rated" (92-93), "Outstanding" (94-95), "Extraordinary" (96+)
- body: 0-100 scale, 0=very light, 100=very full (integer)
- sweetness: 0-100 scale, 0=bone dry, 100=very sweet (integer)
- tannin: 0-100 scale (integer)
- acidity: 0-100 scale (integer)
- tasting: one sentence tasting note (string)
- pairings: array of 3-4 food pairing strings
- retailers: array containing any of: "costco","trader_joes","whole_foods","grocery","restaurant","wine_shop"
- isValue: true if exceptional quality for the price (boolean)
- isCrowd: true if broadly approachable and crowd-pleasing (boolean)

Return ONLY the raw JSON array with no markdown, no code fences, no explanation.`

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

function send(res, status, body) {
  const json = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(json)
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST' })
    return res.end()
  }

  if (req.method === 'POST' && req.url === '/api/scan') {
    let body
    try {
      body = await readBody(req)
    } catch {
      return send(res, 400, { error: 'Invalid JSON body' })
    }

    const { image, mimeType = 'image/jpeg' } = body
    if (!image) return send(res, 400, { error: 'Missing image field (base64)' })

    if (!process.env.ANTHROPIC_API_KEY) {
      return send(res, 500, { error: 'ANTHROPIC_API_KEY not set' })
    }

    let raw
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: image } },
            { type: 'text', text: PROMPT },
          ],
        }],
      })
      raw = response.content[0]?.text ?? ''
    } catch (err) {
      console.error('Anthropic error:', err.message)
      return send(res, 502, { error: 'Vision analysis failed' })
    }

    let wines
    try {
      const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      wines = JSON.parse(cleaned)
      if (!Array.isArray(wines)) throw new Error('Not an array')
    } catch {
      console.error('Parse error. Raw:', raw.slice(0, 200))
      return send(res, 500, { error: 'Failed to parse wine data' })
    }

    return send(res, 200, { wines })
  }

  send(res, 404, { error: 'Not found' })
})

server.listen(PORT, () => {
  console.log(`Uncork API server running on http://localhost:${PORT}`)
})
