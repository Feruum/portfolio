import { useEffect, useRef, useState } from 'react'

const GLYPHS = '!<>-_\\/[]{}=+*^?#%&$@01'

/** Resolves text left-to-right out of random glyphs whenever `text` changes. */
export function Scramble({ text, duration = 650, delay = 0 }: { text: string; duration?: number; delay?: number }) {
  const [out, setOut] = useState(text)
  const first = useRef(true)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setOut(text)
      return
    }
    const wait = first.current ? delay : 0
    first.current = false
    // Interval rather than rAF so text always resolves, even in a background tab.
    let interval = 0
    const timer = window.setTimeout(() => {
      const start = performance.now()
      interval = window.setInterval(() => {
        const t = Math.min(1, (performance.now() - start) / duration)
        const solved = Math.floor(t * text.length)
        let s = text.slice(0, solved)
        for (let i = solved; i < text.length; i++) {
          s += text[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]
        }
        setOut(s)
        if (t >= 1) clearInterval(interval)
      }, 33)
    }, wait)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [text, duration, delay])

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>{out}</span>
    </>
  )
}
