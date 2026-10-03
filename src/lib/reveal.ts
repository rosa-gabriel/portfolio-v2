import type { CSSProperties } from 'react'

export type RevealKind = 'type' | 'title' | 'up' | 'window'

const STAGGER_MS = 110

let observer: IntersectionObserver | null = null

function sharedObserver() {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.setAttribute('data-revealed', '')
        observer?.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0 },
  )
  return observer
}

function revealRef(node: Element | null) {
  if (!node) return
  const io = sharedObserver()
  io.observe(node)
  return () => io.unobserve(node)
}

export function reveal(kind: RevealKind, order = 0) {
  return {
    ref: revealRef,
    'data-reveal': kind,
    style: { '--reveal-delay': `${order * STAGGER_MS}ms` } as CSSProperties,
  }
}
