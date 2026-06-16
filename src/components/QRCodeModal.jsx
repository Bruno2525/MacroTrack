import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import * as LZString from 'lz-string'
import { getAllDays, getGoals, getFavorites, getPlates, getProfile, dateToStr } from '../storage'

const MAX_QR_CHARS = 4000

const MEAL_ABBR = {
  'Café da manhã': 'C', 'Almoço': 'A', 'Lanche': 'L', 'Jantar': 'J', 'Suplemento': 'S',
}

function compactDays(days) {
  const result = {}
  for (const [date, items] of Object.entries(days)) {
    result[date] = items.map(item => ({
      n: item.name.slice(0, 30),
      p: Math.round(item.prot),
      c: Math.round(item.carb),
      f: Math.round(item.fat),
      k: Math.round(item.cal),
      m: MEAL_ABBR[item.meal] ?? item.meal.slice(0, 1),
    }))
  }
  return result
}

export default function QRCodeModal({ onClose }) {
  const [exportType, setExportType] = useState('today')
  const [selectedDate, setSelectedDate] = useState(dateToStr(new Date()))
  const [qrData, setQrData] = useState(null)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [debugLog, setDebugLog] = useState([])

  function buildPayload() {
    const allDays = getAllDays()
    let days = {}
    let type, date

    if (exportType === 'today') {
      const today = dateToStr(new Date())
      days = { [today]: allDays[today] || [] }
      type = 'day'
      date = today
    } else if (exportType === 'day') {
      days = { [selectedDate]: allDays[selectedDate] || [] }
      type = 'day'
      date = selectedDate
    } else {
      days = allDays
      type = 'all'
      date = dateToStr(new Date())
    }

    return {
      version: 1,
      compact: true,
      type,
      date,
      data: {
        days: compactDays(days),
        goals: getGoals(),
        favorites: getFavorites(),
        plates: getPlates(),
        profile: getProfile(),
      },
    }
  }

  async function handleGenerate() {
    setError('')
    setWarning('')
    setDebugLog([])
    const log = (msg) => setDebugLog(prev => [...prev, msg])

    try {
      log('1. Resolvendo LZString...')
      const compress =
        LZString.compressToEncodedURIComponent ??
        LZString.default?.compressToEncodedURIComponent
      const doCompress = typeof compress === 'function' ? compress : null
      log(`2. LZString: ${doCompress ? 'OK (função encontrada)' : 'FALHOU (undefined)'}`)

      log('3. Montando payload...')
      const payload = buildPayload()
      const json = JSON.stringify(payload)
      log(`4. JSON montado: ${json.length} chars`)

      log('5. Comprimindo...')
      const compressed = doCompress ? doCompress(json) : null
      log(`6. Comprimido: ${compressed != null ? compressed.length + ' chars' : 'NULL/UNDEFINED'}`)

      if (compressed != null && compressed.length <= MAX_QR_CHARS) {
        log('7. OK — setQrData(compressed)')
        setQrData(compressed)
        return
      }

      if (compressed == null) {
        log('7b. Sem compressão — tentando JSON cru...')
        if (json.length <= MAX_QR_CHARS) {
          log(`7c. JSON cru OK (${json.length} chars) — setQrData(json)`)
          setQrData(json)
          return
        }
        log(`7d. JSON cru grande demais: ${json.length} > ${MAX_QR_CHARS}`)
      } else {
        log(`7b. Comprimido grande demais: ${compressed.length} > ${MAX_QR_CHARS}`)
      }

      log('8. Tentando fallback de sumário...')
      if (exportType === 'all') throw new Error('Export "all" muito grande para QR Code')
      const allDays = getAllDays()
      const dateStr = exportType === 'today' ? dateToStr(new Date()) : selectedDate
      const dayItems = allDays[dateStr] || []
      const totals = dayItems.reduce(
        (acc, f) => ({
          cal: acc.cal + (f.cal || 0),
          prot: acc.prot + (f.prot || 0),
          carb: acc.carb + (f.carb || 0),
          fat: acc.fat + (f.fat || 0),
        }),
        { cal: 0, prot: 0, carb: 0, fat: 0 }
      )
      const summaryJson = JSON.stringify({
        version: 1, type: 'summary', date: dateStr,
        data: { cal: Math.round(totals.cal), prot: Math.round(totals.prot), carb: Math.round(totals.carb), fat: Math.round(totals.fat) },
      })
      const compressedSummary = doCompress ? doCompress(summaryJson) : summaryJson
      log(`9. Sumário: ${compressedSummary.length} chars`)
      if (compressedSummary.length <= MAX_QR_CHARS) {
        log('10. Sumário OK — setQrData(compressedSummary)')
        setQrData(compressedSummary)
        setWarning('QR Code gerado com totais do dia (sem detalhes das refeições)')
        return
      }
      throw new Error(`Sumário ainda muito grande (${compressedSummary.length} chars)`)
    } catch (err) {
      const msg = `EXCEÇÃO: ${err.name}: ${err.message}`
      setDebugLog(prev => [...prev, msg])
      setError(`Erro ao gerar: ${err.message || String(err)}`)
      console.error('QRCodeModal.handleGenerate:', err)
    }
  }

  function handleSaveImage() {
    const svgEl = document.getElementById('qr-export-svg')
    if (!svgEl) return
    try {
      const svgData = new XMLSerializer().serializeToString(svgEl)
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 320
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.onload = () => {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 320, 320)
        ctx.drawImage(img, 0, 0, 320, 320)
        const link = document.createElement('a')
        link.download = `macrotrack-qr-${dateToStr(new Date())}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
        URL.revokeObjectURL(url)
      }
      img.onerror = () => {
        // Fallback: save as SVG if PNG conversion fails (rare on some mobile browsers)
        const link = document.createElement('a')
        link.download = `macrotrack-qr-${dateToStr(new Date())}.svg`
        link.href = url
        link.click()
      }
      img.src = url
    } catch (err) {
      console.error('QRCodeModal.handleSaveImage:', err)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Gerar QR Code</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {qrData ? (
          <>
            {warning && <p className="modal-warning">{warning}</p>}
            <div className="qr-container">
              <QRCodeSVG
                id="qr-export-svg"
                value={qrData}
                size={300}
                level="L"
                margin={4}
                bgColor="#ffffff"
                fgColor="#000000"
                style={{ display: 'block', margin: '0 auto' }}
              />
            </div>
            <div className="modal-actions">
              <button className="modal-action-btn secondary" onClick={() => { setQrData(null); setWarning(''); setDebugLog([]) }}>
                Voltar
              </button>
              <button className="modal-action-btn primary" onClick={handleSaveImage}>
                Salvar imagem
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-options">
              {[
                { key: 'today', label: 'Hoje' },
                { key: 'day', label: 'Dia específico' },
                { key: 'all', label: 'Todos os dados' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`option-btn ${exportType === key ? 'active' : ''}`}
                  onClick={() => { setExportType(key); setError(''); setWarning('') }}
                >
                  {label}
                </button>
              ))}
            </div>

            {exportType === 'day' && (
              <input
                type="date"
                className="date-picker"
                value={selectedDate}
                max={dateToStr(new Date())}
                onChange={e => setSelectedDate(e.target.value)}
              />
            )}

            <button className="modal-generate-btn" onClick={handleGenerate}>
              Gerar QR Code
            </button>

            {error && (
              <div className="error-modal">
                <p className="error-message">{error}</p>
                {debugLog.length > 0 && (
                  <div style={{ marginTop: 8, padding: '8px 10px', background: '#111', borderRadius: 6, fontSize: 11, color: '#0f0', fontFamily: 'monospace', textAlign: 'left', maxHeight: 200, overflowY: 'auto' }}>
                    {debugLog.map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                )}
                <button className="modal-action-btn secondary" style={{ marginTop: 8 }} onClick={() => setError('')}>
                  Fechar
                </button>
              </div>
            )}

            {/* DEBUG — remove after confirming QRCodeSVG renders on mobile */}
            <button
              className="backup-btn"
              style={{ marginTop: 4 }}
              onClick={() => setQrData('MACROTRACK:TESTE')}
            >
              Gerar QR teste
            </button>
          </>
        )}
      </div>
    </div>
  )
}
