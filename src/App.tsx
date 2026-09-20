import { useCallback, useEffect, useMemo, useState } from 'react'
import TypingArea from './TypingArea.tsx'
import { useTypingTest } from './useTypingTest.ts'
import type { Language } from './words.ts'

const DURATIONS = [15, 30, 60] as const

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

export default function App() {
  const [lang, setLang] = useState<Language>('ne')
  const [duration, setDuration] = useState<number>(30)
  const t = useTypingTest(lang, duration)
  const [best, setBest] = useState<Best>(loadBest)

  const bestKey = `${lang}-${duration}`
  const prevBest = best[bestKey] ?? 0
  const isNewBest =
    t.status === 'done' && t.stats.typedChars > 0 && t.stats.wpm > prevBest

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
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Typing Test</h1>
            <p className="text-sm text-zinc-400">English + Nepali · check your speed</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-1 text-sm">
              {(
                [
                  { id: 'en', label: 'English' },
                  { id: 'ne', label: 'नेपाली' },
                ] as const
              ).map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLang(l.id)}
                  className={`rounded-md px-3 py-1.5 font-medium ${
                    lang === l.id ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-1 text-sm">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`rounded-md px-3 py-1.5 font-medium ${
                    duration === d ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
            <button
              onClick={restart}
              title="Restart (Esc)"
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-600"
            >
              ↻
            </button>
          </div>
        </header>

        <div className="mt-6 flex items-center gap-6">
          <div className={`text-4xl font-bold tabular-nums ${timeColor}`}>{t.timeLeft}s</div>
          <div className="text-sm text-zinc-400">
            <span className="mr-4">
              live: <span className="font-semibold text-zinc-200">{t.stats.wpm}</span> wpm
            </span>
            <span>
              acc: <span className="font-semibold text-zinc-200">{t.stats.accuracy}%</span>
            </span>
          </div>
          {prevBest > 0 && (
            <div className="ml-auto text-sm text-zinc-500">
              best <span className="font-semibold text-yellow-300">{prevBest}</span> wpm
            </div>
          )}
        </div>

        <div className="mt-4">
          {t.status === 'done' ? (
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
              {isNewBest && (
                <p className="mb-2 inline-block rounded-full bg-yellow-400/10 px-3 py-1 text-sm font-semibold text-yellow-300">
                  ★ New best!
                </p>
              )}
              <p className="text-6xl font-bold text-yellow-300">{t.stats.wpm}</p>
              <p className="mt-1 text-sm uppercase tracking-widest text-zinc-500">words per minute</p>
              <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-semibold">{t.stats.accuracy}%</p>
                  <p className="text-xs text-zinc-500">accuracy</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {t.stats.correctWords}/{t.stats.totalWords}
                  </p>
                  <p className="text-xs text-zinc-500">correct words</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{t.stats.correctChars}</p>
                  <p className="text-xs text-zinc-500">correct chars</p>
                </div>
              </div>
              <div className="mt-8 flex justify-center gap-3">
                <button
                  onClick={restart}
                  className="rounded-lg bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-white"
                >
                  Try again (Enter)
                </button>
              </div>
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

        <footer className="mt-8 text-xs leading-relaxed text-zinc-500">
          {lang === 'ne' ? (
            <p>
              For Nepali, switch your system keyboard to a Nepali layout (e.g. Nepali Traditional on
              Windows, Nepali — Anjali on macOS, or a Nepali Unicode keyboard on mobile) and type in
              देवनागरी.
            </p>
          ) : (
            <p>Press Esc anytime to restart. Your best score per language and duration is saved.</p>
          )}
        </footer>
      </div>
    </main>
  )
}
