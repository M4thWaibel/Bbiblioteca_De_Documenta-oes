import type { CSSProperties } from 'react'

export function Icon({
  name,
  size = 20,
  style,
}: {
  name: string
  size?: number
  style?: CSSProperties
}) {
  return (
    <span className="ms-icon" style={{ fontSize: size + 'px', ...style }}>
      {name}
    </span>
  )
}
