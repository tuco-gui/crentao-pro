import { supabase } from './supabase'

// Busca todas as perguntas
export async function getPerguntas() {
  const { data, error } = await supabase
    .from('perguntas')
    .select('*')

  if (error) {
    console.error('Erro ao carregar perguntas:', error)
    return []
  }

  return data
}

// Sorteia uma pergunta aleatória
export async function getPerguntaAleatoria() {
  const perguntas = await getPerguntas()
  if (perguntas.length === 0) return null

  const randomIndex = Math.floor(Math.random() * perguntas.length)
  return perguntas[randomIndex]
}
