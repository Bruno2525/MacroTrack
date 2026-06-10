import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import * as LZString from 'lz-string'
import { getAllDays, getGoals, getFavorites, getPlates, getProfile, dateToStr } from '../storage'

// QR byte-mode hard limit at error correction level L (maximum capacity): 2953 bytes.
// Using 2800 as a safe margin.
const MAX_QR_CHARS = 2800

function compactDays(days) {
  const result = {}
  for (const [date, items] of Object.entries(days)) {
    result[date] = items.map(item => ({
      n: item.name,
      p: Math.round(item.prot * 10) / 10,
      c: Math.round(item.carb * 10) / 10,
      f: Math.round(item.fat * 10) / 10,
      k: Math.round(item.cal),
      m: item.meal,
    }))
  }
  return result
}

export default function QRCodeModal({ onClose }) {
  const [exportType, setExportType] = useState('today')
  const [selectedDate, setSelectedDate] = useState(dateToStr(new Date()))
  const [qrData, setQrData] = useState(null)
  const [sizeError, setSizeError] = useState('')

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

  function handleGenerate() {
    setSizeError('')
    try {
      const payload = buildPayload()
      const json = JSON.stringify(payload)

      // Try LZString compression (handles both namespace and default export)
      const compress =
        LZString.compressToEncodedURIComponent ??
        LZString.default?.compressToEncodedURIComponent
      const compressed = typeof compress === 'function' ? compress(json) : null

      if (compressed && compressed.length <= MAX_QR_CHARS) {
        setQrData(compressed)
        return
      }

      // Fallback: raw compact JSON (smaller payload, no compression overhead)
      if (json.length <= MAX_QR_CHARS) {
        setQrData(json)
        return
      }

      const size = compressed?.length ?? json.length
      setSizeError(
        `Dados muito grandes para QR Code (${size} chars após compressão). Use "Exportar backup" para dados completos.`
      )
    } catch (err) {
      setSizeError('Erro ao gerar QR Code. Tente "Exportar backup" como alternativa.')
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
            <div className="qr-container">
              <QRCodeSVG
                id="qr-export-svg"
                value={qrData}
                size={280}
                margin={2}
                bgColor="#ffffff"
                fgColor="#000000"
                level="L"
              />
            </div>
            <div className="modal-actions">
              <button className="modal-action-btn secondary" onClick={() => setQrData(null)}>
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
                  onClick={() => { setExportType(key); setSizeError('') }}
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

            {sizeError && <p className="modal-error">{sizeError}</p>}

            <button className="modal-generate-btn" onClick={handleGenerate}>
              Gerar QR Code
            </button>
          </>
        )}
      </div>
    </div>
  )
}
