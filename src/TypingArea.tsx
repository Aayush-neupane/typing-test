import { useEffect, useRef, useState } from 'react'
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

function WordView({
  target,
  typed,
  isActive,
  activeChar,
  showCaret,
}: {
  target: string
  typed: string | null
  isActive: boolean
  activeChar: number
  showCaret: boolean
}) {
  const letters: React.ReactNode[] = []
  const shown = typed ?? ''
  const len = Math.max(target.length, shown.length)
  for (let i = 0; i < len; i++) {
    const expected = target[i]
    const got = shown[i]
    let cls = 'text-zinc-600'
    if (got !== undefined) {
      cls = got === expected ? 'text-zinc-100' : 'text-rose-400'
    }
    const caret = isActive && showCaret && i === activeChar
    letters.push(
      <span key={i} className={caret ? 'typing-caret' : undefined}>
        <span className={cls}>{expected ?? got}</span>
      </span>,
    )
  }
  // caret at end of word
  const endCaret = isActive && showCaret && activeChar >= len
  return (
    <span className="mr-[0.6ch] inline-block whitespace-pre">
      {letters}
      {endCaret && <span className="typing-caret">&nbsp;</span>}
      {typed !== null && typed !== target && (
        <span className="ml-1 text-xs text-rose-500/70">✕</span>
      )}
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
  const activeRef = useRef<HTMLSpanElement>(null)
  const [focused, setFocused] = useState(true)

  const focusInput = () => inputRef.current?.focus()

  useEffect(() => {
    focusInput()
  }, [index])

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [index])

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

  const visible = words.slice(Math.max(0, index - 20), index + 60)

  return (
    <div className="relative rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
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
          className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-zinc-950/60 text-sm text-zinc-300 backdrop-blur-[1px]"
        >
          Click here or start typing to focus
        </button>
      )}
      <p className={`text-2xl leading-relaxed ${lang === 'ne' ? 'font-nepali' : ''}`}>
        {visible.map((word, vi) => {
          const gi = Math.max(0, index - 20) + vi
          if (gi < index) {
            return (
              <WordView
                key={gi}
                target={word}
                typed={submitted[gi] ?? ''}
                isActive={false}
                activeChar={-1}
                showCaret={false}
              />
            )
          }
          if (gi === index) {
            return (
              <span key={gi} ref={activeRef}>
                <WordView
                  target={word}
                  typed={input}
                  isActive
                  activeChar={input.length}
                  showCaret={focused}
                />
              </span>
            )
          }
          return (
            <WordView
              key={gi}
              target={word}
              typed={null}
              isActive={false}
              activeChar={-1}
              showCaret={false}
            />
          )
        })}
      </p>
      <p className="mt-4 text-xs text-zinc-500">Space moves to the next word. Esc restarts.</p>
    </div>
  )
}
