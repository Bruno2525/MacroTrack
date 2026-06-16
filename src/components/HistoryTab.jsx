import { useState, useEffect } from 'react'
import { getAllDays, sumMacros, dateToStr } from '../storage'
import MonthlyChart from './MonthlyChart'
import QRCodeModal from './QRCodeModal'
import ScannerModal from './ScannerModal'
import BackupButtons from './BackupButtons'
import ErrorBoundary from './ErrorBoundary'

function IconQR() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="3" height="3" />
      <line x1="19" y1="14" x2="21" y2="14" />
      <line x1="19" y1="17" x2="19" y2="21" />
      <line x1="21" y1="21" x2="17" y2="21" />
    </svg>
  )
}

function IconScan() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9V5a2 2 0 0 1 2-2h4" />
      <path d="M15 3h4a2 2 0 0 1 2 2v4" />
      <path d="M21 15v4a2 2 0 0 1-2 2h-4" />
      <path d="M9 21H5a2 2 0 0 1-2-2v-4" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  )
}

function fmt(n) {
  return typeof n === 'number' ? n.toFixed(n % 1 === 0 ? 0 : 1) : n
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date()
  const todayStr = dateToStr(today)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const yesterdayStr = dateToStr(yesterday)

  if (dateStr === todayStr) return 'Hoje'
  if (dateStr === yesterdayStr) return 'Ontem'

  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function HistoryTab({ goals }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showScannerModal, setShowScannerModal] = useState(false)

  useEffect(() => {
    const handler = () => setRefreshKey(k => k + 1)
    window.addEventListener('macrotrack:updated', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('macrotrack:updated', handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  const days = getAllDays()

  const today = new Date()
  const last7 = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    last7.push(dateToStr(d))
  }

  const entries = last7
    .filter(dateStr => days[dateStr] && days[dateStr].length > 0)
    .map(dateStr => ({ dateStr, totals: sumMacros(days[dateStr]) }))

  return (
    <>
      <div className="page-header">
        <span className="page-title">Histórico</span>
      </div>

      <MonthlyChart goals={goals} refreshKey={refreshKey} />

      <div className="qr-buttons-row">
        <button className="qr-btn" onClick={() => setShowQRModal(true)}>
          <IconQR /> Gerar QR Code
        </button>
        <button className="qr-btn" onClick={() => setShowScannerModal(true)}>
          <IconScan /> Escanear QR Code
        </button>
      </div>

      <BackupButtons />

      <div className="history-section-title">Últimos 7 dias</div>

      {showQRModal && (
        <ErrorBoundary fallback={
          <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Erro</span>
                <button className="modal-close" onClick={() => setShowQRModal(false)}>✕</button>
              </div>
              <p className="modal-error" style={{ textAlign: 'left' }}>
                Erro inesperado ao renderizar o QR Code. Tente novamente.
              </p>
              <button className="modal-action-btn secondary" onClick={() => setShowQRModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        }>
          <QRCodeModal onClose={() => setShowQRModal(false)} />
        </ErrorBoundary>
      )}
      {showScannerModal && <ScannerModal onClose={() => setShowScannerModal(false)} />}

      {entries.length === 0 ? (
        <p className="empty-state">Nenhum dado nos últimos 7 dias</p>
      ) : (
        <div className="history-list">
          {entries.map(({ dateStr, totals }) => (
            <div key={dateStr} className="history-card">
              <div className="history-card-header">
                <span className="history-date">{formatDate(dateStr)}</span>
                <span className="history-cal">{totals.cal} kcal</span>
              </div>
              <div className="history-macros">
                <div className="history-macro">
                  P <span style={{ color: 'var(--color-prot)' }}>{fmt(totals.prot)}g</span>
                </div>
                <div className="history-macro">
                  C <span style={{ color: 'var(--color-carb)' }}>{fmt(totals.carb)}g</span>
                </div>
                <div className="history-macro">
                  G <span style={{ color: 'var(--color-fat)' }}>{fmt(totals.fat)}g</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
