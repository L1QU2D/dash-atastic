'use client'

import React from 'react'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface SeriesConfig {
  dataKey: string
  name: string
  color: string
  yAxisId?: 'left' | 'right'
  type?: 'area' | 'line'
}

interface TimeSeriesChartProps {
  data: Record<string, unknown>[]
  series: SeriesConfig[]
  xDataKey?: string
  height?: number
  formatXLabel?: (value: string) => string
  formatYLeft?: (value: number) => string
  formatYRight?: (value: number) => string
}

function defaultFormat(value: number): string {
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M'
  if (value >= 1_000) return (value / 1_000).toFixed(0) + 'k'
  return Math.round(value).toString()
}

export function TimeSeriesChart({
  data,
  series,
  xDataKey = 'date',
  height = 240,
  formatXLabel,
  formatYLeft,
  formatYRight,
}: TimeSeriesChartProps) {
  const hasRightAxis = series.some((s) => s.yAxisId === 'right')
  const fmtLeft = formatYLeft || defaultFormat
  const fmtRight = formatYRight || defaultFormat

  const formatDate = formatXLabel || ((v: string) => {
    const d = new Date(v)
    return `${d.getMonth() + 1}/${d.getDate()}`
  })

  return (
    <div className="mt-1.5 rounded-[10px] border border-[var(--border)] bg-[#FBFCFD] p-3.5">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 5, right: hasRightAxis ? 10 : 5, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="2 3" stroke="#E5E7EB" />
          <XAxis
            dataKey={xDataKey}
            tickFormatter={formatDate}
            tick={{ fill: '#6B7280', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={fmtLeft}
            tick={{ fill: '#6B7280', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          {hasRightAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={fmtRight}
              tick={{ fill: '#6B7280', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={44}
            />
          )}
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#6B7280' }}
          />
          {series.map((s) => {
            const yAxisId = s.yAxisId || 'left'
            if (s.type === 'line') {
              return (
                <Line
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                  yAxisId={yAxisId}
                />
              )
            }
            return (
              <Area
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.1}
                strokeWidth={2}
                dot={false}
                yAxisId={yAxisId}
              />
            )
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
