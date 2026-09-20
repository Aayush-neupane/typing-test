import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { randomWords, type Language } from './words'

export type Status = 'idle' | 'running' | 'done'

export interface Stats {
  wpm: number
  accuracy: number
  correctWords: number
  totalWords: number
  correctChars: number
  typedChars: number
}

const QUEUE_SIZE = 120
const REFILL_AT = 30
const REFILL_BY = 60

export function useTypingTest(lang: Language, duration: number) {
  const [words, setWords] = useState<string[]>(() => randomWords(lang, QUEUE_SIZE))
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState<string[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [timeLeft, setTimeLeft] = useState(duration)
  const timerRef = useRef<number | null>(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current)
    }
  }, [])

  const restart = useCallback(() => {
    stopTimer()
    setWords(randomWords(lang, QUEUE_SIZE))
    setIndex(0)
    setInput('')
    setSubmitted([])
    setStatus('idle')
    setTimeLeft(duration)
  }, [lang, duration, stopTimer])

  useEffect(() => {
    restart()
  }, [restart])

  const startTimer = useCallback(() => {
    setStatus('running')
    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          stopTimer()
          setStatus('done')
          return 0
        }
        return t - 1
      })
    }, 1000)
  }, [stopTimer])

  const submitWord = useCallback(
    (typedWord: string) => {
      setSubmitted((prev) => [...prev, typedWord])
      setIndex((i) => {
        const next = i + 1
        if (words.length - next < REFILL_AT) {
          setWords((w) => [...w, ...randomWords(lang, REFILL_BY)])
        }
        return next
      })
      setInput('')
    },
    [lang, words.length],
  )

  const handleInput = useCallback(
    (value: string) => {
      if (status === 'done') return
      if (status === 'idle') startTimer()
      if (value.endsWith(' ')) {
        submitWord(value.slice(0, -1))
      } else {
        setInput(value)
      }
    },
    [status, startTimer, submitWord],
  )

  const goBackOneWord = useCallback(() => {
    if (input !== '' || index === 0 || status === 'done') return
    setSubmitted((prev) => {
      const last = prev[prev.length - 1] ?? ''
      setInput(last)
      return prev.slice(0, -1)
    })
    setIndex((i) => i - 1)
  }, [input, index, status])

  const finishNow = useCallback(() => {
    stopTimer()
    setStatus('done')
  }, [stopTimer])

  const stats: Stats = useMemo(() => {
    let correctChars = 0
    let typedChars = 0
    let correctWords = 0
    submitted.forEach((typedWord, i) => {
      const target = words[i] ?? ''
      typedChars += typedWord.length + 1 // +1 for the space
      if (typedWord === target) {
        correctWords += 1
        correctChars += target.length + 1
      } else {
        for (let j = 0; j < typedWord.length; j++) {
          if (typedWord[j] === target[j]) correctChars += 1
        }
      }
    })
    // in-progress word counts toward accuracy but not wpm chars
    const currentTarget = words[index] ?? ''
    for (let j = 0; j < input.length; j++) {
      typedChars += 1
      if (input[j] === currentTarget[j]) correctChars += 1
    }
    const elapsed = Math.max(duration - timeLeft, 1)
    const wpm = correctChars / 5 / (elapsed / 60)
    const accuracy = typedChars === 0 ? 100 : (correctChars / typedChars) * 100
    return {
      wpm: Math.round(wpm),
      accuracy: Math.round(accuracy * 10) / 10,
      correctWords,
      totalWords: submitted.length,
      correctChars,
      typedChars,
    }
  }, [submitted, input, words, index, duration, timeLeft])

  return {
    words,
    index,
    input,
    submitted,
    status,
    timeLeft,
    stats,
    handleInput,
    goBackOneWord,
    restart,
    finishNow,
  }
}
