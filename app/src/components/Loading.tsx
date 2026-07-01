export function Loading() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--background)',
      }}
    >
      <div
        style={{
          width: '34px',
          height: '34px',
          border: '3px solid var(--border-light)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 800ms linear infinite',
        }}
      />
    </div>
  )
}
