import { useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { getAllDays, getGoals, getFavorites, getPlates, getProfile, dateToStr } from '../storage'

const MAX_QR_CHARS = 2800

export default function QRCodeModal({ onClose }) {
  const [exportType, setExportType] = useState('today')
  const [selectedDate, setSelectedDate] = useState(dateToStr(new Date()))
  const [qrData, setQrData] = useState(null)
  const [sizeError, setSizeError] = useState('')

  function buildJson() {
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

    return JSON.stringify({
      version: 1,
      type,
      date,
      data: {
        days,
        goals: getGoals(),
        favorites: getFavorites(),
        plates: getPlates(),
        profile: getProfile(),
      },
    })
  }

  function handleGenerate() {
    setSizeError('')
    const json = buildJson()
    if (json.length > MAX_QR_CHARS) {
      setSizeError(
        `Dados muito grandes (${json.length} caracteres). Use "Exportar backup" para dados completos.`
      )
      return
    }
    setQrData(json)
  }

  function handleSaveImage() {
    const canvas = document.getElementById('qr-export-canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `macrotrack-qr-${dateToStr(new Date())}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
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
              <QRCodeCanvas
                id="qr-export-canvas"
                value={qrData}
                size={240}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
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
