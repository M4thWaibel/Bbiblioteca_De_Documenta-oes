// ===== Modelos de domínio (mapeados a partir das linhas do Supabase) =====

// Status é um id (slug) de task_statuses — customizável (Update 2.0 · #3).
export type TaskStatus = string
export type Priority = 'low' | 'med' | 'high'
export type RefType = 'doc' | 'project'

export interface Profile {
  id: string
  name: string
  email: string
  color: string
}

export interface Project {
  id: string
  parentId: string | null
  name: string
  description: string
  color: string
  ownerId: string
  members: string[]
  createdAt: string
}

export interface Doc {
  id: string
  projectId: string
  title: string
  description: string
  category: string
  tags: string[]
  content: string
  pinned: boolean
  updatedAt: string
}

export interface TaskRef {
  type: RefType
  id: string
}

export interface TaskItem {
  id: string
  text: string
  done: boolean
  position: number
}

export interface Task {
  id: string
  projectId: string | null
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  assignees: string[]
  refs: TaskRef[]
  createdAt: string
  position: number
  dueDate: string | null
  items: TaskItem[]
}

// ===== Formulários =====

export interface ProjectForm {
  name: string
  description: string
  color: string
  parentId: string | null
}

export interface UploadForm {
  title: string
  description: string
  category: string
  tagsText: string
  content: string
  fileName: string
  subId: string
}

export interface TaskForm {
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  assignees: string[]
  refs: TaskRef[]
  dueDate: string
  projectId: string | null
}
