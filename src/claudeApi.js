const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

export async function analyzeFood(input) {
  if (!API_KEY) throw new Error('VITE_ANTHROPIC_API_KEY não configurada')

  const prompt = `Analise o alimento/refeição descrito e retorne SOMENTE um JSON válido, sem texto extra, sem markdown, sem explicações. Formato exato:
{"name":"nome formatado","prot":0,"carb":0,"fat":0,"cal":0}

Alimento: "${input}"

Regras:
- name: nome curto e formatado em português
- prot, carb, fat: gramas (números decimais)
- cal: calorias totais (número inteiro)
- Use valores nutricionais reais e precisos
- Se houver quantidade (ex: 150g), calcule para essa quantidade`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Erro ${res.status}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text?.trim() || ''

  const clean = text.replace(/```json|```/g, '').trim()
const json = JSON.parse(clean)
  return {
    name: String(json.name || input),
    prot: Number(json.prot) || 0,
    carb: Number(json.carb) || 0,
    fat: Number(json.fat) || 0,
    cal: Math.round(Number(json.cal) || 0),
  }
}
