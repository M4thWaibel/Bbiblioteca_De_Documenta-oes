import { supabase } from './supabase'
import type { Doc, Profile, Project, Task, TaskForm, UploadForm } from './types'

// ============================================================
// Helpers de mapeamento (linha do banco -> modelo de domínio)
// ============================================================
function mapProject(row: any, members: string[]): Project {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    description: row.description,
    color: row.color,
    ownerId: row.owner_id,
    members,
    createdAt: (row.created_at || '').slice(0, 10),
  }
}

function mapDoc(row: any): Doc {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    category: row.category,
    tags: row.tags || [],
    content: row.content || '',
    pinned: !!row.pinned,
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at.slice(0, 10) : row.updated_at,
  }
}

// ============================================================
// LEITURA — carrega tudo que o usuário pode acessar (RLS filtra)
// ============================================================
export interface Snapshot {
  profiles: Profile[]
  projects: Project[]
  docs: Doc[]
  tasks: Task[]
}

export async function fetchSnapshot(): Promise<Snapshot> {
  const [profilesRes, projectsRes, membersRes, docsRes, tasksRes, assigneesRes, refsRes] =
    await Promise.all([
      supabase.from('profiles').select('id,name,email,color').order('name'),
      supabase.from('projects').select('*').order('created_at'),
      supabase.from('project_members').select('project_id,user_id'),
      // #9: o corpo (content) NÃO vem no snapshot — é carregado sob demanda
      // ao abrir o documento (getDocContent). A busca por conteúdo é server-side.
      supabase
        .from('documents')
        .select('id,project_id,title,description,category,tags,pinned,updated_at'),
      supabase.from('tasks').select('*').order('created_at'),
      supabase.from('task_assignees').select('task_id,user_id'),
      supabase.from('task_refs').select('task_id,doc_id,ref_project_id'),
    ])

  const firstError =
    profilesRes.error ||
    projectsRes.error ||
    membersRes.error ||
    docsRes.error ||
    tasksRes.error ||
    assigneesRes.error ||
    refsRes.error
  if (firstError) throw firstError

  const membersByProject = new Map<string, string[]>()
  for (const m of membersRes.data || []) {
    const arr = membersByProject.get(m.project_id) || []
    arr.push(m.user_id)
    membersByProject.set(m.project_id, arr)
  }

  const projects = (projectsRes.data || []).map((row) =>
    mapProject(row, membersByProject.get(row.id) || []),
  )
  const docs = (docsRes.data || []).map(mapDoc)

  const assigneesByTask = new Map<string, string[]>()
  for (const a of assigneesRes.data || []) {
    const arr = assigneesByTask.get(a.task_id) || []
    arr.push(a.user_id)
    assigneesByTask.set(a.task_id, arr)
  }
  const refsByTask = new Map<string, Task['refs']>()
  for (const r of refsRes.data || []) {
    const arr = refsByTask.get(r.task_id) || []
    if (r.doc_id) arr.push({ type: 'doc', id: r.doc_id })
    else if (r.ref_project_id) arr.push({ type: 'project', id: r.ref_project_id })
    refsByTask.set(r.task_id, arr)
  }

  const tasks: Task[] = (tasksRes.data || []).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description || '',
    status: row.status,
    priority: row.priority,
    assignees: assigneesByTask.get(row.id) || [],
    refs: refsByTask.get(row.id) || [],
    createdAt: (row.created_at || '').slice(0, 10),
  }))

  return { profiles: profilesRes.data || [], projects, docs, tasks }
}

// ============================================================
// PERFIL
// ============================================================
export async function ensureProfile(userId: string, email: string, name?: string) {
  await supabase
    .from('profiles')
    .upsert({ id: userId, email, name: name || undefined }, { onConflict: 'id', ignoreDuplicates: true })
}

// ============================================================
// PROJETOS
// ============================================================
export async function createProject(
  form: { name: string; description: string; color: string; parentId: string | null },
  ownerId: string,
  parentMembers: string[],
): Promise<string> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      parent_id: form.parentId,
      name: form.name.trim(),
      description: form.description.trim() || 'Sem descrição.',
      color: form.color,
      owner_id: ownerId,
    })
    .select('id')
    .single()
  if (error) throw error

  const projectId = data.id as string
  const members = form.parentId ? Array.from(new Set([ownerId, ...parentMembers])) : [ownerId]
  const rows = members.map((uid) => ({ project_id: projectId, user_id: uid }))
  const { error: mErr } = await supabase
    .from('project_members')
    .upsert(rows, { onConflict: 'project_id,user_id', ignoreDuplicates: true })
  if (mErr) throw mErr

  return projectId
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

// ============================================================
// MEMBROS
// ============================================================
export async function addMember(projectId: string, userId: string) {
  const { error } = await supabase
    .from('project_members')
    .upsert({ project_id: projectId, user_id: userId }, { onConflict: 'project_id,user_id', ignoreDuplicates: true })
  if (error) throw error
}

export async function removeMember(projectId: string, userId: string) {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)
  if (error) throw error
}

// ============================================================
// DOCUMENTOS
// ============================================================
export async function createDoc(form: UploadForm, projectId: string): Promise<string> {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      project_id: projectId,
      title: form.title.trim(),
      description: form.description.trim() || 'Sem descrição.',
      category: form.category,
      tags: form.tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      content: form.content,
      pinned: false,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id as string
}

export async function updateDoc(id: string, form: UploadForm) {
  const { error } = await supabase
    .from('documents')
    .update({
      title: form.title.trim(),
      description: form.description.trim() || 'Sem descrição.',
      category: form.category,
      tags: form.tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      content: form.content,
      // updated_at é definido pelo trigger documents_set_updated_at
    })
    .eq('id', id)
  if (error) throw error
}

export async function setDocPinned(id: string, pinned: boolean) {
  const { error } = await supabase.from('documents').update({ pinned }).eq('id', id)
  if (error) throw error
}

export async function deleteDoc(id: string) {
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) throw error
}

// #9: carrega o corpo do documento sob demanda (não vem no snapshot).
export async function getDocContent(id: string): Promise<string> {
  const { data, error } = await supabase
    .from('documents')
    .select('content')
    .eq('id', id)
    .single()
  if (error) throw error
  return (data?.content as string) || ''
}

// ============================================================
// BUSCA (Fase 2 · #4/#10) — full-text no servidor via RPC
// ============================================================
export interface DocSearchHit {
  id: string
  projectId: string
  title: string
  description: string
  category: string
  tags: string[]
  pinned: boolean
  updatedAt: string
  headline: string // trecho com marcadores « » ao redor das ocorrências
  rank: number
}

export async function searchDocuments(query: string): Promise<DocSearchHit[]> {
  const q = query.trim()
  if (!q) return []
  const { data, error } = await supabase.rpc('search_documents', { q })
  if (error) throw error
  return (data || []).map((row: any) => ({
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description,
    category: row.category,
    tags: row.tags || [],
    pinned: !!row.pinned,
    updatedAt:
      typeof row.updated_at === 'string' ? row.updated_at.slice(0, 10) : row.updated_at,
    headline: row.headline || '',
    rank: typeof row.rank === 'number' ? row.rank : Number(row.rank) || 0,
  }))
}

// ============================================================
// REALTIME (Fase 3 · #5) — notifica mudanças nas tabelas do app
// ============================================================
export function subscribeToChanges(onChange: () => void): () => void {
  const tables = ['documents', 'tasks', 'projects', 'project_members', 'task_assignees', 'task_refs']
  const channel = supabase.channel('biblioteca-changes')
  for (const table of tables) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => onChange())
  }
  channel.subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

// ============================================================
// TAREFAS
// ============================================================
async function writeAssignees(taskId: string, assignees: string[]) {
  await supabase.from('task_assignees').delete().eq('task_id', taskId)
  if (assignees.length) {
    const { error } = await supabase
      .from('task_assignees')
      .insert(assignees.map((uid) => ({ task_id: taskId, user_id: uid })))
    if (error) throw error
  }
}

async function writeRefs(taskId: string, refs: TaskForm['refs']) {
  await supabase.from('task_refs').delete().eq('task_id', taskId)
  if (refs.length) {
    const rows = refs.map((r) => ({
      task_id: taskId,
      doc_id: r.type === 'doc' ? r.id : null,
      ref_project_id: r.type === 'project' ? r.id : null,
    }))
    const { error } = await supabase.from('task_refs').insert(rows)
    if (error) throw error
  }
}

export async function createTask(form: TaskForm, createdBy: string): Promise<string> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      project_id: null,
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      created_by: createdBy,
    })
    .select('id')
    .single()
  if (error) throw error
  const taskId = data.id as string
  await writeAssignees(taskId, form.assignees)
  await writeRefs(taskId, form.refs)
  return taskId
}

export async function updateTask(id: string, form: TaskForm) {
  const { error } = await supabase
    .from('tasks')
    .update({
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
    })
    .eq('id', id)
  if (error) throw error
  await writeAssignees(id, form.assignees)
  await writeRefs(id, form.refs)
}

export async function moveTask(id: string, status: Task['status']) {
  const { error } = await supabase.from('tasks').update({ status }).eq('id', id)
  if (error) throw error
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}
