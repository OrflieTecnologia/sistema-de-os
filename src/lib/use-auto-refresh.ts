'use client'

import { useEffect, useRef } from 'react'

/**
 * Executa `callback` automaticamente:
 * - quando a aba/janela volta a ficar visível ou recebe foco;
 * - em intervalos regulares (`intervalMs`), apenas enquanto a aba está visível.
 *
 * Útil para atualizar dados sem o usuário precisar dar F5.
 */
export function useAutoRefresh(callback: () => void, intervalMs = 30000) {
  const cbRef = useRef(callback)
  useEffect(() => {
    cbRef.current = callback
  }, [callback])

  useEffect(() => {
    const runIfVisible = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        cbRef.current()
      }
    }
    const id = setInterval(runIfVisible, intervalMs)
    window.addEventListener('focus', runIfVisible)
    document.addEventListener('visibilitychange', runIfVisible)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', runIfVisible)
      document.removeEventListener('visibilitychange', runIfVisible)
    }
  }, [intervalMs])
}
