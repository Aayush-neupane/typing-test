import { useEffect, useRef } from 'react'
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
}: {
  target: string
  typed: string | null
  isActive: boolean
  activeChar: number
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
    const caret = isActive && i === activeChar
    letters.push(
      <span key={i} className={caret ? 'typing-caret' : undefined}>
        <span className={cls}>{expected ?? got}</span>
      </span>,
    )
  }
  // caret at end of word
  const endCaret = isActive && activeChar >= len
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

  useEffect(() => {
    inputRef.current?.focus()
  }, [index])

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [index])

  const visible = words.slice(Math.max(0, index - 20), index + 60)

  return (
    <div
      className="relative cursor-text rounded-xl border border-zinc-800 bg-zinc-900/60 p-6"
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        value={input}
        autoFocus
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="typing input"
        className="absolute h-0 w-0 opacity-0"
        onChange={(e) => onInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Backspace' && input === '') onBackspaceEmpty()
        }}
      />
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
              />
            )
          }
          if (gi === index) {
            return (
              <span key={gi} ref={activeRef}>
                <WordView target={word} typed={input} isActive activeChar={input.length} />
              </span>
            )
          }
          return <WordView key={gi} target={word} typed={null} isActive={false} activeChar={-1} />
        })}
      </p>
      <p className="mt-4 text-xs text-zinc-500">Click the box if typing stops. Space moves to the next word.</p>
    </div>
  )
}
