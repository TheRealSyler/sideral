export function degToRad(degrees: number) {
  return degrees * (Math.PI / 180);
}

export function clamp(value: number, max: number, min: number) {
  return Math.min(Math.max(value, min), max);
}