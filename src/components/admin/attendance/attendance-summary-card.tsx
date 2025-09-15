
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ReportData } from "./attendance-report-table";
import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

type AttendanceSummaryCardProps = {
  reportData: ReportData[];
};

const COLORS = {
  'on-time': 'hsl(var(--chart-1))', // Greenish
  'late': 'hsl(var(--chart-2))',    // Yellowish/Orangish
  'absent': 'hsl(var(--chart-5))',  // Redish
};
const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }: any) => {
    if (percent === 0) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export function AttendanceSummaryCard({ reportData }: AttendanceSummaryCardProps) {
  const summary = useMemo(() => {
    const total = reportData.length;
    const onTime = reportData.filter(r => r.status === 'on-time').length;
    const late = reportData.filter(r => r.status === 'late').length;
    const absent = reportData.filter(r => r.status === 'absent').length;
    
    return {
      total,
      onTime,
      late,
      absent,
      onTimePercent: total > 0 ? (onTime / total) * 100 : 0,
      latePercent: total > 0 ? (late / total) * 100 : 0,
      absentPercent: total > 0 ? (absent / total) * 100 : 0,
    };
  }, [reportData]);

  const chartData = [
    { name: 'On-Time', value: summary.onTime, color: COLORS['on-time'] },
    { name: 'Late', value: summary.late, color: COLORS['late'] },
    { name: 'Absent', value: summary.absent, color: COLORS['absent'] },
  ].filter(d => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Summary</CardTitle>
        <CardDescription>Overall attendance for this session.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Tooltip 
                        contentStyle={{
                            background: "hsl(var(--background))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "var(--radius)",
                        }}
                        formatter={(value: number, name: string) => [`${value} student(s)`, name]}
                    />
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                    >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />
                        ))}
                    </Pie>
                    <Legend iconType="circle" iconSize={10} />
                </PieChart>
            </ResponsiveContainer>
        </div>
        <div className="mt-6 space-y-3">
           <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center">
                    <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: COLORS["on-time"] }} />
                    On-Time
                </span>
                <span className="font-medium">{summary.onTime} ({summary.onTimePercent.toFixed(0)}%)</span>
           </div>
            <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center">
                    <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: COLORS["late"] }} />
                    Late
                </span>
                <span className="font-medium">{summary.late} ({summary.latePercent.toFixed(0)}%)</span>
           </div>
           <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground flex items-center">
                    <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: COLORS["absent"] }} />
                    Absent
                </span>
                <span className="font-medium">{summary.absent} ({summary.absentPercent.toFixed(0)}%)</span>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
