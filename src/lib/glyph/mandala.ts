export const DEFAULT_CANVAS_SIZE = 600
export const RING_RADII = [90, 170, 240]
export const SNAP_ANGLE = 45

export interface PolarPoint {
  radius: number
  angle: number
}

export interface CartesianPoint {
  x: number
  y: number
}

export function polarToCartesian(
  { radius, angle }: PolarPoint,
  center: CartesianPoint = { x: DEFAULT_CANVAS_SIZE / 2, y: DEFAULT_CANVAS_SIZE / 2 },
): CartesianPoint {
  const radians = (angle * Math.PI) / 180
  const x = center.x + radius * Math.sin(radians)
  const y = center.y - radius * Math.cos(radians)
  return { x: +x.toFixed(2), y: +y.toFixed(2) }
}

export function snapAngle(angle: number, snap = SNAP_ANGLE) {
  const normalized = ((angle % 360) + 360) % 360
  const snapped = Math.round(normalized / snap) * snap
  return ((snapped % 360) + 360) % 360
}

export function snapRadius(radius: number, rings: number[] = RING_RADII) {
  if (!rings.length) return radius
  return rings.reduce((closest, current) =>
    Math.abs(current - radius) < Math.abs(closest - radius) ? current : closest,
  )
}

export function mandalaGuides(size = DEFAULT_CANVAS_SIZE, ringCount = RING_RADII.length) {
  const center = size / 2
  const maxRadius = center - 24
  const rings = Array.from({ length: ringCount }, (_, index) => ((index + 1) / ringCount) * maxRadius)
  const spokes = Array.from({ length: 8 }, (_, index) => index * SNAP_ANGLE)
  return { center, rings, spokes }
}
