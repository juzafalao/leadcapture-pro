import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function calc(expr) {
  try {
    const safe = expr.replace(/[^0-9+\-*/.()%]/g, '')
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + safe + ')')()
    if (!isFinite(result)) return 'Erro'
    const rounded = parseFloat(result.toPrecision(12))
    return String(rounded)
  } catch {
    return 'Erro'
  }
}

const BTN = {
  fn:  'bg-white/[0.08] hover:bg-white/[0.14] text-[#10B981] font-black',
  op:  'bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] font-black',
  eq:  'bg-[#10B981] hover:bg-[#059669] text-black font-black col-span-1',
  num: 'bg-white/[0.05] hover:bg-white/[0.10] text-white font-bold',
  zero:'bg-white/[0.05] hover:bg-white/[0.10] text-white font-bold col-span-2',
}

export default function FloatingCalculator() {
  const [open, setOpen]   = useState(false)
  const [expr, setExpr]   = useState('')
  const [disp, setDisp]   = useState('0')
  const [fresh, setFresh] = useState(true)

  const press = useCallback((val) => {
    if (val === 'C') {
      setExpr(''); setDisp('0'); setFresh(true); return
    }
    if (val === 'CE') {
      setExpr(e => { const s = e.slice(0, -1); setDisp(s || '0'); return s })
      setFresh(false); return
    }
    if (val === '=') {
      const result = calc(expr)
      setDisp(result)
      setExpr(result === 'Erro' ? '' : result)
      setFresh(true)
      return
    }
    const isOp = ['+','-','*','/','%'].includes(val)
    setExpr(e => {
      const next = (fresh && !isOp) ? val : e + val
      setDisp(next || '0')
      return next
    })
    setFresh(false)
  }, [expr, fresh])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      const map = { Enter: '=', Backspace: 'CE', Escape: 'C' }
      const k = map[e.key] || (e.key.match(/^[0-9+\-*/.%]$/) ? e.key : null)
      if (k) { e.preventDefault(); press(k) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, press])

  const fmtDisp = (v) => {
    if (v === 'Erro') return v
    const n = parseFloat(v)
    if (isNaN(n)) return v
    if (v.includes('.')) return v
    return n.toLocaleString('pt-BR')
  }

  const rows = [
    [['C','fn'],   ['+/-','fn'], ['%','fn'], ['/','op']],
    [['7','num'],  ['8','num'],  ['9','num'], ['*','op']],
    [['4','num'],  ['5','num'],  ['6','num'], ['-','op']],
    [['1','num'],  ['2','num'],  ['3','num'], ['+','op']],
    [['0','zero'],              ['.','num'],  ['=','eq']],
  ]

  return (
    <>
      {/* Botão flutuante */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className={`fixed bottom-6 right-24 z-50 w-14 h-14 rounded-full shadow-lg
          flex items-center justify-center transition-all
          ${open
            ? 'bg-gradient-to-br from-[#10B981] to-[#059669] shadow-[#10B981]/30'
            : 'bg-[#0F172A] border border-white/10 hover:border-[#10B981]/40 shadow-black/40'
          }`}
        title="Calculadora"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
          className={open ? 'text-black' : 'text-[#10B981]'}>
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="10" x2="8" y2="10" strokeWidth="2.5" />
          <line x1="12" y1="10" x2="12" y2="10" strokeWidth="2.5" />
          <line x1="16" y1="10" x2="16" y2="10" strokeWidth="2.5" />
          <line x1="8" y1="14" x2="8" y2="14" strokeWidth="2.5" />
          <line x1="12" y1="14" x2="12" y2="14" strokeWidth="2.5" />
          <line x1="16" y1="14" x2="16" y2="14" strokeWidth="2.5" />
          <line x1="8" y1="18" x2="8" y2="18" strokeWidth="2.5" />
          <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2.5" />
          <line x1="16" y1="18" x2="16" y2="18" strokeWidth="2.5" />
        </svg>
      </motion.button>

      {/* Painel da calculadora */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed bottom-24 right-24 z-50 w-[260px] rounded-3xl bg-[#0B1220] border border-white/[0.08] shadow-2xl shadow-black/60 overflow-hidden"
          >
            {/* Display */}
            <div className="px-4 pt-5 pb-3">
              <p className="text-[10px] text-gray-600 text-right h-4 truncate">{expr || ' '}</p>
              <p className="text-3xl font-black text-white text-right mt-1 truncate tracking-tight">
                {fmtDisp(disp)}
              </p>
            </div>

            {/* Botões */}
            <div className="p-3 grid grid-cols-4 gap-1.5">
              {rows.map((row, ri) =>
                row.map(([val, type]) => (
                  <motion.button
                    key={`${ri}-${val}`}
                    whileTap={{ scale: 0.88 }}
                    onClick={() => press(val === '+/-' ? (disp.startsWith('-') ? disp.slice(1) : '-' + disp) : val)}
                    className={`h-14 rounded-2xl text-sm transition-colors ${BTN[type]}`}
                  >
                    {val === 'CE' ? '⌫' : val}
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
