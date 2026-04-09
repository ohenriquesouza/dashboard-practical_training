import { useState, useRef, useEffect } from 'react'

const PROPRIETARIOS = [
  { id: 5,  nome: 'Geraldo Condão' },
  { id: 6,  nome: 'Helio Yamamoto' },
  { id: 35, nome: 'Everton Bolico' },
]

export default function Filters({
  ano, setAno,
  idProprietario, setIdProprietario,
  onApply, loading,
  hideProprietario = false,
}) {
  const [useAno, setUseAno]   = useState(false)
  const [useProp, setUseProp] = useState(false)
  const [search, setSearch]   = useState('')
  const [showSug, setShowSug] = useState(false)
  const wrapperRef = useRef(null)

  const currentYear = new Date().getFullYear()
  const baseYears = Array.from({ length: 5 }, (_, i) => String(currentYear - i))
  const yearOptions = ano && !baseYears.includes(String(ano)) ? [String(ano), ...baseYears] : baseYears

  const suggestions = search.length > 0
    ? PROPRIETARIOS.filter(p => p.nome.toLowerCase().startsWith(search.toLowerCase()))
    : PROPRIETARIOS

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowSug(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectProprietario = (p) => {
    setSearch(p.nome)
    setIdProprietario(p.id)
    setShowSug(false)
  }

  const handlePropCheck = (checked) => {
    setUseProp(checked)
    if (!checked) { setSearch(''); setIdProprietario('') }
  }

  const handleApply = () => {
    onApply({
      ano: useAno && ano ? ano : null,
      idProprietario: (!hideProprietario && useProp && idProprietario) ? idProprietario : null,
    })
  }

  const handleClear = () => {
    setAno(''); setIdProprietario(''); setSearch('')
    setUseAno(false); setUseProp(false)
    onApply({ ano: null, idProprietario: null })
  }

  const handlePrevYear = () => {
    if (!useAno) return
    if (!ano) { setAno(String(currentYear)); return }
    setAno(String(Math.max(2000, Number(ano) - 1)))
  }

  const handleNextYear = () => {
    if (!useAno || !ano) return
    setAno(String(Math.min(currentYear, Number(ano) + 1)))
  }

  return (
    <div style={styles.bar}>

      {/* Filtro Ano */}
      <div style={styles.group}>
        <label style={styles.checkLabel}>
          <input type="checkbox" checked={useAno} onChange={e => setUseAno(e.target.checked)} />
          Ano
        </label>
        <div style={styles.yearWrapper}>
          <button type="button" onClick={handlePrevYear} disabled={!useAno}
            style={{ ...styles.yearBtn, ...(!useAno ? styles.disabledBtn : {}) }}>◀</button>
          <select value={ano} onChange={e => setAno(e.target.value)} disabled={!useAno}
            style={{ ...styles.input, ...(!useAno ? styles.disabled : {}) }}>
            <option value="">Selecione</option>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button type="button" onClick={handleNextYear}
            disabled={!useAno || !ano || Number(ano) >= currentYear}
            style={{ ...styles.yearBtn, ...(!useAno || !ano || Number(ano) >= currentYear ? styles.disabledBtn : {}) }}>▶</button>
        </div>
      </div>

      {/* Filtro Proprietário — oculto na página de proprietário */}
      {!hideProprietario && (
        <div style={styles.group}>
          <label style={styles.checkLabel}>
            <input type="checkbox" checked={useProp} onChange={e => handlePropCheck(e.target.checked)} />
            Proprietário
          </label>
          <div ref={wrapperRef} style={styles.autocompleteWrapper}>
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setIdProprietario('') }}
              onFocus={() => useProp && setShowSug(true)}
              placeholder="Digite o nome..."
              disabled={!useProp}
              autoComplete="off"
              style={{ ...styles.input, ...(!useProp ? styles.disabled : {}), width: '180px' }}
            />
            {showSug && useProp && suggestions.length > 0 && (
              <div style={styles.dropdown}>
                {suggestions.map(p => (
                  <div key={p.id} style={styles.suggestion} onClick={() => selectProprietario(p)}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <span style={styles.sugNome}>{p.nome}</span>
                    <span style={styles.sugId}>ID {p.id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <button onClick={handleApply} disabled={loading} style={styles.btn}>
        {loading ? 'Carregando...' : 'Aplicar'}
      </button>
      <button onClick={handleClear} style={styles.btnClear}>Limpar</button>

    </div>
  )
}

const styles = {
  bar: {
    display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap',
    background: '#fff', borderRadius: '14px', padding: '16px 20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
  },
  group: { display: 'flex', flexDirection: 'column', gap: '5px' },
  checkLabel: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#555', cursor: 'pointer' },
  yearWrapper: { display: 'flex', alignItems: 'center', gap: '6px' },
  autocompleteWrapper: { position: 'relative' },
  input: { padding: '7px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', width: '130px', outline: 'none' },
  disabled: { background: '#f0f0f0', color: '#aaa', cursor: 'not-allowed', border: '1px solid #e0e0e0' },
  yearBtn: { padding: '7px 10px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '700' },
  disabledBtn: { background: '#f0f0f0', color: '#aaa', cursor: 'not-allowed', border: '1px solid #e0e0e0' },
  dropdown: {
    position: 'absolute', top: '100%', left: 0, zIndex: 100,
    background: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: '200px', marginTop: '4px', overflow: 'hidden',
  },
  suggestion: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', cursor: 'pointer', background: '#fff', transition: 'background 0.15s' },
  sugNome: { fontSize: '13px', color: '#222', fontWeight: '500' },
  sugId: { fontSize: '11px', color: '#aaa', fontFamily: 'monospace' },
  btn: { padding: '8px 22px', borderRadius: '10px', border: 'none', background: '#1a1a2e', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
  btnClear: { padding: '8px 16px', borderRadius: '10px', border: '1px solid #ddd', background: '#fff', color: '#888', fontWeight: '600', fontSize: '13px', cursor: 'pointer' },
}