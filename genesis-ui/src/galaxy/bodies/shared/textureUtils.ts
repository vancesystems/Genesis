export function hashString(str: string): number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

export function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function heightToNormalMap(heightCanvas: HTMLCanvasElement, strength = 2.5) {
  const size = heightCanvas.width
  const hctx = heightCanvas.getContext('2d')!
  const heightData = hctx.getImageData(0, 0, size, size).data

  const normalCanvas = document.createElement('canvas')
  normalCanvas.width = normalCanvas.height = size
  const nctx = normalCanvas.getContext('2d')!
  const normalData = nctx.createImageData(size, size)

  const at = (x: number, y: number) => {
    const xi = (x + size) % size
    const yi = (y + size) % size
    return heightData[(yi * size + xi) * 4] / 255
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const left = at(x - 1, y)
      const right = at(x + 1, y)
      const up = at(x, y - 1)
      const down = at(x, y + 1)

      const dx = (left - right) * strength
      const dy = (up - down) * strength
      const dz = 1.0

      const len = Math.sqrt(dx * dx + dy * dy + dz * dz)
      const i = (y * size + x) * 4
      normalData.data[i] = ((dx / len) * 0.5 + 0.5) * 255
      normalData.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255
      normalData.data[i + 2] = ((dz / len) * 0.5 + 0.5) * 255
      normalData.data[i + 3] = 255
    }
  }

  nctx.putImageData(normalData, 0, 0)
  return normalCanvas
}