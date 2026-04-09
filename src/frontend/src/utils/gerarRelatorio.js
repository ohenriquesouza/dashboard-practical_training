import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const EMPRESA   = 'Agrosyntech Soluções em Tecnologia e Agro LTDA'
const MARGIN    = 14
const COR_DARK  = [26, 26, 46]
const COR_CINZA = [100, 100, 100]
const COL_GAP   = 5

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

async function adicionarSecaoDom(pdf, el, titulo) {
  const w      = pdf.internal.pageSize.getWidth()
  const h      = pdf.internal.pageSize.getHeight()
  const cW     = w - MARGIN * 2
  const startY = 18

  pdf.addPage()
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

// ── Renderização programática dos talhões ─────────────────────────────────────

const NUTR_META = [
  { key: 'P', nome: 'Fósforo',          unidade: 'mg/dm³' },
  { key: 'K', nome: 'Potássio',         unidade: 'mg/dm³' },
  { key: 'M', nome: 'Matéria Orgânica', unidade: 'dag/kg' },
  { key: 'V', nome: 'Sat. de Bases',    unidade: '%'      },
]

function scoreFromCount(n) {
  if (n <= 0) return { score: 0, label: 'Saudável' }
  if (n === 1) return { score: 1, label: 'Leve' }
  if (n === 2) return { score: 2, label: 'Moderado' }
  return              { score: 3, label: 'Crítico' }
}

function scoreColor(score) {
  if (score >= 3) return [185, 28, 28]
  if (score === 2) return [194, 65, 12]
  if (score === 1) return [133, 77, 14]
  return [22, 101, 52]
}

const GRID_NUTR_H = 6.2          // altura de cada linha de nutriente
const GRID_HEADER_H = 9          // cabeçalho do grid
const GRID_PADDING  = 4          // padding interno
const GRID_CARD_H   = GRID_HEADER_H + NUTR_META.length * GRID_NUTR_H + GRID_PADDING

function renderGridCard(pdf, grid, x, y, colW) {
  const alertas  = grid.alertas ?? []
  const { score, label } = scoreFromCount(alertas.length)
  const porNutriente = {}
  for (const a of alertas) {
    if (!porNutriente[a.nutriente]) porNutriente[a.nutriente] = []
    porNutriente[a.nutriente].push(a)
  }

  // Card background + border
  pdf.setFillColor(250, 250, 250)
  pdf.setDrawColor(220, 220, 220)
  pdf.roundedRect(x, y, colW, GRID_CARD_H, 2, 2, 'FD')

  // Nome do grid
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(...COR_DARK)
  pdf.text(String(grid.nomeGrid ?? '—').slice(0, 28), x + 3, y + 6)

  // Score (alinhado à direita)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.setTextColor(...scoreColor(score))
  pdf.text(`Score ${score} · ${label}`, x + colW - 2.5, y + 6, { align: 'right' })

  // Linha separadora do header
  pdf.setDrawColor(235, 235, 235)
  pdf.line(x + 2, y + GRID_HEADER_H - 0.5, x + colW - 2, y + GRID_HEADER_H - 0.5)

  // Nutrientes
  let rowY = y + GRID_HEADER_H + 2
  for (const { key, nome, unidade } of NUTR_META) {
    const list     = porNutriente[key] ?? []
    const temBaixo = list.some(a => a.tipo === 'baixo')
    const temAlto  = list.some(a => a.tipo === 'alto')
    const dados    = grid.valores?.[key]

    let icon, status, cor
    if (temBaixo && !temAlto) {
      icon = '\u2193'; status = 'Defic.'; cor = [133, 77, 14]
    } else if (temAlto && !temBaixo) {
      icon = '\u2191'; status = 'Excesso'; cor = [159, 18, 57]
    } else if (temBaixo && temAlto) {
      icon = '?'; status = 'Conflito'; cor = [55, 65, 81]
    } else {
      icon = '\u2713'; status = 'Ideal'; cor = [22, 101, 52]
    }

    // ícone + chave
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(7)
    pdf.setTextColor(...cor)
    pdf.text(`${icon} ${key}`, x + 3, rowY)

    // nome do nutriente
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...COR_CINZA)
    pdf.text(`${nome}`, x + 11, rowY)

    // status
    pdf.setTextColor(...cor)
    pdf.setFont('helvetica', 'bold')
    pdf.text(status, x + colW * 0.57, rowY)

    // valor atual (direita)
    if (dados && Number.isFinite(dados.valor)) {
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(...COR_CINZA)
      pdf.text(`${Number(dados.valor).toFixed(1)} ${unidade}`, x + colW - 2.5, rowY, { align: 'right' })
    }

    rowY += GRID_NUTR_H
  }
}

function adicionarSecaoTalhoes(pdf, resumoTalhoes, titulo) {
  const w        = pdf.internal.pageSize.getWidth()
  const h        = pdf.internal.pageSize.getHeight()
  const cW       = w - MARGIN * 2
  const colW     = (cW - COL_GAP) / 2
  const BOTTOM   = MARGIN + 2

  let y = 18

  function novaPage() {
    pdf.addPage()
    pdf.setFillColor(...COR_DARK)
    pdf.rect(0, 0, w, 13, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.text(titulo, MARGIN, 9)
    pdf.setTextColor(0, 0, 0)
    y = 18
  }

  function ensure(needed) {
    if (y + needed > h - BOTTOM) novaPage()
  }

  // Primeira página da seção
  pdf.addPage()
  pdf.setFillColor(...COR_DARK)
  pdf.rect(0, 0, w, 13, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text(titulo, MARGIN, 9)
  pdf.setTextColor(0, 0, 0)

  const talhoes = resumoTalhoes ?? []

  for (const talhao of talhoes) {
    ensure(14)

    // ── Cabeçalho do talhão ──────────────────────────────────────────────────
    pdf.setFillColor(237, 240, 250)
    pdf.roundedRect(MARGIN, y, cW, 10, 2, 2, 'F')

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9.5)
    pdf.setTextColor(...COR_DARK)
    pdf.text(String(talhao.nomeTalhao ?? '—'), MARGIN + 3, y + 7)

    const priorCor = talhao.prioridade === 'alta' ? [185, 28, 28]
      : talhao.prioridade === 'media' ? [194, 65, 12]
      : [22, 101, 52]
    const meta = `Score: ${Number(talhao.scoreMedio).toFixed(2)}  ·  Grids: ${(talhao.grids ?? []).length}  ·  Críticos: ${talhao.gridsCriticos ?? 0}  ·  Prio: ${(talhao.prioridade ?? '').toUpperCase()}`
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7.5)
    pdf.setTextColor(...priorCor)
    pdf.text(meta, w - MARGIN - 2, y + 7, { align: 'right' })

    y += 13

    // ── Grids em pares (2 colunas) ────────────────────────────────────────────
    const grids = talhao.grids ?? []

    if (grids.length === 0) {
      ensure(7)
      pdf.setFont('helvetica', 'italic')
      pdf.setFontSize(8)
      pdf.setTextColor(...COR_CINZA)
      pdf.text('Nenhum grid registrado.', MARGIN + 3, y + 4)
      y += 9
    } else {
      for (let gi = 0; gi < grids.length; gi += 2) {
        ensure(GRID_CARD_H + 3)
        renderGridCard(pdf, grids[gi],     MARGIN,              y, colW)
        if (grids[gi + 1])
          renderGridCard(pdf, grids[gi + 1], MARGIN + colW + COL_GAP, y, colW)
        y += GRID_CARD_H + 3
      }
    }

    y += 6  // espaço entre talhões
  }
}

// ── Função principal ──────────────────────────────────────────────────────────

export async function gerarRelatorio({ fazenda, nomeProprietario, ultimaAnalise, resumoTalhoes }) {
  const id  = fazenda.idPropriedade
  const pdf = new jsPDF('p', 'mm', 'a4')
  const w   = pdf.internal.pageSize.getWidth()
  const h   = pdf.internal.pageSize.getHeight()
  const hoje = new Date().toLocaleDateString('pt-BR')

  // ── Capa ────────────────────────────────────────────────────────────────────

  pdf.setFillColor(...COR_DARK)
  pdf.rect(0, 0, w, 38, 'F')

  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(15)
  pdf.text('AGROSYNTECH', MARGIN, 17)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7.5)
  pdf.text(EMPRESA, MARGIN, 25)

  pdf.setTextColor(...COR_DARK)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(22)
  pdf.text('Relatório Técnico', MARGIN, 60)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(13)
  pdf.setTextColor(...COR_CINZA)
  pdf.text('Análise de Solo e Fertilidade', MARGIN, 70)

  pdf.setDrawColor(...COR_DARK)
  pdf.setLineWidth(0.4)
  pdf.line(MARGIN, 76, w - MARGIN, 76)

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

  pdf.setFontSize(7.5)
  pdf.setTextColor(180, 180, 180)
  pdf.text('Documento gerado automaticamente via Agrosyntech Dashboard', MARGIN, h - 10)
  pdf.text(hoje, w - MARGIN - 20, h - 10)

  // ── Seção 1: Terreno (DOM) ───────────────────────────────────────────────────
  const elTerreno = document.getElementById(`terreno-${id}`)
  if (elTerreno)
    await adicionarSecaoDom(pdf, elTerreno, '1. Terreno — Área e informações gerais')

  // ── Seção 2: Talhões + Grids (programático) ───────────────────────────────────
  adicionarSecaoTalhoes(pdf, resumoTalhoes, '2. Talhões — Relatório de fertilidade')

  // ── Seção 3: Solo (DOM) ───────────────────────────────────────────────────────
  const elSolo = document.getElementById(`solo-${id}`)
  if (elSolo)
    await adicionarSecaoDom(pdf, elSolo, '3. Solo — Análise química e indicadores')

  const nome = `relatorio-${(fazenda.nome_Fazenda ?? 'fazenda').replace(/\s+/g, '-')}-${hoje.replace(/\//g, '-')}.pdf`
  pdf.save(nome)
}
