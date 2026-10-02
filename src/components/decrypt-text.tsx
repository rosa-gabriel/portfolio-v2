import { useEffect, useRef, useState } from 'react'

const CHARSET = '!<>-_\\/[]{}=+*^?#@%&01'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function scramble(text: string) {
  return text
    .split('')
    .map((char) => (char === ' ' ? ' ' : CHARSET[Math.floor(Math.random() * CHARSET.length)]))
    .join('')
}

type DecryptTextProps = {
  text: string
  className?: string
  duration?: number
}

export function DecryptText({ text, className, duration = 900 }: DecryptTextProps) {
  const [output, setOutput] = useState(() => (prefersReducedMotion() ? text : scramble(text)))
  const frameRef = useRef(0)

  useEffect(() => {
    if (prefersReducedMotion()) return

    const chars = text.split('')
    const start = performance.now()

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const revealCount = Math.floor(progress * chars.length)

      setOutput(
        chars
          .map((char, i) => {
            if (char === ' ' || i < revealCount) return char
            return CHARSET[Math.floor(Math.random() * CHARSET.length)]
          })
          .join(''),
      )

      if (progress < 1) frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [text, duration])

  return (
    <span className={className}>
      <span aria-hidden="true">{output}</span>
      <span className="sr-only">{text}</span>
    </span>
  )
}
