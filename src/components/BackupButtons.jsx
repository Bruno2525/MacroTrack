import { useState, useRef } from 'react'
import { exportAllData, mergeImportedData, getConflictDays, dateToStr } from '../storage'

export default function BackupButtons() {
  const [importState, setImportState] = useState(null) // null | { data, conflictCount }
  const [feedback, setFeedback] = useState('')
  const fileInputRef = useRef()

  function handleExport() {
    const data = exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `macrotrack-backup-${dateToStr(new Date())}.json`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!data.version || !data.data) {
          setFeedback('Arquivo inválido. Não é um backup do MacroTrack.')
          setTimeout(() => setFeedback(''), 3000)
          return
        }
        const conflicts = getConflictDays(data)
        if (conflicts.length > 0) {
          setImportState({ data, conflictCount: conflicts.length })
        } else {
          mergeImportedData(data, false)
          setFeedback('Dados importados com sucesso!')
          setTimeout(() => setFeedback(''), 3000)
        }
      } catch {
        setFeedback('Erro ao ler o arquivo. Verifique se é um JSON válido.')
        setTimeout(() => setFeedback(''), 3000)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleConflictResolve(replace) {
    mergeImportedData(importState.data, replace)
    setImportState(null)
    setFeedback('Dados importados com sucesso!')
    setTimeout(() => setFeedback(''), 3000)
  }

  return (
    <div className="backup-section">
      {feedback && <div className="backup-feedback">{feedback}</div>}

      {importState ? (
        <div className="backup-conflict">
          <p className="backup-conflict-text">
            {importState.conflictCount} dia{importState.conflictCount !== 1 ? 's' : ''} já{' '}
            {importState.conflictCount !== 1 ? 'possuem' : 'possui'} dados. O que deseja fazer?
          </p>
          <div className="backup-conflict-actions">
            <button className="backup-conflict-btn replace" onClick={() => handleConflictResolve(true)}>
              Substituir
            </button>
            <button className="backup-conflict-btn keep" onClick={() => handleConflictResolve(false)}>
              Manter existentes
            </button>
            <button className="backup-conflict-btn cancel" onClick={() => setImportState(null)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="backup-buttons">
          <button className="backup-btn" onClick={handleExport}>
            ↓ Exportar backup
          </button>
          <button className="backup-btn" onClick={() => fileInputRef.current.click()}>
            ↑ Importar backup
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  )
}
