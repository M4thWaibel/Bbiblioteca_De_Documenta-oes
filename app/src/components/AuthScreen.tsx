import { useState, type CSSProperties } from 'react'
import { useAuth } from '../context/AuthContext'
import { Icon } from './ui/Icon'
import { Hoverable } from './ui/Hoverable'
import { uploadBtnHover } from './ui/styles'

const inputWrap: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  height: '46px',
  padding: '0 12px',
  background: 'var(--surface)',
  border: '1px solid var(--border-light)',
  borderRadius: '9px',
}
const inputStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: 'var(--text)',
  fontFamily: 'var(--font-secondary)',
  fontSize: '14px',
  flex: 1,
}
const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-primary)',
  fontWeight: 500,
  fontSize: '12px',
  color: 'var(--text-secondary)',
}

export function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const isRegister = mode === 'register'

  async function submit() {
    setError('')
    setNotice('')
    const mail = email.trim().toLowerCase()
    if (!/.+@.+\..+/.test(mail)) {
      setError('Informe um e-mail válido.')
      return
    }
    if (pass.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.')
      return
    }
    if (isRegister && pass !== pass2) {
      setError('As senhas não coincidem.')
      return
    }
    setBusy(true)
    try {
      if (isRegister) {
        const { needsConfirmation } = await signUp(mail, pass)
        if (needsConfirmation) {
          setNotice(
            'Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme e depois faça login.',
          )
          setMode('login')
          setPass('')
          setPass2('')
        }
      } else {
        await signIn(mail, pass)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') submit()
  }

  function toggleMode() {
    setMode((m) => (m === 'login' ? 'register' : 'login'))
    setError('')
    setNotice('')
    setPass('')
    setPass2('')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: 'linear-gradient(160deg,#0e0e0c 0%,#1A1A18 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          filter: 'blur(90px)',
          opacity: 0.11,
          background: '#E5484D',
          top: '-130px',
          left: '-110px',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '440px',
          height: '440px',
          borderRadius: '50%',
          filter: 'blur(90px)',
          opacity: 0.09,
          background: '#FF6369',
          bottom: '-120px',
          right: '-90px',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'relative',
          width: 'min(430px,92vw)',
          background: 'var(--surface-elevated)',
          border: '1px solid rgba(229,72,77,0.18)',
          borderRadius: '20px',
          padding: '38px 34px 28px',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
          animation: 'authCardIn 700ms cubic-bezier(0,0,0.2,1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '22px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '15px',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontFamily: 'var(--font-primary)',
              fontWeight: 700,
              fontSize: '18px',
              boxShadow: '0 6px 18px rgba(229,72,77,0.4)',
            }}
          >
            AP
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'var(--font-primary)',
                fontWeight: 600,
                fontSize: '20px',
                color: 'var(--text)',
              }}
            >
              {isRegister ? 'Criar acesso' : 'Entrar'}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: '12.5px',
                color: 'var(--text-muted)',
                marginTop: '5px',
                lineHeight: 1.5,
              }}
            >
              {isRegister
                ? 'Defina suas credenciais para proteger sua biblioteca.'
                : 'Acesse sua biblioteca de documentações.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
          <label style={labelStyle}>E-mail</label>
          <div style={inputWrap}>
            <Icon name="mail" size={19} style={{ color: 'var(--text-muted)' }} />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onKey}
              type="email"
              placeholder="voce@exemplo.com"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
          <label style={labelStyle}>Senha</label>
          <div style={inputWrap}>
            <Icon name="lock" size={19} style={{ color: 'var(--text-muted)' }} />
            <input
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={onKey}
              type="password"
              placeholder="Mínimo 6 caracteres"
              style={inputStyle}
            />
          </div>
        </div>

        {isRegister && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            <label style={labelStyle}>Confirmar senha</label>
            <div style={inputWrap}>
              <Icon name="lock_reset" size={19} style={{ color: 'var(--text-muted)' }} />
              <input
                value={pass2}
                onChange={(e) => setPass2(e.target.value)}
                onKeyDown={onKey}
                type="password"
                placeholder="Repita a senha"
                style={inputStyle}
              />
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '9px',
              background: 'rgba(220,53,69,0.12)',
              border: '1px solid rgba(220,53,69,0.35)',
              color: '#F87171',
              fontFamily: 'var(--font-secondary)',
              fontSize: '12.5px',
              marginBottom: '12px',
            }}
          >
            <Icon name="error" size={17} />
            {error}
          </div>
        )}

        {notice && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '9px',
              background: 'rgba(40,167,69,0.12)',
              border: '1px solid rgba(40,167,69,0.35)',
              color: '#4ADE80',
              fontFamily: 'var(--font-secondary)',
              fontSize: '12.5px',
              marginBottom: '12px',
            }}
          >
            <Icon name="mark_email_read" size={17} />
            {notice}
          </div>
        )}

        <Hoverable
          as="button"
          onClick={submit}
          disabled={busy}
          hoverStyle={busy ? undefined : uploadBtnHover}
          style={{
            width: '100%',
            height: '48px',
            borderRadius: '11px',
            border: 'none',
            cursor: busy ? 'wait' : 'pointer',
            background: 'var(--gradient-primary)',
            color: '#fff',
            fontFamily: 'var(--font-primary)',
            fontWeight: 700,
            fontSize: '14px',
            letterSpacing: '0.04em',
            boxShadow: '0 4px 16px rgba(229,72,77,0.35)',
            transition: 'transform 200ms var(--ease-standard),box-shadow 200ms',
            marginTop: '4px',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? 'Aguarde…' : isRegister ? 'Criar e entrar' : 'Entrar'}
        </Hoverable>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '18px',
            fontFamily: 'var(--font-secondary)',
            fontSize: '12.5px',
            color: 'var(--text-muted)',
          }}
        >
          <span>{isRegister ? 'Já tem uma conta?' : 'Ainda não tem acesso?'}</span>
          <button
            type="button"
            onClick={toggleMode}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--primary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontFamily: 'inherit',
              fontSize: 'inherit',
            }}
          >
            {isRegister ? 'Entrar' : 'Criar acesso'}
          </button>
        </div>

        <div
          style={{
            textAlign: 'center',
            marginTop: '14px',
            paddingTop: '14px',
            borderTop: '1px solid var(--border-light)',
            fontFamily: 'var(--font-secondary)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          <Icon name="shield" size={13} style={{ verticalAlign: '-2px' }} /> Autenticação segura via
          Supabase. Seus dados ficam protegidos por RLS.
        </div>
      </div>
    </div>
  )
}
