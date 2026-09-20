import { useCallback, useEffect, useMemo, useState } from 'react'
import TypingArea from './TypingArea.tsx'
import { useTypingTest } from './useTypingTest.ts'
import type { Language } from './words.ts'

const DURATIONS = [15, 30, 60] as const
const PORTFOLIO_URL = 'https://dynamic-aayush38.netlify.app'

interface Best {
  [key: string]: number
}

function loadBest(): Best {
  try {
    return JSON.parse(localStorage.getItem('typing-test-best') ?? '{}') as Best
  } catch {
    return {}
  }
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-yellow-400 text-zinc-950 shadow-[0_0_20px_-4px_rgba(250,204,21,0.6)]'
          : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
      }`}
    >
      {children}
    </button>
  )
}

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('aurora-type-lang')
    return saved === 'en' || saved === 'ne' ? saved : 'ne'
  })
  const [duration, setDuration] = useState<number>(() => {
    const saved = Number(localStorage.getItem('aurora-type-duration'))
    return saved === 15 || saved === 30 || saved === 60 ? saved : 30
  })
  const t = useTypingTest(lang, duration)
  const [best, setBest] = useState<Best>(loadBest)

  useEffect(() => {
    localStorage.setItem('aurora-type-lang', lang)
  }, [lang])

  useEffect(() => {
    localStorage.setItem('aurora-type-duration', String(duration))
  }, [duration])

  const bestKey = `${lang}-${duration}`
  const prevBest = best[bestKey] ?? 0
  const isNewBest = t.status === 'done' && t.stats.typedChars > 0 && t.stats.wpm > prevBest

  useEffect(() => {
    if (isNewBest) {
      setBest((b) => {
        const next = { ...b, [bestKey]: t.stats.wpm }
        localStorage.setItem('typing-test-best', JSON.stringify(next))
        return next
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.status])

  const restart = useCallback(() => t.restart(), [t])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') restart()
      if (e.key === 'Enter' && t.status === 'done') restart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [restart, t.status])

  const timeColor = useMemo(
    () => (t.timeLeft <= 5 && t.status === 'running' ? 'text-rose-400' : 'text-zinc-100'),
    [t.timeLeft, t.status],
  )

  return (
    <main className="app-backdrop min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-8">
        <header className="flex flex-wrap items-center gap-4">
          <img
            src="/logo.png"
            alt="Aayush Neupane logo"
            className="h-11 w-11 rounded-xl border border-white/10 object-cover"
          />
          <div className="mr-auto leading-none">
            <p className="text-xl font-bold tracking-[0.2em]">AURORA</p>
            <p className="mt-1.5 flex justify-between text-[10px] font-medium uppercase text-zinc-500">
              {'type test'.split('').map((ch, i) => (
                <span key={i}>{ch === ' ' ? ' ' : ch}</span>
              ))}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1">
            <Pill active={lang === 'en'} onClick={() => setLang('en')}>
              English
            </Pill>
            <Pill active={lang === 'ne'} onClick={() => setLang('ne')}>
              नेपाली
            </Pill>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1">
            {DURATIONS.map((d) => (
              <Pill key={d} active={duration === d} onClick={() => setDuration(d)}>
                {d}s
              </Pill>
            ))}
            <button
              onClick={restart}
              title="Restart (Esc)"
              className="rounded-full px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
            >
              ↻
            </button>
          </div>
        </header>

        <div className="mt-8 flex items-end gap-6">
          <div className={`text-5xl font-bold tabular-nums tracking-tight ${timeColor}`}>
            {t.timeLeft}
            <span className="text-lg font-medium text-zinc-500">s</span>
          </div>
          <div className="pb-1.5 text-sm text-zinc-400">
            <span className="mr-5">
              <span className="font-bold text-zinc-100 tabular-nums">{t.stats.wpm}</span> wpm
            </span>
            <span>
              <span className="font-bold text-zinc-100 tabular-nums">{t.stats.accuracy}%</span> acc
            </span>
          </div>
          {prevBest > 0 && (
            <div className="ml-auto pb-1.5 text-sm text-zinc-500">
              best <span className="font-bold text-yellow-300 tabular-nums">{prevBest}</span> wpm
            </div>
          )}
        </div>

        <div className="mt-4">
          {t.status === 'done' ? (
            <section className="rounded-2xl border border-white/10 bg-black/40 p-8 text-center shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
              {isNewBest && (
                <p className="mb-3 inline-block rounded-full bg-yellow-400/10 px-3 py-1 text-sm font-semibold text-yellow-300">
                  ★ New best!
                </p>
              )}
              <p className="text-7xl font-bold tabular-nums tracking-tight text-yellow-300">
                {t.stats.wpm}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                words per minute
              </p>
              <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-4">
                {[
                  { v: `${t.stats.accuracy}%`, l: 'accuracy' },
                  { v: `${t.stats.correctWords}/${t.stats.totalWords}`, l: 'correct words' },
                  { v: `${t.stats.correctChars}`, l: 'correct chars' },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl border border-white/5 bg-white/[0.02] py-3">
                    <p className="text-xl font-semibold tabular-nums">{s.v}</p>
                    <p className="mt-0.5 text-[11px] uppercase tracking-wider text-zinc-500">{s.l}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={restart}
                className="mt-8 rounded-full bg-yellow-400 px-6 py-2.5 text-sm font-semibold text-zinc-950 shadow-[0_0_24px_-6px_rgba(250,204,21,0.7)] transition-transform hover:scale-[1.03]"
              >
                Try again (Enter)
              </button>
            </section>
          ) : (
            <TypingArea
              words={t.words}
              index={t.index}
              input={t.input}
              submitted={t.submitted}
              lang={lang}
              onInput={t.handleInput}
              onBackspaceEmpty={t.goBackOneWord}
            />
          )}
        </div>

        <footer className="mt-auto flex flex-wrap items-center justify-center gap-2 pt-10 text-xs text-zinc-500">
          <p className="w-full text-center">
            {lang === 'ne'
              ? 'नेपालीमा टाइप गर्न system keyboard लाई Nepali layout मा बदल्नुहोस्'
              : 'Press Esc anytime to restart · Space moves to the next word'}
          </p>
          <a
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 text-sm text-zinc-400 transition-colors hover:text-yellow-300"
          >
            <img src="/logo.png" alt="" className="h-10 w-10 rounded-lg border border-white/10 object-cover" />
            <span>
              Developed by <span className="font-semibold text-zinc-100">Aayush Neupane</span>
            </span>
          </a>
        </footer>
      </div>
    </main>
  )
}
