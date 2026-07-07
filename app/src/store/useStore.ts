import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as api from '../lib/api'
import type { DocSearchHit } from '../lib/api'
import type {
  Doc,
  Priority,
  Profile,
  Project,
  ProjectForm,
  Task,
  TaskForm,
  TaskStatus,
  UploadForm,
  RefType,
} from '../lib/types'

export type View = 'projects' | 'library' | 'board'

const emptyUploadForm = (subId = ''): UploadForm => ({
  title: '',
  description: '',
  category: 'geral',
  tagsText: '',
  content: '',
  fileName: '',
  subId,
})

const emptyTaskForm = (status: TaskStatus, me: string): TaskForm => ({
  title: '',
  description: '',
  status,
  priority: 'med',
  assignees: [me],
  refs: [],
})

export function useStore(me: string, myEmail: string) {
  // ---- dados ----
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [docs, setDocs] = useState<Doc[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ---- navegação ----
  const [view, setView] = useState<View>('projects')
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [currentSubId, setCurrentSubId] = useState<string | null>(null)
  const [boardProjFilter, setBoardProjFilter] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('all')
  const [tag, setTag] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchHits, setSearchHits] = useState<DocSearchHit[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  // ---- modais / formulários ----
  const [uploadOpen, setUploadOpen] = useState(false)
  const [form, setForm] = useState<UploadForm>(emptyUploadForm())
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [projModalOpen, setProjModalOpen] = useState(false)
  const [projForm, setProjForm] = useState<ProjectForm>({
    name: '',
    description: '',
    color: '#E5484D',
    parentId: null,
  })
  const [membersModalOpen, setMembersModalOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [taskForm, setTaskForm] = useState<TaskForm>(emptyTaskForm('todo', me))

  const scrollElRef = useRef<HTMLDivElement | null>(null)
  const dragIdRef = useRef<string | null>(null)

  // ---- carregar dados ----
  const reload = useCallback(async () => {
    try {
      const snap = await api.fetchSnapshot()
      setProfiles(snap.profiles)
      setProjects(snap.projects)
      setDocs(snap.docs)
      setTasks(snap.tasks)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      setDataLoading(true)
      await api.ensureProfile(me, myEmail).catch(() => {})
      if (!alive) return
      await reload()
      if (alive) setDataLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [me, myEmail, reload])

  // #9: carrega o corpo do documento ativo sob demanda e injeta no doc.
  useEffect(() => {
    if (!activeId) return
    const d = docs.find((x) => x.id === activeId)
    if (!d || d.content) return
    let alive = true
    api
      .getDocContent(activeId)
      .then((content) => {
        if (alive) setDocs((prev) => prev.map((x) => (x.id === activeId ? { ...x, content } : x)))
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      alive = false
    }
  }, [activeId, docs])

  // #4/#10: busca full-text no servidor (com debounce).
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setSearchHits([])
      setSearchLoading(false)
      return
    }
    let alive = true
    setSearchLoading(true)
    const t = setTimeout(() => {
      api
        .searchDocuments(q)
        .then((hits) => {
          if (alive) setSearchHits(hits)
        })
        .catch((e) => {
          if (alive) setError(e instanceof Error ? e.message : String(e))
        })
        .finally(() => {
          if (alive) setSearchLoading(false)
        })
    }, 250)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [query])

  // ============================================================
  // Helpers de leitura
  // ============================================================
  const user = useCallback(
    (id: string): Profile =>
      profiles.find((u) => u.id === id) || { id, name: 'Usuário', email: '', color: '#A0A0A0' },
    [profiles],
  )
  const project = useCallback(
    (id: string | null): Project | null => (id ? projects.find((p) => p.id === id) || null : null),
    [projects],
  )
  const subprojects = useCallback(
    (pid: string) => projects.filter((p) => p.parentId === pid),
    [projects],
  )
  const projectTreeIds = useCallback(
    (pid: string) => [pid, ...subprojects(pid).map((s) => s.id)],
    [subprojects],
  )
  const topProjectId = useCallback(
    (pid: string) => {
      const p = project(pid)
      if (!p) return pid
      return p.parentId || p.id
    },
    [project],
  )
  const myProjects = useCallback(
    () => projects.filter((p) => !p.parentId && p.members.includes(me)),
    [projects, me],
  )
  const docsInScope = useCallback(
    (topId: string, subId: string | null) => {
      const ids = subId ? [subId] : projectTreeIds(topId)
      const ds = docs.filter((d) => ids.includes(d.projectId))
      ds.sort(
        (a, b) =>
          (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) ||
          (b.updatedAt || '').localeCompare(a.updatedAt || ''),
      )
      return ds
    },
    [docs, projectTreeIds],
  )

  const resetScroll = () => {
    if (scrollElRef.current) scrollElRef.current.scrollTop = 0
  }

  // ============================================================
  // Navegação
  // ============================================================
  const openProjectAt = useCallback(
    (topId: string, subId: string | null, docId: string | null) => {
      const did = docId || docsInScope(topId, subId)[0]?.id || null
      setView('library')
      setCurrentProjectId(topId)
      setCurrentSubId(subId || null)
      setQuery('')
      setCat('all')
      setTag(null)
      setActiveId(did)
      resetScroll()
    },
    [docsInScope],
  )
  const openProject = useCallback((id: string) => openProjectAt(id, null, null), [openProjectAt])
  const openScope = useCallback(
    (pid: string, docId: string | null) => {
      const p = project(pid)
      if (!p) return
      openProjectAt(p.parentId || p.id, p.parentId ? p.id : null, docId || null)
    },
    [project, openProjectAt],
  )
  const selectSub = useCallback(
    (subId: string | null) => {
      const did = currentProjectId ? docsInScope(currentProjectId, subId)[0]?.id || null : null
      setCurrentSubId(subId || null)
      setCat('all')
      setTag(null)
      setQuery('')
      setActiveId(did)
      resetScroll()
    },
    [currentProjectId, docsInScope],
  )
  const goProjects = useCallback(() => setView('projects'), [])
  const goBoard = useCallback(() => setView('board'), [])
  const openDoc = useCallback((id: string) => {
    setActiveId(id)
    resetScroll()
  }, [])
  const openDocRef = useCallback(
    (docId: string) => {
      const d = docs.find((x) => x.id === docId)
      if (!d) return
      setTaskModalOpen(false)
      openScope(d.projectId, docId)
    },
    [docs, openScope],
  )
  const openProjectRef = useCallback(
    (id: string) => {
      setTaskModalOpen(false)
      openScope(id, null)
    },
    [openScope],
  )
  const scrollToHeading = useCallback((id: string) => {
    const c = scrollElRef.current
    if (!c) return
    const el = c.querySelector('#' + (window.CSS && CSS.escape ? CSS.escape(id) : id))
    if (el) {
      const top =
        el.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop - 18
      c.scrollTo({ top, behavior: 'smooth' })
    }
  }, [])

  // ============================================================
  // Projetos
  // ============================================================
  const openProjModal = useCallback(() => {
    setProjForm({ name: '', description: '', color: '#E5484D', parentId: null })
    setProjModalOpen(true)
  }, [])
  const openSubprojModal = useCallback(() => {
    setProjForm({ name: '', description: '', color: '#2A6FDB', parentId: currentProjectId })
    setProjModalOpen(true)
  }, [currentProjectId])
  const closeProjModal = useCallback(() => setProjModalOpen(false), [])

  const saveProject = useCallback(async () => {
    const f = projForm
    if (!f.name.trim()) return
    const parent = f.parentId ? project(f.parentId) : null
    try {
      const id = await api.createProject(f, me, parent ? parent.members : [])
      setProjModalOpen(false)
      await reload()
      if (f.parentId) selectSub(id)
      else openProject(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [projForm, project, me, reload, selectSub, openProject])

  const deleteProject = useCallback(
    async (id: string) => {
      const p = project(id)
      if (!p) return
      const isSub = !!p.parentId
      const msg = isSub
        ? 'Excluir este subprojeto e seus documentos?'
        : 'Excluir este projeto, seus subprojetos e TODOS os documentos dentro deles? Esta ação não pode ser desfeita.'
      if (!window.confirm(msg)) return
      try {
        await api.deleteProject(id)
        await reload()
        if (isSub) {
          if (currentSubId === id) {
            setCurrentSubId(null)
            setActiveId(null)
          }
        } else if (currentProjectId === id) {
          setView('projects')
          setCurrentProjectId(null)
          setCurrentSubId(null)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    },
    [project, reload, currentSubId, currentProjectId],
  )

  // ============================================================
  // Membros
  // ============================================================
  const openMembers = useCallback(() => setMembersModalOpen(true), [])
  const closeMembers = useCallback(() => setMembersModalOpen(false), [])
  const addMember = useCallback(
    async (uid: string) => {
      if (!uid || !currentProjectId) return
      try {
        await api.addMember(currentProjectId, uid)
        await reload()
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    },
    [currentProjectId, reload],
  )
  const removeMember = useCallback(
    async (uid: string) => {
      const p = project(currentProjectId)
      if (!p || uid === p.ownerId) return
      try {
        await api.removeMember(p.id, uid)
        await reload()
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    },
    [project, currentProjectId, reload],
  )

  // ============================================================
  // Documentos
  // ============================================================
  const openUpload = useCallback(() => {
    setEditingDocId(null)
    setForm(emptyUploadForm(currentSubId || ''))
    setUploadOpen(true)
  }, [currentSubId])
  const openEditDoc = useCallback(
    async (id: string) => {
      const d = docs.find((x) => x.id === id)
      if (!d) return
      let content = d.content
      if (!content) {
        try {
          content = await api.getDocContent(id)
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e))
          return
        }
      }
      setEditingDocId(id)
      setForm({
        title: d.title,
        description: d.description === 'Sem descrição.' ? '' : d.description,
        category: d.category,
        tagsText: d.tags.join(', '),
        content,
        fileName: '',
        subId: d.projectId,
      })
      setUploadOpen(true)
    },
    [docs],
  )
  const closeUpload = useCallback(() => setUploadOpen(false), [])

  const readFile = useCallback((file: File | null | undefined) => {
    if (!file) return
    const r = new FileReader()
    r.onload = () => {
      const text = String(r.result || '')
      setForm((prev) => {
        const f = { ...prev, content: text, fileName: file.name }
        if (!f.title) {
          const h = text.match(/^#\s+(.+)$/m)
          f.title = h ? h[1].trim() : file.name.replace(/\.(md|markdown)$/i, '')
        }
        if (!f.description) {
          const body = text
            .replace(/^#\s+.+$/m, '')
            .split('\n')
            .map((x) => x.trim())
            .filter((x) => x && !/^[#>\-*|`]/.test(x))
          if (body[0]) f.description = body[0].slice(0, 140)
        }
        return f
      })
    }
    r.readAsText(file)
  }, [])

  const saveUpload = useCallback(async () => {
    const f = form
    if (!f.title.trim() || !f.content.trim()) return
    try {
      if (editingDocId) {
        await api.updateDoc(editingDocId, f)
        setUploadOpen(false)
        await reload()
        setActiveId(editingDocId)
      } else {
        const projectId = f.subId || currentProjectId
        if (!projectId) return
        const id = await api.createDoc(f, projectId)
        setUploadOpen(false)
        setCat('all')
        setQuery('')
        setTag(null)
        await reload()
        setActiveId(id)
        resetScroll()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [form, editingDocId, currentProjectId, reload])

  const togglePin = useCallback(
    async (id: string) => {
      const d = docs.find((x) => x.id === id)
      if (!d) return
      const next = !d.pinned
      setDocs((prev) => prev.map((x) => (x.id === id ? { ...x, pinned: next } : x)))
      try {
        await api.setDocPinned(id, next)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
        reload()
      }
    },
    [docs, reload],
  )

  const deleteDoc = useCallback(
    async (id: string) => {
      if (!window.confirm('Excluir este documento da biblioteca?')) return
      try {
        await api.deleteDoc(id)
        const remaining = docs.filter((d) => d.id !== id)
        setDocs(remaining)
        if (activeId === id) {
          const scopeIds = currentSubId
            ? [currentSubId]
            : currentProjectId
              ? projectTreeIds(currentProjectId)
              : []
          setActiveId(remaining.find((d) => scopeIds.includes(d.projectId))?.id || null)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
      }
    },
    [docs, activeId, currentSubId, currentProjectId, projectTreeIds],
  )

  const copyDoc = useCallback((doc: Doc) => {
    if (navigator.clipboard) navigator.clipboard.writeText(doc.content)
    setCopiedId(doc.id)
    setTimeout(() => setCopiedId((c) => (c === doc.id ? null : c)), 1600)
  }, [])

  const downloadDoc = useCallback((doc: Doc) => {
    const blob = new Blob([doc.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download =
      doc.title
        .toLowerCase()
        .normalize('NFD')
        .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '.md'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, [])

  // ============================================================
  // Tarefas
  // ============================================================
  const openTaskModal = useCallback(
    (status: TaskStatus) => {
      setEditingTaskId(null)
      setTaskForm(emptyTaskForm(status || 'todo', me))
      setTaskModalOpen(true)
    },
    [me],
  )
  const openTask = useCallback(
    (id: string) => {
      const t = tasks.find((x) => x.id === id)
      if (!t) return
      setEditingTaskId(id)
      setTaskForm({
        title: t.title,
        description: t.description || '',
        status: t.status,
        priority: t.priority || 'med',
        assignees: [...t.assignees],
        refs: [...t.refs],
      })
      setTaskModalOpen(true)
    },
    [tasks],
  )
  const closeTask = useCallback(() => setTaskModalOpen(false), [])
  const toggleAssignee = useCallback((uid: string) => {
    setTaskForm((s) => {
      const a = [...s.assignees]
      const i = a.indexOf(uid)
      if (i === -1) a.push(uid)
      else a.splice(i, 1)
      return { ...s, assignees: a }
    })
  }, [])
  const addRef = useCallback((type: RefType, id: string) => {
    if (!id) return
    setTaskForm((s) => {
      if (s.refs.some((r) => r.type === type && r.id === id)) return s
      return { ...s, refs: [...s.refs, { type, id }] }
    })
  }, [])
  const removeRef = useCallback((idx: number) => {
    setTaskForm((s) => {
      const refs = [...s.refs]
      refs.splice(idx, 1)
      return { ...s, refs }
    })
  }, [])

  const saveTask = useCallback(async () => {
    const f = taskForm
    if (!f.title.trim()) return
    try {
      if (editingTaskId) await api.updateTask(editingTaskId, f)
      else await api.createTask(f, me)
      setTaskModalOpen(false)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [taskForm, editingTaskId, me, reload])

  const deleteTask = useCallback(async () => {
    if (!editingTaskId) return
    if (!window.confirm('Excluir esta tarefa?')) return
    try {
      await api.deleteTask(editingTaskId)
      setTaskModalOpen(false)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [editingTaskId, reload])

  const moveTask = useCallback(
    async (id: string | null, status: TaskStatus) => {
      if (!id) return
      const cur = tasks.find((t) => t.id === id)
      if (!cur || cur.status === status) return
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
      try {
        await api.moveTask(id, status)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
        reload()
      }
    },
    [tasks, reload],
  )

  // atalhos de setter de formulário
  const patchForm = useCallback(
    (key: keyof UploadForm) => (v: string) => setForm((s) => ({ ...s, [key]: v })),
    [],
  )
  const patchProjForm = useCallback(
    (key: keyof ProjectForm) => (v: string) => setProjForm((s) => ({ ...s, [key]: v })),
    [],
  )
  const patchTaskForm = useCallback(
    (key: keyof TaskForm) => (v: string) => setTaskForm((s) => ({ ...s, [key]: v })),
    [],
  )
  const setProjColor = useCallback((hex: string) => setProjForm((s) => ({ ...s, color: hex })), [])

  return useMemo(
    () => ({
      // dados
      me,
      profiles,
      projects,
      docs,
      tasks,
      dataLoading,
      error,
      setError,
      // helpers
      user,
      project,
      subprojects,
      projectTreeIds,
      topProjectId,
      myProjects,
      docsInScope,
      // navegação
      view,
      currentProjectId,
      currentSubId,
      boardProjFilter,
      setBoardProjFilter,
      activeId,
      query,
      setQuery,
      cat,
      setCat,
      tag,
      setTag,
      copiedId,
      searchHits,
      searchLoading,
      goProjects,
      goBoard,
      openProject,
      openScope,
      selectSub,
      openDoc,
      openDocRef,
      openProjectRef,
      scrollToHeading,
      scrollElRef,
      dragIdRef,
      // projetos
      projModalOpen,
      projForm,
      openProjModal,
      openSubprojModal,
      closeProjModal,
      saveProject,
      deleteProject,
      patchProjForm,
      setProjColor,
      // membros
      membersModalOpen,
      openMembers,
      closeMembers,
      addMember,
      removeMember,
      // documentos
      uploadOpen,
      form,
      editingDocId,
      openUpload,
      openEditDoc,
      closeUpload,
      readFile,
      saveUpload,
      togglePin,
      deleteDoc,
      copyDoc,
      downloadDoc,
      patchForm,
      // tarefas
      taskModalOpen,
      editingTaskId,
      taskForm,
      openTaskModal,
      openTask,
      closeTask,
      toggleAssignee,
      addRef,
      removeRef,
      saveTask,
      deleteTask,
      moveTask,
      patchTaskForm,
    }),
    [
      me,
      profiles,
      projects,
      docs,
      tasks,
      dataLoading,
      error,
      user,
      project,
      subprojects,
      projectTreeIds,
      topProjectId,
      myProjects,
      docsInScope,
      view,
      currentProjectId,
      currentSubId,
      boardProjFilter,
      activeId,
      query,
      cat,
      tag,
      copiedId,
      searchHits,
      searchLoading,
      goProjects,
      goBoard,
      openProject,
      openScope,
      selectSub,
      openDoc,
      openDocRef,
      openProjectRef,
      scrollToHeading,
      projModalOpen,
      projForm,
      openProjModal,
      openSubprojModal,
      closeProjModal,
      saveProject,
      deleteProject,
      patchProjForm,
      setProjColor,
      membersModalOpen,
      openMembers,
      closeMembers,
      addMember,
      removeMember,
      uploadOpen,
      form,
      editingDocId,
      openUpload,
      openEditDoc,
      closeUpload,
      readFile,
      saveUpload,
      togglePin,
      deleteDoc,
      copyDoc,
      downloadDoc,
      patchForm,
      taskModalOpen,
      editingTaskId,
      taskForm,
      openTaskModal,
      openTask,
      closeTask,
      toggleAssignee,
      addRef,
      removeRef,
      saveTask,
      deleteTask,
      moveTask,
      patchTaskForm,
    ],
  )
}

export type Store = ReturnType<typeof useStore>

// re-export para os componentes
export type { Doc, Project, Task, Profile, Priority, TaskStatus }
