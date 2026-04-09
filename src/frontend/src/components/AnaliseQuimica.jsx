import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

export default function AnaliseQuimica({ idPropriedade }) {
  const [expandido, setExpandido] = useState(false)
  const [dadosTimeline, setDadosTimeline] = useState([])
  const [parametroSelecionado, setParametroSelecionado] = useState('pH_Grupo')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    setDadosTimeline([])
    setErro(null)
    setCarregando(false)
  }, [idPropriedade])

  useEffect(() => {
    if (!expandido || !idPropriedade) return
    if (dadosTimeline.length > 0) return

    buscarDados()
  }, [expandido, idPropriedade])

  const buscarDados = async () => {
    try {
      setCarregando(true)
      setErro(null)

      const res = await api.get(`/propriedade/${idPropriedade}/quimica-timeline`)

      const dados = Array.isArray(res.data?.dados) ? res.data.dados : []

      setDadosTimeline(dados)
    } catch (err) {
      console.error('Erro completo:', err)
      console.error('status:', err.response?.status)
      console.error('data:', err.response?.data)
      console.error('message:', err.message)

      const detalhe =
        err.response?.data?.detail ||
        err.response?.data ||
        err.message ||
        'Erro ao buscar análise química'

      setErro(String(detalhe))
      setDadosTimeline([])
    } finally {
      setCarregando(false)
    }
  }

  const configuracaoParametros = {
    pH_Grupo: {
      label: 'A) pH (3 métodos)',
      dataKeys: ['pH_H2O', 'pH_kcl', 'pH_CaCl2'],
      cores: ['#1a1a2e', '#424242', '#666666'],
    },
    Macros: {
      label: 'B) Macronutrientes',
      dataKeys: ['P', 'K', 'Ca', 'Mg', 'Na'],
      cores: ['#2e7d32', '#ef6c00', '#d84315', '#f57f17', '#0277bd'],
    },
    MO_CTC: {
      label: 'C) Matéria Orgânica & CTC',
      dataKeys: ['M_O', 'CTC'],
      cores: ['#558b2f', '#0288d1'],
    },
    Micronutrientes: {
      label: 'D) Micronutrientes',
      dataKeys: ['S', 'Al', 'H_Al'],
      cores: ['#fbc02d', '#e53935', '#c62828'],
    },
    Bases: {
      label: 'E) Soma de Bases & Saturação',
      dataKeys: ['Soma_Bases', 'Sat_Bases'],
      cores: ['#6a1b9a', '#7b1fa2', '#512da8'],
    },
  }

  const configAtual = configuracaoParametros[parametroSelecionado]

  const dadosFiltrados = useMemo(() => {
    if (!dadosTimeline?.length) return []

    const grupos = {}

    for (const item of dadosTimeline) {
      const chave = `${item.ano}-${item.mes || '01'}`

      if (!grupos[chave]) {
        grupos[chave] = {
          ano: Number(item.ano) || 0,
          mes: Number(item.mes) || 0,
          periodo: `${String(item.mes || 1).padStart(2, '0')}/${item.ano}`,
          pH_H2O: item.pH_H2O ?? null,
          pH_kcl: item.pH_kcl ?? null,
          pH_CaCl2: item.pH_CaCl2 ?? null,
          P: item.P ?? null,
          K: item.K ?? null,
          M_O: item.M_O ?? null,
          Ca: item.Ca ?? null,
          Mg: item.Mg ?? null,
          Na: item.Na ?? null,
          Al: item.Al ?? null,
          H_Al: item.H_Al ?? null,
          S: item.S ?? null,
          CTC: item.CTC ?? null,
          Soma_Bases: item.Soma_Bases ?? null,
          Sat_Bases: item.Sat_Bases ?? null,
          
        }
      }
    }

    return Object.values(grupos).sort((a, b) => {
      if (a.ano !== b.ano) return a.ano - b.ano
      return a.mes - b.mes
    })
  }, [dadosTimeline])

  return (
    <div style={styles.widget}>
      <button
        style={styles.botaoExpandir}
        onClick={() => setExpandido(prev => !prev)}
      >
        {expandido ? '▼' : '▶'} Evolução de Análises Químicas
      </button>

      {expandido && (
        <div style={styles.widgetContent}>
          {carregando ? (
            <div style={styles.carregando}>Carregando dados...</div>
          ) : erro ? (
            <div style={styles.erro}>❌ {erro}</div>
          ) : dadosFiltrados.length === 0 ? (
            <div style={styles.semDados}>
              Nenhum dado de análise química disponível.
            </div>
          ) : (
            <>
              <div style={styles.botoes}>
                {Object.entries(configuracaoParametros).map(([chave, config]) => (
                  <button
                    key={chave}
                    style={{
                      ...styles.botaoParametro,
                      ...(parametroSelecionado === chave ? styles.botaoAtivo : {}),
                    }}
                    onClick={() => setParametroSelecionado(chave)}
                  >
                    {config.label}
                  </button>
                ))}
              </div>

              <div style={styles.grafico}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dadosFiltrados}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="periodo" />
                    <YAxis />
                    <Tooltip formatter={(value) => value ?? '—'} />
                    <Legend />
                    {configAtual.dataKeys.map((dataKey, idx) => (
                      <Line
                        key={dataKey}
                        type="monotone"
                        dataKey={dataKey}
                        stroke={configAtual.cores[idx]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        connectNulls
                        name={dataKey === 'M_O' ? 'M.O' : dataKey}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={styles.resumo}>
                <span>📊 {dadosFiltrados.length} análises</span>
                <span>
                  📅 {dadosFiltrados[0]?.periodo} - {dadosFiltrados[dadosFiltrados.length - 1]?.periodo}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  widget: {
    background: '#fff',
    border: '1px solid #e0e0e0',
    borderRadius: '14px',
    overflow: 'hidden',
    marginTop: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  botaoExpandir: {
    width: '100%',
    padding: '14px 16px',
    background: '#1a1a2e',
    color: '#fff',
    border: 'none',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.2s',
  },
  widgetContent: {
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  botoes: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  botaoParametro: {
    padding: '7px 11px',
    background: '#f0f0f0',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  botaoAtivo: {
    background: '#1a1a2e',
    color: '#fff',
    borderColor: '#1a1a2e',
  },
  grafico: {
    background: '#fafafa',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '10px',
  },
  resumo: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#999',
    flexWrap: 'wrap',
  },
  carregando: {
    textAlign: 'center',
    padding: '20px',
    color: '#666',
  },
  erro: {
    padding: '12px',
    background: '#ffebee',
    color: '#c62828',
    borderRadius: '6px',
    fontSize: '12px',
  },
  semDados: {
    padding: '20px',
    textAlign: 'center',
    color: '#999',
    fontSize: '12px',
  },
}