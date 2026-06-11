'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useAnimation } from 'framer-motion'
import { CalendarDays, Wifi, LogOut } from 'lucide-react'

interface HeaderProps {
  semanaAtual: string
  produto: string
  lastUpdated?: Date | null
}

export default function Header({ semanaAtual, produto, lastUpdated }: HeaderProps) {
  const router = useRouter()
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  // Refresh burst — fires once per data update, skips the initial mount
  const refreshRing = useAnimation()
  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return }
    if (!lastUpdated) return
    refreshRing.start({
      scale: [1, 3.2, 1],
      opacity: [0.7, 0, 0],
      transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
    })
  }, [lastUpdated, refreshRing])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <header
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #5c2004 0%, #9c3a08 35%, #d4601a 70%, #f37021 100%)',
        boxShadow: '0 4px 16px rgba(243,112,33,0.30)',
      }}
    >
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        {/* Brand */}
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-accoelho-white.png"
            alt="AC Coelho"
            className="h-9 w-auto"
            style={{ opacity: 0.92 }}
          />
          <div className="hidden sm:block w-px h-7 bg-white/15" />
          <p className="hidden sm:block text-white/65 text-[11px] font-medium tracking-wide leading-none">
            Dashboard de Performance
          </p>
        </motion.div>

        {/* Center product tag */}
        <motion.div
          className="hidden md:flex items-center gap-2"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {produto !== 'Todos' && (
            <span className="text-xs font-semibold bg-white/10 border border-white/15 text-white/80 px-3 py-1 rounded-full">
              {produto}
            </span>
          )}
        </motion.div>

        {/* Right info */}
        <motion.div
          className="flex items-center gap-5"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Date / time */}
          <div className="hidden sm:flex items-center gap-1.5 text-white/65 text-[11px]">
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="capitalize">{hoje} · {hora}</span>
          </div>

          {/* Live status */}
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">

              {/* Dot container — sonar + refresh rings */}
              <span className="relative flex items-center justify-center w-3.5 h-3.5">

                {/* Continuous sonar ring */}
                <motion.span
                  className="absolute inset-0 rounded-full bg-emerald-400"
                  animate={{ scale: [1, 2.6], opacity: [0.4, 0] }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    repeatDelay: 1.0,
                  }}
                />

                {/* Refresh burst ring (imperative, fires on data update) */}
                <motion.span
                  className="absolute inset-0 rounded-full bg-emerald-300"
                  animate={refreshRing}
                  style={{ scale: 1, opacity: 0 }}
                />

                {/* Solid inner dot with static glow */}
                <span
                  className="relative z-10 block w-1.5 h-1.5 rounded-full bg-emerald-400"
                  style={{
                    boxShadow: '0 0 0 1.5px rgba(52,211,153,0.25), 0 0 7px rgba(52,211,153,0.45)',
                  }}
                />
              </span>

              <span className="text-[11px] text-white/70 font-medium">Ao vivo</span>
            </div>
            <p className="text-white font-bold text-base leading-tight">{semanaAtual}</p>
          </div>

          {/* WiFi — slow opacity breathe, signals active connection */}
          <motion.div
            className="hidden lg:flex items-center gap-1"
            animate={{ opacity: [0.28, 0.52, 0.28] }}
            transition={{
              duration: 3.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ color: 'rgba(255,255,255,1)' }}
          >
            <Wifi className="w-3.5 h-3.5" />
          </motion.div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/15 transition-all text-[11px] font-medium"
            title="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </motion.div>
      </div>
    </header>
  )
}
