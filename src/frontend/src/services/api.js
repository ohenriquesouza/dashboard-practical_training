import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

export const fetchResumoProprietarios = () =>
  api.get('/resumo/proprietarios')

export const fetchAll = (ano, idProprietario) => {
  const params = {}
  if (ano) params.ano = ano
  if (idProprietario) params.idProprietario = idProprietario
  return api.get('/all', { params })
}

export const fetchTable = (tableName, ano, idProprietario) => {
  const params = {}
  if (ano) params.ano = ano
  if (idProprietario) params.idProprietario = idProprietario
  return api.get(`/table/${tableName}`, { params })
}

export const fetchPainelProprietario = (idProprietario) =>
  api.get(`/proprietario/${idProprietario}/painel`)

export const fetchQuimicaTimeline = (idPropriedade) =>
  api.get(`/propriedade/${idPropriedade}/quimica-timeline`)

export default api