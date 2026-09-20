import { useLayoutEffect, useEffect, useRef, useState } from 'react'
import type { Language } from './words'

interface Props {
  words: string[]
  index: number
  input: string
  submitted: string[]
  lang: Language
  onInput: (value: string) => void
  onBackspaceEmpty: () => void
}

// Devanagari shaping breaks when a word is split across elements
// (conjuncts like ज्ञ fall apart), so Nepali words render whole.
const isNepali = (lang: Language) => lang === 'ne'
const lineHeight = (lang: Language) => (isNepali(lang) ? 52 : 40)
const VISIBLE_LINES = 3

function EnglishWord({
  target,
  typed,
  state,
  showCaret,
}: {
  target: string
  typed: string | null
  state: 'done' | 'active' | 'todo'
  showCaret: boolean
}) {
  const shown = typed ?? ''
  const len = Math.max(target.length, shown.length)
  const letters = []
  for (let i = 0; i < len; i++) {
    const expected = target[i]
    const got = shown[i]
    let cls = 'text-zinc-600'
    if (state === 'done') cls = 'text-zinc-100'
    else if (got !== undefined) cls = got === expected ? 'text-zinc-100' : 'text-rose-400'
    const caret = state === 'active' && showCaret && i === shown.length
    letters.push(
      <span key={i} className={caret ? 'typing-caret' : undefined}>
        <span className={cls}>{expected ?? got}</span>
      </span>,
    )
  }
  const endCaret = state === 'active' && showCaret && shown.length >= len
  const wrong = state === 'done' && typed !== target
  return (
    <span className="mr-[0.6ch] inline-block whitespace-pre">
      {letters}
      {endCaret && <span className="typing-caret">&nbsp;</span>}
      {wrong && <span className="ml-1 text-xs text-rose-500/70">✕</span>}
    </span>
  )
}

function NepaliWord({
  target,
  typed,
  state,
  showCaret,
}: {
  target: string
  typed: string | null
  state: 'done' | 'active' | 'todo'
  showCaret: boolean
}) {
  let cls = 'text-zinc-600'
  if (state === 'done') {
    cls = typed === target ? 'text-zinc-100' : 'text-rose-400 line-through decoration-rose-500/40'
  } else if (state === 'active') {
    if (typed === '' || typed === null) cls = 'text-zinc-100'
    else if (target.startsWith(typed)) cls = 'rounded bg-yellow-400/10 px-1 text-yellow-100'
    else cls = 'rounded bg-rose-500/10 px-1 text-rose-200'
  }
  return (
    <span className="mr-[0.6ch] inline-block whitespace-pre">
      <span className={cls}>
        {target}
        {state === 'active' && showCaret && <span className="typing-caret">&nbsp;</span>}
      </span>
    </span>
  )
}

export default function TypingArea({
  words,
  index,
  input,
  submitted,
  lang,
  onInput,
  onBackspaceEmpty,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const wordEls = useRef(new Map<number, HTMLSpanElement>())
  const historyRef = useRef<number[]>([])
  const [focused, setFocused] = useState(true)
  const [lineStart, setLineStart] = useState(0)

  const LINE_H = lineHeight(lang)
  const Word = isNepali(lang) ? NepaliWord : EnglishWord

  const focusInput = () => inputRef.current?.focus()

  useEffect(() => {
    focusInput()
  }, [index])

  // Keep exactly 3 lines visible: slide the window when the active
  // word wraps past the bottom, restore when backspacing upward.
  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    if (index === 0) {
      if (lineStart !== 0) setLineStart(0)
      historyRef.current = []
      return
    }
    const top = (gi: number) => {
      const el = wordEls.current.get(gi)
      if (!el) return null
      return el.getBoundingClientRect().top - box.getBoundingClientRect().top
    }
    const firstTop = top(lineStart)
    const activeTop = top(index)
    if (firstTop === null || activeTop === null) return
    if (activeTop - firstTop >= LINE_H * VISIBLE_LINES - 4) {
      let s = lineStart + 1
      while (s <= index) {
        const t = top(s)
        if (t === null || t - firstTop > 4) break
        s++
      }
      historyRef.current.push(lineStart)
      setLineStart(s)
    } else if (activeTop < firstTop - 4) {
      const prev = historyRef.current.pop()
      setLineStart(prev ?? Math.max(0, index - 12))
    }
  })

  // Catch typing anywhere on the page and redirect it into the input,
  // so the test starts even if the user never clicked the box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (document.activeElement === inputRef.current) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'BUTTON' || target.tagName === 'INPUT')) return
      if (e.key.length === 1 || e.key === 'Backspace') focusInput()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="relative rounded-2xl border border-white/10 bg-black/40 p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
      <input
        ref={inputRef}
        value={input}
        autoFocus
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="typing input"
        className="absolute inset-0 cursor-text opacity-0"
        onChange={(e) => onInput(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === 'Backspace' && input === '') onBackspaceEmpty()
        }}
      />
      {!focused && (
        <button
          onClick={focusInput}
          className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-zinc-950/60 text-sm text-zinc-300 backdrop-blur-[1px]"
        >
          Click here or start typing to focus
        </button>
      )}
      <div
        ref={boxRef}
        className={`overflow-hidden text-2xl ${isNepali(lang) ? 'font-nepali' : ''}`}
        style={{ height: LINE_H * VISIBLE_LINES, lineHeight: `${LINE_H}px` }}
      >
        {words.slice(lineStart, lineStart + 90).map((word, vi) => {
          const gi = lineStart + vi
          const setRef = (el: HTMLSpanElement | null) => {
            if (el) wordEls.current.set(gi, el)
            else wordEls.current.delete(gi)
          }
          if (gi < index) {
            return (
              <span key={gi} ref={setRef}>
                <Word target={word} typed={submitted[gi] ?? ''} state="done" showCaret={false} />
              </span>
            )
          }
          if (gi === index) {
            return (
              <span key={gi} ref={setRef}>
                <Word target={word} typed={input} state="active" showCaret={focused} />
              </span>
            )
          }
          return (
            <span key={gi} ref={setRef}>
              <Word target={word} typed={null} state="todo" showCaret={false} />
            </span>
          )
        })}
      </div>
      <p className="mt-4 text-xs text-zinc-500">Space moves to the next word · Esc restarts</p>
    </div>
  )
}
