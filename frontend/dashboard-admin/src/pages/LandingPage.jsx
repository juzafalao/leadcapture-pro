import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '')

export default function LandingPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [marca, setMarca] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [gclid, setGclid] = useState('')
  const [fbclid, setFbclid] = useState('')
  const [formData, setFormData] = useState({
    nome: '', email: '', telefone: '', capital_disponivel: '', regiao: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Captura gclid e fbclid da URL do anúncio
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

          // Injeta Google Ads tag dinamicamente
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

          // Injeta Meta Pixel dinamicamente
          if (data.marca?.meta_pixel_id) {
            !function(f,b,e,v,n,t,s){
              if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)
            }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js')
            window.fbq('init', data.marca.meta_pixel_id)
            window.fbq('track', 'PageView')
          }

        } else {
          setError('Marca não encontrada')
        }
      } catch (err) {
        setError('Erro ao carregar marca')
      } finally {
        setLoading(false)
      }
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
          fbclid,
        })
      })

      if (res.ok) {
        // Dispara conversão Google Ads
        if (marca?.google_ads_conversion_id && marca?.google_ads_conversion_label && window.gtag) {
          window.gtag('event', 'conversion', {
            send_to: `${marca.google_ads_conversion_id}/${marca.google_ads_conversion_label}`,
          })
        }

        // Dispara evento Lead no Meta Pixel
        if (marca?.meta_pixel_id && window.fbq) {
          window.fbq('track', 'Lead')
        }

        setSuccess(true)
        setFormData({ nome: '', email: '', telefone: '', capital_disponivel: '', regiao: '' })
        setTimeout(() => setSuccess(false), 5000)
      } else {
        alert('Erro ao enviar. Tente novamente.')
      }
    } catch (err) {
      alert('Erro ao enviar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="text-6xl">⏳</motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-pink-900 to-purple-900 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-white mb-2">Ops!</h1>
          <p className="text-white/80 mb-6">{error}</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center mb-8 border border-white/20">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-8xl mb-4">
            {marca.emoji || '🏢'}
          </motion.div>
          <h1 className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">{marca.nome}</h1>
          <p className="text-2xl text-blue-200">Seja um franqueado de sucesso!</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-6">
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-3xl p-8 border border-green-300/20">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center"><span className="text-4xl mr-3">💰</span>Investimento</h2>
              <div className="space-y-4">
                <div className="bg-white/10 rounded-2xl p-6">
                  <p className="text-green-200 text-sm mb-1">A partir de:</p>
                  <p className="text-4xl font-bold text-white">R$ {(marca.invest_min || 0).toLocaleString('pt-BR')}</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-6">
                  <p className="text-blue-200 text-sm mb-1">Até:</p>
                  <p className="text-4xl font-bold text-white">R$ {(marca.invest_max || 0).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 space-y-4">
              {[
                { icon: '✅', text: 'Marca consolidada no mercado' },
                { icon: '📈', text: 'Alto potencial de retorno' },
                { icon: '🎯', text: 'Suporte completo ao franqueado' },
                { icon: '🚀', text: 'Sistema de gestão moderno' }
              ].map((item, i) => (
                <motion.div key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center space-x-4 bg-white/5 rounded-2xl p-4">
                  <span className="text-3xl">{item.icon}</span>
                  <p className="text-white text-lg">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center"><span className="text-4xl mr-3">📝</span>Quero ser franqueado!</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Nome completo *</label>
                <input type="text" required value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Email *</label>
                <input type="email" required value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Telefone/WhatsApp *</label>
                <input type="tel" required value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Capital disponível *</label>
                <select required value={formData.capital_disponivel}
                  onChange={(e) => setFormData({ ...formData, capital_disponivel: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">Selecione...</option>
                  <option value="ate-100k">Até R$ 100 mil</option>
                  <option value="100k-300k">R$ 100 mil - R$ 300 mil</option>
                  <option value="300k-500k">R$ 300 mil - R$ 500 mil</option>
                  <option value="acima-500k">Acima de R$ 500 mil</option>
                </select>
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Estado *</label>
                <select required value={formData.regiao}
                  onChange={(e) => setFormData({ ...formData, regiao: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-blue-400">
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
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" disabled={submitting}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transition-all shadow-xl">
                {submitting ? '⏳ Enviando...' : '🚀 QUERO SER FRANQUEADO!'}
              </motion.button>
            </form>
            {success && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="mt-4 p-4 bg-green-500/20 border border-green-300/50 rounded-xl text-green-200 text-center font-semibold">
                ✅ Cadastro enviado com sucesso! Em breve entraremos em contato.
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}