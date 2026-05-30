import React from 'react'

interface SparklineProps {
  values: number[]
  color: string
  width?: number
  height?: number
}

export function Sparkline({ values, color, width = 70, height = 22 }: SparklineProps) {
  if (values.length < 2) return null

  const pad = 2
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = (width - pad * 2) / (values.length - 1)

  const points = values.map((v, i) => {
    const x = pad + i * stepX
    const y = height - pad - ((v - min) / range) * (height - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const linePath = `M ${points.join(' L ')}`
  const areaPath = `${linePath} L ${(pad + (values.length - 1) * stepX).toFixed(1)},${height - pad} L ${pad},${height - pad} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="inline-block"
    >
      <path d={areaPath} fill={color} opacity={0.15} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
