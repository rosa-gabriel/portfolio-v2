import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'portfolio-motion'
const listeners = new Set<() => void>()

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'paused'
  } catch {
    return false
  }
}

let paused = readStored()
document.documentElement.toggleAttribute('data-motion-paused', paused)

export const isMotionPaused = () => paused

export function setMotionPaused(value: boolean) {
  paused = value
  document.documentElement.toggleAttribute('data-motion-paused', value)
  try {
    localStorage.setItem(STORAGE_KEY, value ? 'paused' : 'playing')
  } catch {
    // storage can be unavailable in private mode, the preference just won't persist
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useMotionPaused() {
  return useSyncExternalStore(subscribe, isMotionPaused)
}
