import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Light ramp, darkest → brightest.
const RAMP = ' .,:;-=+*cox%#@'

type Props = { label: string }

/**
 * A three.js scene rendered off-screen at character resolution, then
 * printed into a <pre> as ASCII. Drag to spin it; it drifts toward the cursor.
 */
export function AsciiObject({ label }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const probeRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const host = hostRef.current!
    const pre = preRef.current!
    const probe = probeRef.current!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, preserveDrawingBuffer: false })
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 0, 7.2)

    const key = new THREE.DirectionalLight(0xffffff, 2.6)
    key.position.set(3, 4, 5)
    const rim = new THREE.DirectionalLight(0xffffff, 0.9)
    rim.position.set(-4, -2, -3)
    scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.12))

    const group = new THREE.Group()
    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.35, 0.42, 220, 28, 2, 3),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.42, metalness: 0.08 }),
    )
    group.add(knot)
    scene.add(group)

    let cols = 0
    let rows = 0
    let target: THREE.WebGLRenderTarget | null = null
    let buffer = new Uint8Array(0)

    const resize = () => {
      const rect = host.getBoundingClientRect()
      const cell = probe.getBoundingClientRect()
      const cw = cell.width / 10 || 6
      const ch = cell.height || 12
      cols = Math.max(24, Math.floor(rect.width / cw))
      rows = Math.max(12, Math.floor(rect.height / ch))
      camera.aspect = (cols * cw) / (rows * ch)
      camera.updateProjectionMatrix()
      target?.dispose()
      target = new THREE.WebGLRenderTarget(cols, rows)
      renderer.setSize(cols, rows, false)
      buffer = new Uint8Array(cols * rows * 4)
    }

    // Interaction state: drag velocity with friction, cursor tilt eased in.
    const rot = { x: 0.4, y: 0, vx: 0, vy: reduce ? 0 : 0.0045 }
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 }
    let dragging = false
    let last = { x: 0, y: 0 }

    const onDown = (e: PointerEvent) => {
      dragging = true
      last = { x: e.clientX, y: e.clientY }
      host.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      tilt.tx = ((e.clientY - r.top) / r.height - 0.5) * 0.5
      tilt.ty = ((e.clientX - r.left) / r.width - 0.5) * 0.5
      if (!dragging) return
      rot.vy = (e.clientX - last.x) * 0.006
      rot.vx = (e.clientY - last.y) * 0.006
      rot.y += rot.vy
      rot.x += rot.vx
      last = { x: e.clientX, y: e.clientY }
    }
    const onUp = () => {
      dragging = false
    }
    const onLeave = () => {
      tilt.tx = 0
      tilt.ty = 0
    }
    host.addEventListener('pointerdown', onDown)
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerup', onUp)
    host.addEventListener('pointercancel', onUp)
    host.addEventListener('pointerleave', onLeave)

    // Boot: brightness ramps up so the knot "prints in" once.
    const born = performance.now()
    const bootMs = reduce ? 0 : 1100

    const draw = () => {
      if (!target) return
      renderer.setRenderTarget(target)
      renderer.render(scene, camera)
      renderer.readRenderTargetPixels(target, 0, 0, cols, rows, buffer)
      renderer.setRenderTarget(null)

      const t = bootMs ? Math.min(1, (performance.now() - born) / bootMs) : 1
      const boot = 1 - Math.pow(1 - t, 3)
      let out = ''
      for (let y = rows - 1; y >= 0; y--) {
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4
          const l = (buffer[i] * 0.299 + buffer[i + 1] * 0.587 + buffer[i + 2] * 0.114) / 255
          const v = Math.min(1, l * 1.15) * boot
          out += RAMP[Math.min(RAMP.length - 1, Math.floor(v * RAMP.length))]
        }
        out += '\n'
      }
      pre.textContent = out
    }

    let raf = 0
    let visible = true
    const tick = () => {
      raf = 0
      if (!dragging) {
        rot.y += rot.vy
        rot.x += rot.vx
        // Friction back toward a slow idle spin.
        const idle = reduce ? 0 : 0.0045
        rot.vy += (idle - rot.vy) * 0.04
        rot.vx *= 0.94
      }
      tilt.x += (tilt.tx - tilt.x) * 0.08
      tilt.y += (tilt.ty - tilt.y) * 0.08
      group.rotation.set(rot.x + tilt.x, rot.y + tilt.y, 0)
      draw()
      if (visible && !document.hidden) raf = requestAnimationFrame(tick)
    }
    const start = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick)
    }

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      start()
    })
    io.observe(host)
    const ro = new ResizeObserver(() => {
      resize()
      draw()
    })
    ro.observe(host)
    const onVis = () => start()
    document.addEventListener('visibilitychange', onVis)

    resize()
    start()

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      host.removeEventListener('pointerdown', onDown)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerup', onUp)
      host.removeEventListener('pointercancel', onUp)
      host.removeEventListener('pointerleave', onLeave)
      target?.dispose()
      knot.geometry.dispose()
      ;(knot.material as THREE.Material).dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={label}
      className="relative h-full w-full cursor-grab touch-none overflow-hidden active:cursor-grabbing"
    >
      <span ref={probeRef} aria-hidden className="ascii-render invisible absolute text-[9px] leading-[1.1] sm:text-[10px]">
        MMMMMMMMMM
      </span>
      <pre
        ref={preRef}
        aria-hidden
        className="ascii-render absolute inset-0 m-0 text-[9px] leading-[1.1] whitespace-pre sm:text-[10px]"
      />
    </div>
  )
}
