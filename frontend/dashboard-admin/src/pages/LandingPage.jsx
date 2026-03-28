import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '')

function Bubble({ style }) {
  return <div className="bubble" style={style} />
}

export default function LandingPage() {
  const { slug } = useParams()
  const [marca, setMarca] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [gclid, setGclid] = useState('')
  const [fbclid, setFbclid] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '', capital_disponivel: '', regiao: '' })
  const [focused, setFocused] = useState(null)
  const heroRef = useRef(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setGclid(params.get('gclid') || '')
    setFbclid(params.get('fbclid') || '')
  }, [])

  useEffect(() => {
    async function fetchMarca() {
      try {
        const res = await fetch(`${API_URL}/api/marcas/slug/${slug}`)
        const data = await res.json()
        if (data.success) {
          setMarca(data.marca)
          if (data.marca?.google_ads_conversion_id) {
            const s = document.createElement('script')
            s.src = `https://www.googletagmanager.com/gtag/js?id=${data.marca.google_ads_conversion_id}`
            s.async = true
            document.head.appendChild(s)
            window.dataLayer = window.dataLayer || []
            window.gtag = function () { window.dataLayer.push(arguments) }
            window.gtag('js', new Date())
            window.gtag('config', data.marca.google_ads_conversion_id)
          }
          if (data.marca?.meta_pixel_id) {
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js')
            window.fbq('init', data.marca.meta_pixel_id)
            window.fbq('track', 'PageView')
          }
        } else { setError('Marca não encontrada') }
      } catch { setError('Erro ao carregar') }
      finally { setLoading(false) }
    }
    fetchMarca()
  }, [slug])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          marca_id: marca.id,
          tenant_id: marca.tenant_id,
          fonte: 'landing-page-react',
          gclid,
          fbclid
        })
      })
      if (res.ok) {
        if (marca?.google_ads_conversion_id && marca?.google_ads_conversion_label && window.gtag)
          window.gtag('event', 'conversion', { send_to: `${marca.google_ads_conversion_id}/${marca.google_ads_conversion_label}` })
        if (marca?.meta_pixel_id && window.fbq)
          window.fbq('track', 'Lead')
        setSuccess(true)
        setFormData({ nome: '', email: '', telefone: '', capital_disponivel: '', regiao: '' })
      } else { alert('Erro ao enviar. Tente novamente.') }
    } catch { alert('Erro ao enviar. Tente novamente.') }
    finally { setSubmitting(false) }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div className="spin-loader" />
        <p style={{ color: '#f97316', fontFamily: 'Barlow, sans-serif', letterSpacing: 4, fontSize: 11, textTransform: 'uppercase' }}>Carregando</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#f97316', fontFamily: 'Barlow, sans-serif', fontSize: 18 }}>❌ {error}</p>
    </div>
  )

  const bubbles = Array.from({ length: 12 }, (_, i) => ({
    width: `${Math.random() * 60 + 20}px`,
    height: `${Math.random() * 60 + 20}px`,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 8}s`,
    animationDuration: `${Math.random() * 6 + 6}s`,
    opacity: Math.random() * 0.15 + 0.05,
  }))

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }

        .lp-root { min-height: 100vh; background: #0a0a0a; font-family: 'Barlow', sans-serif; color: #fff; overflow-x: hidden; }

        .hero { position: relative; min-height: 100vh; display: flex; align-items: center; overflow: hidden; padding: 40px 24px 80px; }
        .hero-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 60% 40%, rgba(249,115,22,0.18) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 20% 80%, rgba(249,115,22,0.08) 0%, transparent 60%), #0a0a0a; }
        .hero-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(249,115,22,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.04) 1px, transparent 1px); background-size: 60px 60px; }
        .hero-glow { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%); right: -100px; top: -100px; pointer-events: none; }

        .bubble { position: absolute; border-radius: 50%; background: radial-gradient(circle at 30% 30%, rgba(249,115,22,0.6), rgba(249,115,22,0.1)); border: 1px solid rgba(249,115,22,0.3); animation: floatUp linear infinite; bottom: -100px; }
        @keyframes floatUp { 0% { transform: translateY(0) scale(1); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 0.5; } 100% { transform: translateY(-110vh) scale(0.5); opacity: 0; } }

        .hero-inner { position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        @media (max-width: 768px) { .hero-inner { grid-template-columns: 1fr; gap: 40px; } .hero-right { order: -1; } }

        .badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(249,115,22,0.12); border: 1px solid rgba(249,115,22,0.35); border-radius: 100px; padding: 6px 16px; font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #f97316; margin-bottom: 24px; }
        .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #f97316; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.5); } }

        .headline { font-family: 'Barlow Condensed', sans-serif; font-size: clamp(52px, 8vw, 90px); font-weight: 900; line-height: 0.9; text-transform: uppercase; margin-bottom: 24px; }
        .headline-white { color: #fff; display: block; }
        .headline-orange { color: #f97316; display: block; text-shadow: 0 0 40px rgba(249,115,22,0.5); }
        .headline-outline { display: block; color: transparent; -webkit-text-stroke: 2px rgba(255,255,255,0.2); }

        .sub { font-size: 17px; line-height: 1.6; color: rgba(255,255,255,0.55); margin-bottom: 36px; max-width: 480px; font-weight: 400; }

        .stats { display: flex; gap: 32px; margin-bottom: 40px; flex-wrap: wrap; }
        .stat-item { display: flex; flex-direction: column; }
        .stat-num { font-family: 'Barlow Condensed', sans-serif; font-size: 36px; font-weight: 900; color: #f97316; line-height: 1; }
        .stat-label { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.35); }
        .stat-divider { width: 1px; background: rgba(255,255,255,0.1); align-self: stretch; }

        .cta-btn { display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #f97316, #ea580c); color: #fff; border: none; border-radius: 4px; padding: 18px 36px; font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: all 0.2s; box-shadow: 0 8px 32px rgba(249,115,22,0.35); text-decoration: none; }
        .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(249,115,22,0.5); }
        .cta-arrow { font-size: 20px; transition: transform 0.2s; }
        .cta-btn:hover .cta-arrow { transform: translateX(4px); }

        .hero-right { display: flex; flex-direction: column; align-items: center; gap: 32px; }
        .logo-container { position: relative; width: 320px; height: 320px; display: flex; align-items: center; justify-content: center; }
        .logo-ring { position: absolute; inset: 0; border-radius: 50%; border: 1px solid rgba(249,115,22,0.2); animation: rotateSlow 20s linear infinite; }
        .logo-ring::before { content: ''; position: absolute; width: 10px; height: 10px; background: #f97316; border-radius: 50%; top: -5px; left: 50%; transform: translateX(-50%); box-shadow: 0 0 12px #f97316; }
        .logo-ring-2 { position: absolute; inset: 20px; border-radius: 50%; border: 1px dashed rgba(249,115,22,0.12); animation: rotateSlow 30s linear infinite reverse; }
        @keyframes rotateSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .logo-glow-bg { position: absolute; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%); }
        .logo-img { position: relative; z-index: 2; width: 220px; height: 220px; object-fit: contain; filter: drop-shadow(0 0 24px rgba(249,115,22,0.4)); animation: breathe 4s ease-in-out infinite; }
        @keyframes breathe { 0%, 100% { transform: scale(1); filter: drop-shadow(0 0 24px rgba(249,115,22,0.4)); } 50% { transform: scale(1.03); filter: drop-shadow(0 0 40px rgba(249,115,22,0.6)); } }

        .invest-badge { background: rgba(249,115,22,0.08); border: 1px solid rgba(249,115,22,0.25); border-radius: 12px; padding: 20px 32px; text-align: center; }
        .invest-label { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 4px; }
        .invest-range { font-family: 'Barlow Condensed', sans-serif; font-size: 28px; font-weight: 900; color: #f97316; }

        .benefits { background: #0f0f0f; border-top: 1px solid rgba(249,115,22,0.1); border-bottom: 1px solid rgba(249,115,22,0.1); padding: 80px 24px; }
        .benefits-inner { max-width: 1200px; margin: 0 auto; }
        .section-label { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 5px; text-transform: uppercase; color: #f97316; margin-bottom: 16px; }
        .section-title { font-family: 'Barlow Condensed', sans-serif; font-size: clamp(36px, 5vw, 60px); font-weight: 900; text-transform: uppercase; color: #fff; margin-bottom: 48px; line-height: 1; }
        .section-title span { color: #f97316; }
        .benefits-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 2px; background: rgba(249,115,22,0.08); border: 1px solid rgba(249,115,22,0.1); }
        .benefit-card { background: #0f0f0f; padding: 36px 28px; transition: background 0.2s; }
        .benefit-card:hover { background: rgba(249,115,22,0.05); }
        .benefit-icon { font-size: 32px; margin-bottom: 16px; display: block; }
        .benefit-title { font-family: 'Barlow Condensed', sans-serif; font-size: 22px; font-weight: 800; text-transform: uppercase; color: #fff; margin-bottom: 8px; }
        .benefit-desc { font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.45); }

        .form-section { padding: 100px 24px; background: linear-gradient(180deg, #0a0a0a 0%, #0d0d0d 100%); position: relative; }
        .form-section::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(249,115,22,0.06) 0%, transparent 70%); pointer-events: none; }
        .form-inner { max-width: 640px; margin: 0 auto; position: relative; z-index: 1; }
        .form-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(249,115,22,0.2); border-radius: 2px; overflow: hidden; }
        .form-header { background: linear-gradient(135deg, #f97316, #ea580c); padding: 28px 36px; }
        .form-header-title { font-family: 'Barlow Condensed', sans-serif; font-size: 32px; font-weight: 900; text-transform: uppercase; color: #fff; line-height: 1; }
        .form-header-sub { font-size: 13px; color: rgba(255,255,255,0.8); margin-top: 4px; }
        .form-body { padding: 36px; }

        .field-group { margin-bottom: 16px; }
        .field-label { display: block; font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 8px; }
        .field-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 2px; padding: 14px 16px; color: #fff; font-family: 'Barlow', sans-serif; font-size: 15px; outline: none; transition: all 0.2s; appearance: none; }
        .field-input::placeholder { color: rgba(255,255,255,0.2); }
        .field-input:focus, .field-input.active { border-color: #f97316; background: rgba(249,115,22,0.06); box-shadow: 0 0 0 3px rgba(249,115,22,0.1); }
        .field-input option { background: #1a1a1a; color: #fff; }

        .submit-btn { width: 100%; background: linear-gradient(135deg, #f97316, #ea580c); border: none; border-radius: 2px; padding: 18px; color: #fff; font-family: 'Barlow Condensed', sans-serif; font-size: 20px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; cursor: pointer; transition: all 0.2s; margin-top: 8px; box-shadow: 0 8px 32px rgba(249,115,22,0.3); }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(249,115,22,0.45); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .form-trust { display: flex; align-items: center; gap: 8px; justify-content: center; margin-top: 16px; font-size: 12px; color: rgba(255,255,255,0.25); }

        .success-overlay { text-align: center; padding: 48px 36px; }
        .success-icon { font-size: 64px; margin-bottom: 16px; display: block; animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes pop { from { transform: scale(0); } to { transform: scale(1); } }
        .success-title { font-family: 'Barlow Condensed', sans-serif; font-size: 40px; font-weight: 900; text-transform: uppercase; color: #f97316; margin-bottom: 12px; }
        .success-sub { font-size: 15px; color: rgba(255,255,255,0.5); line-height: 1.6; }

        .footer { border-top: 1px solid rgba(249,115,22,0.08); padding: 32px 24px; text-align: center; background: #080808; }
        .footer-text { font-size: 12px; color: rgba(255,255,255,0.2); letter-spacing: 1px; }
        .footer-brand { color: #f97316; font-weight: 600; }

        .spin-loader { width: 40px; height: 40px; border: 3px solid rgba(249,115,22,0.2); border-top-color: #f97316; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="lp-root">

        <section className="hero" ref={heroRef}>
          <div className="hero-bg" />
          <div className="hero-grid" />
          <div className="hero-glow" />
          {bubbles.map((s, i) => <Bubble key={i} style={s} />)}

          <div className="hero-inner">
            <div>
              <div className="badge"><span className="badge-dot" />Oportunidade de franquia</div>
              <h1 className="headline">
                <span className="headline-outline">Lavanderia</span>
                <span className="headline-orange">Express</span>
                <span className="headline-white">do futuro</span>
              </h1>
              <p className="sub">Seja dono de uma das franquias que mais crescem no Brasil. Suporte completo, tecnologia de ponta e retorno rápido.</p>
              <div className="stats">
                <div className="stat-item"><span className="stat-num">+200</span><span className="stat-label">Unidades</span></div>
                <div className="stat-divider" />
                <div className="stat-item"><span className="stat-num">18m</span><span className="stat-label">Payback</span></div>
                <div className="stat-divider" />
                <div className="stat-item"><span className="stat-num">92%</span><span className="stat-label">Satisfação</span></div>
              </div>
              <a href="#formulario" className="cta-btn">Quero ser franqueado <span className="cta-arrow">→</span></a>
            </div>

            <div className="hero-right">
              <div className="logo-container">
                <div className="logo-ring" />
                <div className="logo-ring-2" />
                <div className="logo-glow-bg" />
                {marca?.logo_url
                  ? <img src={marca.logo_url} alt={marca.nome} className="logo-img" />
                  : <span style={{ fontSize: 120, filter: 'drop-shadow(0 0 24px rgba(249,115,22,0.6))', position: 'relative', zIndex: 2 }}>🧺</span>
                }
              </div>
              <div className="invest-badge">
                <div className="invest-label">Investimento inicial</div>
                <div className="invest-range">R$ {Number(marca?.invest_min || 80000).toLocaleString('pt-BR')} — R$ {Number(marca?.invest_max || 200000).toLocaleString('pt-BR')}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="benefits">
          <div className="benefits-inner">
            <div className="section-label">Por que a Lava Lava?</div>
            <h2 className="section-title">Vantagens que <span>ninguém</span> oferece</h2>
            <div className="benefits-grid">
              {[
                { icon: '⚡', title: 'Operação Rápida', desc: 'Modelo enxuto e escalável, com processos 100% padronizados.' },
                { icon: '🏆', title: 'Marca Forte', desc: 'Reconhecida em todo o Brasil com campanhas nacionais e presença digital.' },
                { icon: '📊', title: 'Gestão Digital', desc: 'Controle total da sua operação em tempo real pelo nosso sistema.' },
                { icon: '🤝', title: 'Suporte Total', desc: 'Time dedicado de consultores em todas as etapas do negócio.' },
                { icon: '📍', title: 'Território Exclusivo', desc: 'Garantia de exclusividade na sua região, sem concorrência interna.' },
                { icon: '💰', title: 'Retorno Rápido', desc: 'Payback médio de 18 meses com margens acima da média do setor.' },
              ].map((b, i) => (
                <div key={i} className="benefit-card">
                  <span className="benefit-icon">{b.icon}</span>
                  <div className="benefit-title">{b.title}</div>
                  <div className="benefit-desc">{b.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="form-section" id="formulario">
          <div className="form-inner">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="section-label">Próximo passo</div>
              <h2 className="section-title">Comece <span>agora</span></h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, maxWidth: 400, margin: '0 auto' }}>Preencha e nosso consultor entra em contato em até 24h.</p>
            </div>
            <div className="form-card">
              <div className="form-header">
                <div className="form-header-title">Seja um franqueado 🧺</div>
                <div className="form-header-sub">Sem compromisso — só uma conversa</div>
              </div>
              {success ? (
                <div className="success-overlay">
                  <span className="success-icon">✅</span>
                  <div className="success-title">Recebemos!</div>
                  <p className="success-sub">Em breve nosso consultor vai entrar em contato. Fique de olho no WhatsApp e e-mail!</p>
                </div>
              ) : (
                <div className="form-body">
                  <form onSubmit={handleSubmit}>
                    {[
                      { key: 'nome', label: 'Nome completo', type: 'text', placeholder: 'Seu nome' },
                      { key: 'email', label: 'E-mail', type: 'email', placeholder: 'seu@email.com' },
                      { key: 'telefone', label: 'WhatsApp', type: 'tel', placeholder: '(11) 99999-9999' },
                    ].map(f => (
                      <div key={f.key} className="field-group">
                        <label className="field-label">{f.label}</label>
                        <input type={f.type} required placeholder={f.placeholder} value={formData[f.key]}
                          className={`field-input${focused === f.key ? ' active' : ''}`}
                          onFocus={() => setFocused(f.key)} onBlur={() => setFocused(null)}
                          onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} />
                      </div>
                    ))}
                    <div className="field-group">
                      <label className="field-label">Capital disponível</label>
                      <select required value={formData.capital_disponivel}
                        className={`field-input${focused === 'capital' ? ' active' : ''}`}
                        onFocus={() => setFocused('capital')} onBlur={() => setFocused(null)}
                        onChange={e => setFormData({ ...formData, capital_disponivel: e.target.value })}>
                        <option value="">Selecione...</option>
                        <option value="ate-100k">Até R$ 100 mil</option>
                        <option value="100k-300k">R$ 100 mil — R$ 300 mil</option>
                        <option value="300k-500k">R$ 300 mil — R$ 500 mil</option>
                        <option value="acima-500k">Acima de R$ 500 mil</option>
                      </select>
                    </div>
                    <div className="field-group">
                      <label className="field-label">Estado de interesse</label>
                      <select required value={formData.regiao}
                        className={`field-input${focused === 'regiao' ? ' active' : ''}`}
                        onFocus={() => setFocused('regiao')} onBlur={() => setFocused(null)}
                        onChange={e => setFormData({ ...formData, regiao: e.target.value })}>
                        <option value="">Selecione...</option>
                        <option value="SP">São Paulo</option>
                        <option value="RJ">Rio de Janeiro</option>
                        <option value="MG">Minas Gerais</option>
                        <option value="RS">Rio Grande do Sul</option>
                        <option value="PR">Paraná</option>
                        <option value="SC">Santa Catarina</option>
                        <option value="BA">Bahia</option>
                        <option value="outro">Outro estado</option>
                      </select>
                    </div>
                    <button type="submit" className="submit-btn" disabled={submitting}>
                      {submitting ? 'Enviando...' : 'Quero ser franqueado →'}
                    </button>
                    <div className="form-trust">🔒 Seus dados estão protegidos. Sem spam.</div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </section>

        <footer className="footer">
          <p className="footer-text">{marca?.nome || 'Lava Lava'} · Tecnologia por <span className="footer-brand">LeadCapture Pro</span> · Zafalão Tech</p>
        </footer>

      </div>
    </>
  )
}