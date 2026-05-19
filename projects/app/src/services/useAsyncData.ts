import { useEffect, useState } from 'react'

export type AsyncDataState<T> = {
  data: T
  error: string | null
  loading: boolean
}

export function useAsyncData<T>(fallbackData: T, loader: () => Promise<T>, reloadKey: unknown = null): AsyncDataState<T> {
  const [data, setData] = useState(fallbackData)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    loader()
      .then((nextData) => {
        if (!active) return
        setData(nextData)
        setError(null)
      })
      .catch((reason: unknown) => {
        if (!active) return
        setError(reason instanceof Error ? reason.message : '数据加载失败')
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [loader, reloadKey])

  return { data, error, loading }
}
