const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST',
}

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

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function onRequestPost({ request, env }) {
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: CORS })
  }

  const { image, mimeType = 'image/jpeg' } = body
  if (!image) {
    return Response.json({ error: 'Missing image field' }, { status: 400, headers: CORS })
  }

  const apiKey = env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500, headers: CORS })
  }

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      stream: true,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: image } },
          { type: 'text', text: PROMPT },
        ],
      }],
    }),
  })

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text().catch(() => 'unknown error')
    console.error('Anthropic error:', anthropicRes.status, err)
    return Response.json({ error: 'Vision analysis failed' }, { status: 502, headers: CORS })
  }

  // Transform Anthropic SSE stream → NDJSON stream
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  const pump = async () => {
    const reader = anthropicRes.body.getReader()
    const decoder = new TextDecoder()
    let lineBuffer = ''
    let sseBuffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        sseBuffer += decoder.decode(value, { stream: true })

        const parts = sseBuffer.split('\n')
        sseBuffer = parts.pop()

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue
          const data = part.slice(6).trim()
          if (!data || data === '[DONE]') continue

          let event
          try { event = JSON.parse(data) } catch { continue }

          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            lineBuffer += event.delta.text
            const lines = lineBuffer.split('\n')
            lineBuffer = lines.pop()
            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed) continue
              try {
                JSON.parse(trimmed)
                await writer.write(encoder.encode(trimmed + '\n'))
              } catch { /* skip malformed */ }
            }
          }
        }
      }

      if (lineBuffer.trim()) {
        try {
          JSON.parse(lineBuffer.trim())
          await writer.write(encoder.encode(lineBuffer.trim() + '\n'))
        } catch { /* ignore */ }
      }
    } finally {
      writer.close()
    }
  }

  pump()

  return new Response(readable, {
    status: 200,
    headers: { 'Content-Type': 'application/x-ndjson', ...CORS },
  })
}
