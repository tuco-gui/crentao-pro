// src/main.js
import './style.css'
import { supabase } from './lib/supabase'

// cria a UI básica dentro do #app (o index.html do Vite já tem <div id="app"></div>)
const app = document.querySelector('#app')
app.innerHTML = `
  <div class="container">
    <h1>To-dos — Supabase</h1>

    <form id="todoForm" class="row">
      <input id="title" type="text" placeholder="Nova tarefa" />
      <button id="addBtn" type="submit">Adicionar</button>
      <button id="refreshBtn" type="button">Recarregar</button>
    </form>

    <ul id="list"></ul>
    <p class="muted">Projeto: <span id="url" class="mono"></span></p>
  </div>
`

const els = {
  list: document.querySelector('#list'),
  form: document.querySelector('#todoForm'),
  input: document.querySelector('#title'),
  refresh: document.querySelector('#refreshBtn'),
  url: document.querySelector('#url'),
}

els.url.textContent = supabase.supabaseUrl || '(sem URL)'

// ---------- helpers ----------
function liTemplate(todo) {
  return `
    <li data-id="${todo.id}" class="${todo.is_complete ? 'done' : ''}">
      <span>${todo.title}</span>
      <div class="actions">
        <button data-action="toggle">${todo.is_complete ? 'Desfazer' : 'Concluir'}</button>
        <button data-action="delete" class="danger">Excluir</button>
      </div>
    </li>
  `
}

function render(todos = []) {
  els.list.innerHTML = todos.map(liTemplate).join('')
}

async function loadTodos() {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('id', { ascending: false })

  if (error) {
    console.error(error)
    alert('Erro ao carregar tarefas')
    return
  }
  render(data)
}

// ---------- actions ----------
async function addTodo(title) {
  if (!title.trim()) return
  const { error } = await supabase.from('todos').insert({ title })
  if (error) {
    console.error(error)
    alert('Erro ao adicionar')
  } else {
    els.input.value = ''
  }
}

async function toggleTodo(id, current) {
  const { error } = await supabase
    .from('todos')
    .update({ is_complete: !current })
    .eq('id', id)

  if (error) {
    console.error(error)
    alert('Erro ao atualizar')
  }
}

async function deleteTodo(id) {
  const { error } = await supabase.from('todos').delete().eq('id', id)
  if (error) {
    console.error(error)
    alert('Erro ao excluir')
  }
}

// ---------- events ----------
els.form.addEventListener('submit', (e) => {
  e.preventDefault()
  addTodo(els.input.value)
})

els.refresh.addEventListener('click', loadTodos)

els.list.addEventListener('click', (e) => {
  const btn = e.target.closest('button')
  if (!btn) return
  const li = e.target.closest('li')
  const id = Number(li.dataset.id)

  if (btn.dataset.action === 'toggle') {
    const isDone = li.classList.contains('done')
    toggleTodo(id, isDone)
  }
  if (btn.dataset.action === 'delete') {
    deleteTodo(id)
  }
})

// ---------- realtime (escuta inserts/updates/deletes) ----------
supabase
  .channel('todos-realtime')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'todos' },
    () => loadTodos()
  )
  .subscribe()

// primeira carga
loadTodos()

