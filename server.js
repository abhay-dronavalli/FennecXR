import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { readFileSync } from 'fs'

const app = express()
app.use(cors())
app.use(express.json())

// Load artifact database once at startup
const archiveRaw = JSON.parse(readFileSync('./public/archive-db.json', 'utf-8'))
const artifacts = archiveRaw.artifacts ?? archiveRaw
const artifactContext = artifacts.map((a) => ({
  id: a.id, title: a.title, what: a.what, period: a.period,
  material: a.material, findSite: a.findSite,
  description: a.description, significance: a.significance,
}))

const SYSTEM_PROMPT = `You are the guide for "Carthage Underfoot", a 3D museum of Tunisian heritage artifacts.

The user will describe their interests (e.g. "I love Roman mosaics", "show me Punic artifacts", "I'm interested in architecture"). Your job is to recommend artifacts from the database that match.

IMPORTANT: You MUST respond with valid JSON only. No markdown, no commentary — just a JSON object:
{
  "message": "A short 1-2 sentence explanation of why you picked these",
  "ids": ["artifact-id-1", "artifact-id-2", ...]
}

Return between 1 and 8 artifact IDs. Only use IDs that exist in the database.

Here is the full artifact database:
${JSON.stringify(artifactContext, null, 2)}`

app.post('/api/recommend', async (req, res) => {
  const { query } = req.body
  if (!query) return res.status(400).json({ error: 'query is required' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set on server' })

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      systemInstruction: SYSTEM_PROMPT,
    })
    const result = await model.generateContent(query)
    const text = result.response.text()

    // Parse Gemini's JSON response
    const cleaned = text.replace(/```json\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    res.json({
      message: parsed.message ?? '',
      ids: Array.isArray(parsed.ids) ? parsed.ids : [],
    })
  } catch (err) {
    console.error('Gemini error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Carthage guide server running on http://localhost:${PORT}`)
})
