import React, { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function calcExpr(expr) {
  try {
    const safe = expr.replace(/[^0-9+\-*/.()%]/g, '')
    if (!safe) return '0'
    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + safe + ')')()
    if (!isFinite(result)) return 'Erro'
    return String(parseFloat(result.toPrecision(12)))
  } catch {
    return 'Erro'
  }
}

function fmtDisp(v) {
  if (v === 'Erro') return v
  const n = parseFloat(v)
  if (isNaN(n)) return v
  if (v.includes('.')) {
    const [int, dec] = v.split('.')
    return parseInt(int, 10).toLocaleString('pt-BR') + ',' + dec
  }
  return n.toLocaleString('pt-BR')
}

export default function FloatingCalculator() {
  const [open, setOpen]       = useState(false)
  const [expr, setExpr]       = useState('')
  const [disp, setDisp]       = useState('0')
  const [prevExpr, setPrevExpr] = useState('')
  const [fresh, setFresh]     = useState(true)
  const panelRef = useRef(null)

  const press = useCallback((val) => {
    if (val === 'C') {
      setExpr(''); setDisp('0'); setPrevExpr(''); setFresh(true); return
    }
    if (val === 'CE') {
      setExpr(e => { const s = e.slice(0, -1); setDisp(s || '0'); return s })
      setFresh(false); return
    }
    if (val === '⌫') {
      setExpr(e => { const s = e.slice(0, -1); setDisp(s || '0'); return s })
      setFresh(false); return
    }
    if (val === '=') {
      if (!expr) return
      const result = calcExpr(expr)
      setPrevExpr(expr + ' =')
      setDisp(result)
      setExpr(result === 'Erro' ? '' : result)
      setFresh(true)
      return
    }
    if (val === '%') {
      const n = parseFloat(expr || '0')
      const r = String(n / 100)
      setExpr(r); setDisp(r); setFresh(true); return
    }
    if (val === '+/-') {
      setExpr(e => {
        const n = parseFloat(e || '0')
        const r = String(-n)
        setDisp(r)
        return r
      })
      setFresh(false); return
    }
    const isOp = ['+', '-', '*', '/'].includes(val)
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
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const map = {
        'Enter': '=',
        'Backspace': '⌫',
        'Delete': 'CE',
        'Escape': 'C',
      }
      const k = map[e.key] || (e.key.match(/^[0-9+\-*/.%]$/) ? e.key : null)
      if (k) { e.preventDefault(); press(k) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, press])

  // Layout Windows Calculator style
  // Row 1: % CE C ⌫
  // Row 2: 7  8  9  /
  // Row 3: 4  5  6  *
  // Row 4: 1  2  3  -
  // Row 5: +/- 0  .  +
  // Row 6: (empty) (empty) (empty) =  (= spans 2 rows vertically — not easily doable in CSS grid, so = is tall on last rows)
  // Actually Windows Calc = spans row 5+6 on the right. Let's use a simpler approach:
  // Row 1: % CE C ⌫
  // Row 2: 7 8 9 /
  // Row 3: 4 5 6 *
  // Row 4: 1 2 3 -
  // Row 5: +/- 0 . +
  // Row 6 (special): [=] spanning full width or just in row 5 large

  const rows = [
    [['%','fn'], ['CE','fn'], ['C','fn'], ['⌫','fn']],
    [['7','num'], ['8','num'], ['9','num'], ['/','op']],
    [['4','num'], ['5','num'], ['6','num'], ['*','op']],
    [['1','num'], ['2','num'], ['3','num'], ['-','op']],
    [['+/-','fn'], ['0','num'], ['.','num'], ['+','op']],
  ]

  const btnBase = 'h-12 rounded-lg text-sm transition-all duration-100 select-none active:scale-95 focus:outline-none'
  const styles = {
    fn:  `${btnBase} bg-white/[0.07] hover:bg-white/[0.13] text-[#94A3B8] font-semibold`,
    op:  `${btnBase} bg-[#1E293B] hover:bg-[#273549] text-[#10B981] font-bold`,
    num: `${btnBase} bg-white/[0.04] hover:bg-white/[0.09] text-white font-semibold`,
    eq:  `${btnBase} bg-[#10B981] hover:bg-[#0D9E6E] active:bg-[#059669] text-white font-black text-lg shadow-lg shadow-[#10B981]/30`,
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className={`fixed bottom-6 right-24 z-50 w-14 h-14 rounded-full shadow-lg
          flex items-center justify-center transition-all
          ${open
            ? 'bg-gradient-to-br from-[#10B981] to-[#059669] shadow-[#10B981]/40'
            : 'bg-[#0F172A] border border-white/10 hover:border-[#10B981]/40 shadow-black/40'
          }`}
        title="Calculadora (Alt+C)"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
          className={open ? 'text-black' : 'text-[#10B981]'}>
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <circle cx="8"  cy="11" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="12" cy="11" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="16" cy="11" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="8"  cy="15" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="12" cy="15" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="16" cy="15" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="8"  cy="19" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="12" cy="19" r="0.8" fill="currentColor" stroke="none" />
          <circle cx="16" cy="19" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="fixed bottom-24 right-24 z-50 w-[268px] rounded-2xl bg-[#0B1220] border border-white/[0.08] shadow-2xl shadow-black/70 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <span className="text-[10px] text-white/30 font-semibold uppercase tracking-widest">Calculadora</span>
              <button onClick={() => setOpen(false)} className="text-white/20 hover:text-white/60 transition-colors text-lg leading-none">×</button>
            </div>

            {/* Display */}
            <div className="px-4 pb-3">
              <p className="text-[11px] text-white/30 text-right h-4 truncate font-mono">{prevExpr || ' '}</p>
              <p className="text-[32px] font-black text-white text-right mt-0.5 truncate tracking-tight leading-tight">
                {fmtDisp(disp)}
              </p>
            </div>

            {/* Grid */}
            <div className="px-3 pb-3 grid grid-cols-4 gap-1.5">
              {rows.map((row, ri) =>
                row.map(([val, type]) => (
                  <motion.button
                    key={`${ri}-${val}`}
                    whileTap={{ scale: 0.91 }}
                    onClick={() => press(val)}
                    className={styles[type]}
                  >
                    {val}
                  </motion.button>
                ))
              )}
              {/* = button spanning full width */}
              <motion.button
                whileTap={{ scale: 0.91 }}
                onClick={() => press('=')}
                className={`col-span-4 h-12 rounded-xl text-lg font-black transition-all duration-100 select-none
                  bg-[#10B981] hover:bg-[#0D9E6E] active:bg-[#059669] text-white shadow-lg shadow-[#10B981]/25`}
              >
                =
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
