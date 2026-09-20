import { readFileSync } from 'node:fs'
import { GoogleGenerativeAI } from '@google/generative-ai'

const archiveRaw = JSON.parse(
  readFileSync(new URL('../public/archive-db.json', import.meta.url), 'utf8'),
)
const artifacts = archiveRaw.artifacts ?? archiveRaw
const artifactContext = artifacts.map((artifact) => ({
  id: artifact.id,
  title: artifact.title,
  what: artifact.what,
  period: artifact.period,
  material: artifact.material,
  findSite: artifact.findSite,
  description: artifact.description,
  significance: artifact.significance,
}))

const systemPrompt = `You are the guide for "Carthage Underfoot", a 3D museum of Tunisian heritage artifacts.

The visitor will describe their interests. Recommend matching artifacts from the supplied database.

Respond with valid JSON only, using this shape:
{
  "message": "A short 1-2 sentence explanation of why you picked these",
  "ids": ["artifact-id-1", "artifact-id-2"]
}

Return between 1 and 8 artifact IDs, and only use IDs that exist in the database.

Artifact database:
${JSON.stringify(artifactContext)}`

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405)
    }

    let body
    try {
      body = await request.json()
    } catch {
      return json({ error: 'A JSON request body is required' }, 400)
    }

    const query = typeof body.query === 'string' ? body.query.trim() : ''
    if (!query) return json({ error: 'query is required' }, 400)
    if (query.length > 500) return json({ error: 'query must be 500 characters or fewer' }, 400)

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return json({ error: 'Recommendation service is not configured' }, 503)

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.6-flash',
        systemInstruction: systemPrompt,
      })
      const result = await model.generateContent(query)
      const cleaned = result.response.text().replace(/```json\n?/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleaned)

      return json({
        message: typeof parsed.message === 'string' ? parsed.message : '',
        ids: Array.isArray(parsed.ids)
          ? parsed.ids.filter((id) => artifacts.some((artifact) => artifact.id === id)).slice(0, 8)
          : [],
      })
    } catch (error) {
      console.error('Gemini recommendation error:', error)
      return json({ error: 'The recommendation service is temporarily unavailable' }, 502)
    }
  },
}
