"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Activity, 
  Users, 
  Truck, 
  Package,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown
} from "lucide-react"
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  AreaChart
} from "recharts"

interface StatCardProps {
  label: string
  value: number | string
  change?: number
  icon: React.ReactNode
  color: string
  suffix?: string
}

function StatCard({ label, value, change, icon, color, suffix = "" }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (typeof value === "number") {
      const duration = 1000
      const steps = 30
      const increment = value / steps
      let current = 0
      const timer = setInterval(() => {
        current += increment
        if (current >= value) {
          setDisplayValue(value)
          clearInterval(timer)
        } else {
          setDisplayValue(Math.floor(current))
        }
      }, duration / steps)
      return () => clearInterval(timer)
    }
  }, [value])

  return (
    <motion.div
      className="p-4 rounded-xl bg-card/50 border border-border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="flex items-end gap-2">
        <motion.span 
          className="text-2xl font-black font-mono"
          style={{ color }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {typeof value === "number" ? displayValue.toLocaleString() : value}{suffix}
        </motion.span>
        {change !== undefined && (
          <span className={`text-xs flex items-center gap-1 ${change >= 0 ? 'text-[#00FF00]' : 'text-[#FF0000]'}`}>
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
    </motion.div>
  )
}

function GaugeChart({ value, label, color }: { value: number; label: string; color: string }) {
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100)
    return () => clearTimeout(timer)
  }, [value])

  const angle = (animatedValue / 100) * 180 - 90

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 60" className="w-32 h-20">
        {/* Background arc */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <motion.path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="126"
          initial={{ strokeDashoffset: 126 }}
          animate={{ strokeDashoffset: 126 - (animatedValue / 100) * 126 }}
          transition={{ duration: 1, ease: "easeOut" }}
          filter={`drop-shadow(0 0 5px ${color})`}
        />
        {/* Needle */}
        <motion.line
          x1="50"
          y1="50"
          x2="50"
          y2="20"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ rotate: -90, originX: "50px", originY: "50px" }}
          animate={{ rotate: angle }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ transformOrigin: "50px 50px" }}
        />
        {/* Center dot */}
        <circle cx="50" cy="50" r="4" fill="white" />
        {/* Value text */}
        <text x="50" y="48" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
          {animatedValue}%
        </text>
      </svg>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  )
}

const pieData = [
  { name: "Medicine", value: 35, color: "#FF0000" },
  { name: "Food", value: 28, color: "#FFD700" },
  { name: "Shelter", value: 22, color: "#FF8C00" },
  { name: "Water", value: 15, color: "#00BFFF" },
]

const trendData = [
  { time: "00:00", affected: 12, rescued: 8, delivered: 5 },
  { time: "04:00", affected: 18, rescued: 12, delivered: 9 },
  { time: "08:00", affected: 25, rescued: 18, delivered: 15 },
  { time: "12:00", affected: 32, rescued: 26, delivered: 22 },
  { time: "16:00", affected: 28, rescued: 32, delivered: 28 },
  { time: "20:00", affected: 24, rescued: 38, delivered: 35 },
  { time: "Now", affected: 21, rescued: 42, delivered: 40 },
]

const priorityQueue = [
  { id: 1, village: "South Salmara", priority: "CRITICAL", supply: "Medicine", eta: "15 min", color: "#FF0000" },
  { id: 2, village: "Gauripur", priority: "HIGH", supply: "Food", eta: "30 min", color: "#FF8C00" },
  { id: 3, village: "Dhubri Town", priority: "HIGH", supply: "Shelter", eta: "45 min", color: "#FF8C00" },
  { id: 4, village: "Golakganj", priority: "MEDIUM", supply: "Water", eta: "1h 15min", color: "#FFD700" },
  { id: 5, village: "Sapatgram", priority: "LOW", supply: "Food", eta: "2h", color: "#00FF00" },
]

export function StatsDashboard() {
  const [flashingRow, setFlashingRow] = useState<number | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setFlashingRow(1)
      setTimeout(() => setFlashingRow(null), 500)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Villages Affected"
          value={27}
          change={-12}
          icon={<AlertTriangle className="w-4 h-4" />}
          color="#FF0000"
        />
        <StatCard
          label="People Rescued"
          value={4250}
          change={18}
          icon={<Users className="w-4 h-4" />}
          color="#00FF00"
        />
        <StatCard
          label="Supplies Delivered"
          value={156}
          change={24}
          icon={<Package className="w-4 h-4" />}
          color="#FFD700"
        />
        <StatCard
          label="Active Trucks"
          value={12}
          icon={<Truck className="w-4 h-4" />}
          color="#00BFFF"
        />
      </div>

      {/* Gauges Row */}
      <div className="p-4 rounded-xl bg-card/50 border border-border">
        <h4 className="text-sm font-bold mb-4 text-foreground">System Performance</h4>
        <div className="flex justify-around">
          <GaugeChart value={89} label="Delivery Rate" color="#00FF00" />
          <GaugeChart value={72} label="Route Efficiency" color="#FFD700" />
          <GaugeChart value={45} label="Capacity Used" color="#00BFFF" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <div className="p-4 rounded-xl bg-card/50 border border-border">
          <h4 className="text-sm font-bold mb-4 text-foreground">Supply Distribution</h4>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  dataKey="value"
                  animationDuration={1000}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {pieData.map(item => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span style={{ color: item.color }} className="font-mono">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="p-4 rounded-xl bg-card/50 border border-border">
          <h4 className="text-sm font-bold mb-4 text-foreground">24h Trend</h4>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorAffected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF0000" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FF0000" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRescued" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00FF00" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00FF00" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(10, 22, 40, 0.95)', 
                  border: '1px solid #333',
                  borderRadius: '8px',
                  fontSize: '11px'
                }} 
              />
              <Area type="monotone" dataKey="affected" stroke="#FF0000" fill="url(#colorAffected)" strokeWidth={2} />
              <Area type="monotone" dataKey="rescued" stroke="#00FF00" fill="url(#colorRescued)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Priority Queue Table */}
      <div className="p-4 rounded-xl bg-card/50 border border-border">
        <h4 className="text-sm font-bold mb-4 text-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#FF0000]" />
          Priority Queue
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left py-2 px-3">Village</th>
                <th className="text-left py-2 px-3">Priority</th>
                <th className="text-left py-2 px-3">Supply</th>
                <th className="text-left py-2 px-3">ETA</th>
              </tr>
            </thead>
            <tbody>
              {priorityQueue.map((item, index) => (
                <motion.tr 
                  key={item.id}
                  className="border-b border-border/50"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    backgroundColor: flashingRow === item.id ? 'rgba(255, 0, 0, 0.2)' : 'transparent'
                  }}
                  transition={{ delay: index * 0.1 }}
                >
                  <td className="py-2 px-3 font-medium">{item.village}</td>
                  <td className="py-2 px-3">
                    <span 
                      className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{ 
                        backgroundColor: `${item.color}20`,
                        color: item.color 
                      }}
                    >
                      {item.priority}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-muted-foreground">{item.supply}</td>
                  <td className="py-2 px-3 font-mono" style={{ color: item.color }}>{item.eta}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="p-4 rounded-xl bg-card/50 border border-border">
        <h4 className="text-sm font-bold mb-4 text-foreground">District Risk Heatmap</h4>
        <div className="grid grid-cols-6 gap-1">
          {Array.from({ length: 24 }).map((_, i) => {
            const risk = Math.random()
            const color = risk > 0.7 ? '#FF0000' : risk > 0.4 ? '#FFD700' : '#00FF00'
            return (
              <motion.div
                key={i}
                className="h-8 rounded"
                style={{ backgroundColor: color, opacity: 0.3 + risk * 0.7 }}
                animate={risk > 0.7 ? {
                  opacity: [0.5, 0.9, 0.5],
                } : {}}
                transition={risk > 0.7 ? {
                  duration: 1,
                  repeat: Infinity,
                } : {}}
              />
            )
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Low Risk</span>
          <span>High Risk</span>
        </div>
      </div>
    </div>
  )
}
