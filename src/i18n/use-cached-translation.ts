import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

const MAX_ENTRIES = 512

export function useCachedTranslation() {
  const { t, i18n } = useTranslation()

  const cached = useMemo(() => {
    const cache = new Map<string, unknown>()
    return ((...args: Parameters<typeof t>) => {
      const key = args.length > 1 ? JSON.stringify(args) : (args[0] as string)
      if (cache.has(key)) return cache.get(key)
      if (cache.size >= MAX_ENTRIES) cache.clear()
      const value = (t as unknown as (...input: unknown[]) => unknown)(...args)
      cache.set(key, value)
      return value
    }) as typeof t
  }, [t])

  return { t: cached, i18n }
}
