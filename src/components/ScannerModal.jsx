import { useState, useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import LZString from 'lz-string'
import { mergeImportedData, getConflictDays } from '../storage'

const READER_ID = 'qr-scanner-reader'

function buildSummary(imported) {
  const { days = {}, favorites = [], plates = [], goals, profile } = imported.data
  const dayCount = Object.keys(days).length
  const mealCount = Object.values(days).reduce((sum, arr) => sum + arr.length, 0)
  return {
    dayCount,
    mealCount,
    favCount: favorites.length,
    plateCount: plates.length,
    hasGoals: !!goals,
    hasProfile: !!profile,
  }
}

export default function ScannerModal({ onClose }) {
  const [phase, setPhase] = useState('scanning') // 'scanning' | 'preview' | 'conflict' | 'denied'
  const [scanResult, setScanResult] = useState(null)
  const [scanError, setScanError] = useState('')
  const [conflictCount, setConflictCount] = useState(0)

  useEffect(() => {
    const stopped = { value: false }
    const scanner = new Html5Qrcode(READER_ID)

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (text) => {
          if (stopped.value) return
          try {
            // Try LZString decompression first, fall back to raw JSON for old QR codes
            let parsed
            const decompressed = LZString.decompressFromEncodedURIComponent(text)
            if (decompressed) {
              parsed = JSON.parse(decompressed)
            } else {
              parsed = JSON.parse(text)
            }
            if (parsed.version !== 1 || !parsed.data) {
              setScanError('QR Code não é do MacroTrack. Continue escaneando...')
              return
            }
            stopped.value = true
            scanner.stop().finally(() => {
              setScanResult(parsed)
              setPhase('preview')
              setScanError('')
            })
          } catch {
            setScanError('QR Code inválido. Continue escaneando...')
          }
        },
        () => {}
      )
      .catch((err) => {
        if (stopped.value) return
        const msg = String(err).toLowerCase()
        if (msg.includes('notallowederror') || msg.includes('permission')) {
          setPhase('denied')
        } else {
          setScanError('Não foi possível acessar a câmera.')
        }
      })

    return () => {
      stopped.value = true
      scanner.stop().catch(() => {})
    }
  }, [])

  function handleImportClick() {
    const conflicts = getConflictDays(scanResult)
    if (conflicts.length > 0) {
      setConflictCount(conflicts.length)
      setPhase('conflict')
    } else {
      mergeImportedData(scanResult, false)
      onClose()
    }
  }

  function handleConflictResolve(replace) {
    mergeImportedData(scanResult, replace)
    onClose()
  }

  const summary = scanResult ? buildSummary(scanResult) : null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Escanear QR Code</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {phase === 'scanning' && (
          <>
            <p className="scanner-hint">
              Aponte a câmera para um QR Code do MacroTrack. O acesso à câmera é necessário para leitura.
            </p>
            <div className="qr-reader-wrapper">
              <div id={READER_ID} />
            </div>
            {scanError && <p className="modal-error">{scanError}</p>}
          </>
        )}

        {phase === 'denied' && (
          <div className="permission-denied">
            <div className="permission-denied-icon">📷</div>
            <p>Permissão de câmera negada.</p>
            <p>
              Para usar o scanner, habilite o acesso à câmera nas configurações do navegador e tente
              novamente.
            </p>
            <button className="modal-action-btn secondary" style={{ marginTop: 12 }} onClick={onClose}>
              Fechar
            </button>
          </div>
        )}

        {phase === 'preview' && summary && (
          <>
            <div className="scan-preview">
              <div className="scan-preview-title">QR Code detectado!</div>
              {summary.dayCount > 0 && (
                <div className="scan-preview-row">
                  <span>Dias de histórico</span>
                  <strong>{summary.dayCount}</strong>
                </div>
              )}
              {summary.mealCount > 0 && (
                <div className="scan-preview-row">
                  <span>Refeições registradas</span>
                  <strong>{summary.mealCount}</strong>
                </div>
              )}
              {summary.favCount > 0 && (
                <div className="scan-preview-row">
                  <span>Favoritos</span>
                  <strong>{summary.favCount}</strong>
                </div>
              )}
              {summary.plateCount > 0 && (
                <div className="scan-preview-row">
                  <span>Pratos salvos</span>
                  <strong>{summary.plateCount}</strong>
                </div>
              )}
              {summary.hasGoals && (
                <div className="scan-preview-row">
                  <span>Metas</span>
                  <strong>incluídas</strong>
                </div>
              )}
              {summary.hasProfile && (
                <div className="scan-preview-row">
                  <span>Perfil</span>
                  <strong>incluído</strong>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="modal-action-btn secondary" onClick={onClose}>
                Cancelar
              </button>
              <button className="modal-action-btn primary" onClick={handleImportClick}>
                Importar dados
              </button>
            </div>
          </>
        )}

        {phase === 'conflict' && (
          <>
            <div className="scan-preview">
              <p className="conflict-text">
                {conflictCount} dia{conflictCount !== 1 ? 's' : ''} já {conflictCount !== 1 ? 'possuem' : 'possui'} dados registrados.
                O que deseja fazer com os conflitos?
              </p>
            </div>
            <div className="modal-actions" style={{ flexDirection: 'column' }}>
              <button className="modal-action-btn primary" onClick={() => handleConflictResolve(true)}>
                Substituir com dados importados
              </button>
              <button className="modal-action-btn secondary" onClick={() => handleConflictResolve(false)}>
                Manter dados existentes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
