'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface AttendanceChartsProps {
  groups: Array<{ id: string; name: string }>;
}

const MONTH_DATA = [
  { date: '28 авг', 'ARVESTI 1.0': 92, 'ARVESTI 2.0': 85, 'ARVESTI 3.0': 88, 'ARVESTI 4.0': 84 },
  { date: '04 сен', 'ARVESTI 1.0': 96, 'ARVESTI 2.0': 87, 'ARVESTI 3.0': 90, 'ARVESTI 4.0': 88 },
  { date: '11 сен', 'ARVESTI 1.0': 98, 'ARVESTI 2.0': 89, 'ARVESTI 3.0': 93, 'ARVESTI 4.0': 88 },
  { date: '18 сен', 'ARVESTI 1.0': 100, 'ARVESTI 2.0': 92, 'ARVESTI 3.0': 95, 'ARVESTI 4.0': 91 },
  { date: '24 сен', 'ARVESTI 1.0': 97, 'ARVESTI 2.0': 92, 'ARVESTI 3.0': 94, 'ARVESTI 4.0': 90 },
];

export function AttendanceCharts({ groups }: AttendanceChartsProps) {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  return (
    <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/80 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-white" />
            <h3 className="font-bold text-white text-base">Динамика посещаемости по группам</h3>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">Процент присутствия на занятиях за последний месяц</p>
        </div>
        <div className="flex p-1 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
          <button
            onClick={() => setChartType('area')}
            className={`py-1 px-3 rounded-lg font-medium cursor-pointer transition-colors ${
              chartType === 'area' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            График
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`py-1 px-3 rounded-lg font-medium cursor-pointer transition-colors ${
              chartType === 'bar' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Столбцы
          </button>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={MONTH_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="color1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="color2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a3a3a3" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a3a3a3" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="date" stroke="#737373" fontSize={11} />
              <YAxis domain={[70, 100]} stroke="#737373" fontSize={11} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#171717',
                  borderColor: '#404040',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="ARVESTI 1.0" stroke="#ffffff" strokeWidth={2} fill="url(#color1)" />
              <Area type="monotone" dataKey="ARVESTI 2.0" stroke="#a3a3a3" strokeWidth={2} fill="url(#color2)" />
              <Area type="monotone" dataKey="ARVESTI 3.0" stroke="#737373" strokeWidth={1.5} fill="none" />
              <Area type="monotone" dataKey="ARVESTI 4.0" stroke="#525252" strokeWidth={1.5} fill="none" />
            </AreaChart>
          ) : (
            <BarChart data={MONTH_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="date" stroke="#737373" fontSize={11} />
              <YAxis domain={[70, 100]} stroke="#737373" fontSize={11} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#171717',
                  borderColor: '#404040',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="ARVESTI 1.0" fill="#ffffff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ARVESTI 2.0" fill="#a3a3a3" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ARVESTI 3.0" fill="#737373" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ARVESTI 4.0" fill="#525252" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
