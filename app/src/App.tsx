import { useEffect, useState, type CSSProperties } from 'react'
import { useAuth } from './context/AuthContext'
import { useStore } from './store/useStore'
import { Loading } from './components/Loading'
import { AuthScreen } from './components/AuthScreen'
import { Header } from './components/Header'
import { ProjectsView } from './components/ProjectsView'
import { LibraryView } from './components/LibraryView'
import { BoardView } from './components/BoardView'
import { ProjectModal } from './components/modals/ProjectModal'
import { UploadModal } from './components/modals/UploadModal'
import { MembersModal } from './components/modals/MembersModal'
import { TaskModal } from './components/modals/TaskModal'
import { Icon } from './components/ui/Icon'
import { accentVars, ACCENT_KEY } from './lib/accents'

const THEME_KEY = 'biblioteca_theme'
type Theme = 'dark' | 'light'

export default function App() {
  const { loading, user, signOut } = useAuth()
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(THEME_KEY) as Theme) || 'dark',
  )

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const [accent, setAccent] = useState<string>(
    () => localStorage.getItem(ACCENT_KEY) || 'vermelho',
  )
  useEffect(() => {
    localStorage.setItem(ACCENT_KEY, accent)
  }, [accent])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  const themeClass = theme === 'light' ? 'light-theme' : ''

  let content
  if (loading) content = <Loading />
  else if (!user) content = <AuthScreen />
  else
    content = (
      <AuthedApp
        userId={user.id}
        email={user.email || ''}
        onLogout={signOut}
        theme={theme}
        onToggleTheme={toggleTheme}
        accent={accent}
        onSetAccent={setAccent}
      />
    )

  return (
    <div
      className={themeClass}
      style={
        {
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--background)',
          color: 'var(--text)',
          fontFamily: 'var(--font-secondary)',
          ...accentVars(accent),
        } as CSSProperties
      }
    >
      {content}
    </div>
  )
}

function AuthedApp({
  userId,
  email,
  onLogout,
  theme,
  onToggleTheme,
  accent,
  onSetAccent,
}: {
  userId: string
  email: string
  onLogout: () => void
  theme: Theme
  onToggleTheme: () => void
  accent: string
  onSetAccent: (id: string) => void
}) {
  const store = useStore(userId, email)

  return (
    <>
      <Header
        store={store}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
        accent={accent}
        onSetAccent={onSetAccent}
      />

      {store.dataLoading ? (
        <div style={{ flex: 1, position: 'relative' }}>
          <Loading />
        </div>
      ) : store.view === 'projects' ? (
        <ProjectsView store={store} />
      ) : store.view === 'library' && store.currentProjectId ? (
        <LibraryView store={store} />
      ) : store.view === 'board' ? (
        <BoardView store={store} />
      ) : (
        <ProjectsView store={store} />
      )}

      {/* modais */}
      {store.uploadOpen && <UploadModal store={store} />}
      {store.projModalOpen && <ProjectModal store={store} />}
      {store.membersModalOpen && <MembersModal store={store} />}
      {store.taskModalOpen && <TaskModal store={store} />}

      {/* banner de erro */}
      {store.error && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(220,53,69,0.14)',
            border: '1px solid rgba(220,53,69,0.4)',
            color: '#F87171',
            fontFamily: 'var(--font-secondary)',
            fontSize: '12.5px',
            maxWidth: '90vw',
            boxShadow: 'var(--elevation-3)',
          }}
        >
          <Icon name="error" size={17} />
          <span style={{ maxWidth: '60ch', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {store.error}
          </span>
          <button
            onClick={() => store.setError(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
    </>
  )
}
