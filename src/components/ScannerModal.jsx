import { useState, useEffect, useRef } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { DecodeHintType, BarcodeFormat } from '@zxing/library'
import * as LZString from 'lz-string'
import { mergeImportedData, getConflictDays } from '../storage'

const hints = new Map()
hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE])
hints.set(DecodeHintType.TRY_HARDER, true)

function expandCompactDays(data) {
  if (!data.compact || !data.data?.days) return
  const expanded = {}
  for (const [date, items] of Object.entries(data.data.days)) {
    expanded[date] = items.map(i => ({
      name: i.n, prot: i.p, carb: i.c, fat: i.f, cal: i.k, meal: i.m,
    }))
  }
  data.data.days = expanded
}

function parseScannedText(text) {
  // Try LZString decompression first (new compressed format)
  try {
    const decompress =
      LZString.decompressFromEncodedURIComponent ??
      LZString.default?.decompressFromEncodedURIComponent
    const decompressed = typeof decompress === 'function' ? decompress(text) : null
    if (decompressed) {
      const data = JSON.parse(decompressed)
      if (data.version === 1 && data.data) {
        expandCompactDays(data)
        return data
      }
    }
  } catch {}

  // Fallback: raw JSON (old format or uncompressed)
  try {
    const data = JSON.parse(text)
    if (data.version === 1 && data.data) {
      expandCompactDays(data)
      return data
    }
  } catch {}

  return null
}

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
  const [scanDebug, setScanDebug] = useState('') // DEBUG: remove after confirming scanner works
  const [conflictCount, setConflictCount] = useState(0)
  const videoRef = useRef(null)
  const controlsRef = useRef(null)

  useEffect(() => {
    let stopped = false
    const codeReader = new BrowserMultiFormatReader(hints)

    async function start() {
      try {
        controlsRef.current = await codeReader.decodeFromVideoDevice(
          undefined, // undefined → back camera (facingMode: 'environment')
          videoRef.current,
          (result, _err, controls) => {
            if (stopped || !result) return
            const text = result.getText()
            setScanDebug(text.slice(0, 100)) // DEBUG
            try {
              const parsed = parseScannedText(text)
              if (!parsed) {
                setScanError('QR Code não é do MacroTrack. Continue escaneando...')
                return
              }
              stopped = true
              controls.stop()
              setScanResult(parsed)
              setPhase('preview')
              setScanError('')
            } catch {
              setScanError('QR Code inválido. Continue escaneando...')
            }
          }
        )
      } catch (err) {
        if (stopped) return
        const msg = String(err).toLowerCase()
        if (
          msg.includes('notallowederror') ||
          msg.includes('permission') ||
          msg.includes('denied')
        ) {
          setPhase('denied')
        } else {
          setScanError(`Câmera indisponível: ${err.message || String(err)}`)
        }
      }
    }

    start()

    return () => {
      stopped = true
      controlsRef.current?.stop()
      BrowserMultiFormatReader.releaseAllStreams()
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
              <video ref={videoRef} className="qr-video" />
            </div>
            {scanError && <p className="modal-error">{scanError}</p>}
            {/* DEBUG — remove after confirming scanner works */}
            {scanDebug && (
              <pre className="scan-debug">{scanDebug}</pre>
            )}
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
                {conflictCount} dia{conflictCount !== 1 ? 's' : ''} já{' '}
                {conflictCount !== 1 ? 'possuem' : 'possui'} dados registrados.
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
