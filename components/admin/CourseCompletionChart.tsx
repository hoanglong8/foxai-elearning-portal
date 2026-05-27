'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DataPoint {
  name: string
  enrolled: number
  completion: number
  category: string
}

export function CourseCompletionChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          angle={-30}
          textAnchor="end"
          interval={0}
        />
        <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} unit="%" domain={[0, 100]} />
        <Tooltip
          formatter={(value, name) => [
            name === 'completion' ? `${value}%` : value,
            name === 'completion' ? 'Hoàn thành' : 'Đã đăng ký',
          ]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        <Bar dataKey="completion" fill="#3b82f6" radius={[4, 4, 0, 0]} name="completion" />
      </BarChart>
    </ResponsiveContainer>
  )
}
