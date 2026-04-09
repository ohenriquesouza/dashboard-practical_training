import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const EMPRESA   = 'Agrosyntech Soluções em Tecnologia e Agro LTDA'
const MARGIN    = 14
const COR_DARK  = [26, 26, 46]
const COR_CINZA = [100, 100, 100]

function formatarData(d) {
  if (!d || d === 'NaT') return '—'
  const p = String(d).split('T')[0].split('-')
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d
}

async function capturar(el) {
  return html2canvas(el, {
    scale: 1.8,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
  })
}

async function adicionarSecao(pdf, el, titulo) {
  const w        = pdf.internal.pageSize.getWidth()
  const h        = pdf.internal.pageSize.getHeight()
  const cW       = w - MARGIN * 2
  const startY   = 18

  pdf.addPage()

  // Faixa de cabeçalho da seção
  pdf.setFillColor(...COR_DARK)
  pdf.rect(0, 0, w, 13, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text(titulo, MARGIN, 9)
  pdf.setTextColor(0, 0, 0)

  const canvas = await capturar(el)
  const ratio  = canvas.height / canvas.width
  const imgW   = cW
  const imgH   = imgW * ratio

  if (imgH <= h - startY - MARGIN) {
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', MARGIN, startY, imgW, imgH)
    return
  }

  // Imagem maior que uma página — fatia em múltiplas
  const scaleF    = canvas.width / imgW
  const pageSlice = (h - startY - MARGIN) * scaleF
  let srcY  = 0
  let destY = startY
  let first = true

  while (srcY < canvas.height) {
    const sliceH  = Math.min(pageSlice, canvas.height - srcY)
    const sliceMm = sliceH / scaleF

    const tmp = document.createElement('canvas')
    tmp.width  = canvas.width
    tmp.height = sliceH
    tmp.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH)

    if (!first) { pdf.addPage(); destY = MARGIN }
    pdf.addImage(tmp.toDataURL('image/png'), 'PNG', MARGIN, destY, imgW, sliceMm)

    srcY  += sliceH
    destY  = MARGIN
    first  = false
  }
}

// ── Função principal ──────────────────────────────────────────────────────────

export async function gerarRelatorio({ fazenda, nomeProprietario, ultimaAnalise }) {
  const id  = fazenda.idPropriedade
  const pdf = new jsPDF('p', 'mm', 'a4')
  const w   = pdf.internal.pageSize.getWidth()
  const h   = pdf.internal.pageSize.getHeight()
  const hoje = new Date().toLocaleDateString('pt-BR')

  // ── Capa ────────────────────────────────────────────────────────────────────

  // Faixa superior
  pdf.setFillColor(...COR_DARK)
  pdf.rect(0, 0, w, 38, 'F')

  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(15)
  pdf.text('AGROSYNTECH', MARGIN, 17)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7.5)
  pdf.text(EMPRESA, MARGIN, 25)

  // Título do documento
  pdf.setTextColor(...COR_DARK)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(22)
  pdf.text('Relatório Técnico', MARGIN, 60)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(13)
  pdf.setTextColor(...COR_CINZA)
  pdf.text('Análise de Solo e Fertilidade', MARGIN, 70)

  // Separador
  pdf.setDrawColor(...COR_DARK)
  pdf.setLineWidth(0.4)
  pdf.line(MARGIN, 76, w - MARGIN, 76)

  // Dados da capa
  const infoData = [
    ['Cliente',               nomeProprietario ?? '—'],
    ['Propriedade',           fazenda.nome_Fazenda ?? '—'],
    ['Área total',            fazenda.areaTotal ? `${Number(fazenda.areaTotal).toFixed(1)} ha` : '—'],
    ['Data de geração',       hoje],
    ['Data da última análise', formatarData(ultimaAnalise)],
  ]

  let y = 88
  for (const [label, val] of infoData) {
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...COR_CINZA)
    pdf.text(`${label}:`, MARGIN, y)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...COR_DARK)
    pdf.text(String(val), MARGIN + 54, y)
    y += 9
  }

  // Rodapé da capa
  pdf.setFontSize(7.5)
  pdf.setTextColor(180, 180, 180)
  pdf.text('Documento gerado automaticamente via Agrosyntech Dashboard', MARGIN, h - 10)
  pdf.text(hoje, w - MARGIN - 20, h - 10)

  // ── Seções ───────────────────────────────────────────────────────────────────

  const secoes = [
    { elId: `terreno-${id}`,  titulo: '1. Terreno — Área e informações gerais'   },
    { elId: `talhoes-${id}`,  titulo: '2. Talhões — Relatório de fertilidade'    },
    { elId: `solo-${id}`,     titulo: '3. Solo — Análise química e indicadores'  },
  ]

  for (const s of secoes) {
    const el = document.getElementById(s.elId)
    if (el) await adicionarSecao(pdf, el, s.titulo)
  }

  const nome = `relatorio-${(fazenda.nome_Fazenda ?? 'fazenda').replace(/\s+/g, '-')}-${hoje.replace(/\//g, '-')}.pdf`
  pdf.save(nome)
}
