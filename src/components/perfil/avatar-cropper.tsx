'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ZoomIn, ZoomOut, Check, X, Move } from 'lucide-react'

interface AvatarCropperProps {
  src: string
  onCancel: () => void
  onConfirm: (dataUrl: string) => void
}

const VIEWPORT = 260 // tamanho da área de recorte na tela (px)
const OUTPUT = 320 // resolução final da imagem gerada (px)

export function AvatarCropper({ src, onCancel, onConfirm }: AvatarCropperProps) {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null)

  // Escala mínima para a imagem "cobrir" a área de recorte
  const coverScale = natural ? Math.max(VIEWPORT / natural.w, VIEWPORT / natural.h) : 1
  const dispW = natural ? natural.w * coverScale * zoom : 0
  const dispH = natural ? natural.h * coverScale * zoom : 0

  // Mantém a imagem sempre cobrindo o viewport
  const clamp = useCallback(
    (x: number, y: number) => {
      const minX = VIEWPORT - dispW
      const minY = VIEWPORT - dispH
      return {
        x: Math.min(0, Math.max(minX, x)),
        y: Math.min(0, Math.max(minY, y)),
      }
    },
    [dispW, dispH]
  )

  // Carrega dimensões naturais e centraliza a imagem na área de recorte
  useEffect(() => {
    const image = new window.Image()
    image.onload = () => {
      imgRef.current = image
      const w = image.naturalWidth
      const h = image.naturalHeight
      const cover = Math.max(VIEWPORT / w, VIEWPORT / h)
      setNatural({ w, h })
      setOffset({
        x: (VIEWPORT - w * cover) / 2,
        y: (VIEWPORT - h * cover) / 2,
      })
    }
    image.src = src
  }, [src])

  const handlePointerDown = (e: React.PointerEvent) => {
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setOffset(clamp(dragRef.current.ox + dx, dragRef.current.oy + dy))
  }

  const handlePointerUp = () => {
    dragRef.current = null
  }

  const handleZoom = (z: number) => {
    setZoom(z)
    // Reposiciona mantendo o centro
    setOffset((prev) => {
      if (!natural) return prev
      const newDispW = natural.w * coverScale * z
      const newDispH = natural.h * coverScale * z
      const centerX = (VIEWPORT / 2 - prev.x) / dispW
      const centerY = (VIEWPORT / 2 - prev.y) / dispH
      const nx = VIEWPORT / 2 - centerX * newDispW
      const ny = VIEWPORT / 2 - centerY * newDispH
      const minX = VIEWPORT - newDispW
      const minY = VIEWPORT - newDispH
      return {
        x: Math.min(0, Math.max(minX, nx)),
        y: Math.min(0, Math.max(minY, ny)),
      }
    })
  }

  const handleConfirm = () => {
    if (!imgRef.current || !natural) return
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT
    canvas.height = OUTPUT
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scale = coverScale * zoom
    const srcSize = VIEWPORT / scale
    const srcX = -offset.x / scale
    const srcY = -offset.y / scale

    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(imgRef.current, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT, OUTPUT)

    onConfirm(canvas.toDataURL('image/jpeg', 0.9))
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-base font-black text-zinc-900 dark:text-white">Ajustar Foto</h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Cancelar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Área de recorte */}
        <div className="p-5 flex flex-col items-center gap-4">
          <div
            className="relative overflow-hidden rounded-3xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 touch-none select-none cursor-grab active:cursor-grabbing"
            style={{ width: VIEWPORT, height: VIEWPORT }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {natural && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt="Ajuste da foto de perfil"
                draggable={false}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: dispW,
                  height: dispH,
                  transform: `translate(${offset.x}px, ${offset.y}px)`,
                  maxWidth: 'none',
                }}
              />
            )}
            {/* Guia visual */}
            <div className="pointer-events-none absolute inset-0 ring-2 ring-orange-500/40 rounded-3xl" />
          </div>

          <p className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <Move className="w-3.5 h-3.5" /> Arraste para posicionar
          </p>

          {/* Controle de Zoom */}
          <div className="flex items-center gap-3 w-full px-1">
            <ZoomOut className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => handleZoom(parseFloat(e.target.value))}
              className="flex-1 accent-orange-500 cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-zinc-400 shrink-0" />
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold shadow-md shadow-orange-600/20 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" /> Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
