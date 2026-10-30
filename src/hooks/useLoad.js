import { useCallback, useEffect, useState } from 'react'

/** Gọi một hàm service trả { data } / { error } và giữ trạng thái tải */
export function useLoad(fn, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: null })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }))
    const res = await fn()
    setState({ loading: false, data: res.data ?? null, error: res.error ?? null })
    return res
  }, deps)
  useEffect(() => { load() }, [load])
  return { ...state, reload: load, setData: (data) => setState((s) => ({ ...s, data })) }
}
