import './App.css'
import { useEffect, useState } from 'react'
import { AuthPage } from './components/AuthPage'
import { PolicyInputForm } from './components/PolicyInputForm'

function App() {
  const [token, setToken] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    const t = localStorage.getItem('bi_token') || ''
    const e = localStorage.getItem('bi_email') || ''
    setToken(t)
    setUserEmail(e)
  }, [])

  function logout() {
    localStorage.removeItem('bi_token')
    localStorage.removeItem('bi_email')
    setToken('')
    setUserEmail('')
  }

  return (
    <div className="appShell">
      <div className="container">
        <div className="topbar">
          <div className="brand">
            <div className="brandTitle">Benefit Illustration</div>
            <div className="brandSub">Secure JWT auth · PII masking · Projection table</div>
          </div>
          {token ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className="pill">{userEmail}</div>
              <button className="btn btnGhost" onClick={logout}>
                Logout
              </button>
            </div>
          ) : (
            <div className="pill">Login required</div>
          )}
        </div>

        <div style={{ height: 14 }} />

        {!token ? (
          <AuthPage
            onAuthed={({ token: t, user }) => {
              localStorage.setItem('bi_token', t)
              localStorage.setItem('bi_email', user.email)
              setToken(t)
              setUserEmail(user.email)
            }}
          />
        ) : (
          <PolicyInputForm token={token} />
        )}
      </div>
    </div>
  )
}

export default App
