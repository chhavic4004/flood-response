"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  AlertTriangle, 
  TrendingUp, 
  Zap,
  ChevronRight
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"

interface PredictionModalProps {
  isOpen: boolean
  onClose: () => void
  selectedVillage?: string
}

interface GridCell {
  id: string
  x: number
  y: number
  severity: number
  name: string
}

const districtGrid: GridCell[] = [
  { id: "d1", x: 0, y: 0, severity: 0.9, name: "South Salmara" },
  { id: "d2", x: 1, y: 0, severity: 0.7, name: "Gauripur" },
  { id: "d3", x: 2, y: 0, severity: 0.4, name: "Rupsi" },
  { id: "d4", x: 3, y: 0, severity: 0.3, name: "Bagribari" },
  { id: "d5", x: 4, y: 0, severity: 0.5, name: "Bilasipara" },
  { id: "d6", x: 0, y: 1, severity: 0.85, name: "Dhubri Town" },
  { id: "d7", x: 1, y: 1, severity: 0.6, name: "Golakganj" },
  { id: "d8", x: 2, y: 1, severity: 0.45, name: "Balajan" },
  { id: "d9", x: 3, y: 1, severity: 0.35, name: "Chapar" },
  { id: "d10", x: 4, y: 1, severity: 0.2, name: "Sapatgram" },
  { id: "d11", x: 0, y: 2, severity: 0.75, name: "Agomoni" },
  { id: "d12", x: 1, y: 2, severity: 0.55, name: "Tamarhat" },
  { id: "d13", x: 2, y: 2, severity: 0.4, name: "Laugrabhita" },
  { id: "d14", x: 3, y: 2, severity: 0.25, name: "Fakirganj" },
  { id: "d15", x: 4, y: 2, severity: 0.15, name: "Patakata" },
]

const highRiskVillages = [
  { name: "South Salmara", risk: "Flood Predict", demand: "Demand Spike Incoming", urgency: 0.95 },
  { name: "Dhubri Town", risk: "Cascade Alert", demand: "Medicine Surge +200%", urgency: 0.88 },
  { name: "Gauripur", risk: "Road Failure", demand: "Isolation Risk High", urgency: 0.82 },
  { name: "Agomoni", risk: "Water Rise", demand: "Evacuation Needed", urgency: 0.75 },
  { name: "Golakganj", risk: "Supply Chain", demand: "Route Degrading", urgency: 0.68 },
]

const demandForecast = [
  { hour: "Now", medicine: 45, food: 30, water: 25 },
  { hour: "+1h", medicine: 60, food: 40, water: 35 },
  { hour: "+2h", medicine: 85, food: 55, water: 50 },
  { hour: "+3h", medicine: 95, food: 70, water: 60 },
  { hour: "+4h", medicine: 75, food: 80, water: 70 },
]

export function PredictionsHub({ isOpen, onClose, selectedVillage }: PredictionModalProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  const [cascadeRipple, setCascadeRipple] = useState<string[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Cascade ripple animation
  useEffect(() => {
    if (!isOpen) return
    
    const interval = setInterval(() => {
      const hotCells = districtGrid.filter(c => c.severity > 0.7).map(c => c.id)
      if (hotCells.length > 0) {
        setCascadeRipple([hotCells[0]])
        
        // Ripple outward
        setTimeout(() => {
          const adjacent = districtGrid
            .filter(c => c.severity > 0.5 && !hotCells.includes(c.id))
            .slice(0, 3)
            .map(c => c.id)
          setCascadeRipple(prev => [...prev, ...adjacent])
        }, 300)
        
        setTimeout(() => setCascadeRipple([]), 1000)
      }
    }, 3000)
    
    return () => clearInterval(interval)
  }, [isOpen])

  const getSeverityColor = (severity: number) => {
    if (severity > 0.7) return "#FF1744"
    if (severity > 0.4) return "#FFEA00"
    return "#00E676"
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
          className="relative w-full max-w-4xl max-h-[85vh] overflow-auto rounded-xl border border-border bg-[#0a1628] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-twwzfDNVxr0OB1BFgpYUDVNquP9Odm.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          
          {/* Heat shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-[#FF1744]/5 via-[#FFEA00]/5 to-transparent"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap className="w-6 h-6 text-[#FF1744]" />
              </motion.div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Predict & Preempt</h2>
                <p className="text-xs text-[#FF1744] font-mono">3 Failures Next 2hrs</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="relative z-10 p-6 space-y-6">
            {/* Heatmap Grid */}
            <div className="p-4 rounded-xl bg-card/50 border border-border">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-foreground">
                <AlertTriangle className="w-4 h-4 text-[#FF1744]" />
                District Severity Heatmap
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {districtGrid.map((cell) => {
                  const isHovered = hoveredCell === cell.id
                  const isRippling = cascadeRipple.includes(cell.id)
                  const color = getSeverityColor(cell.severity)
                  
                  return (
                    <motion.div
                      key={cell.id}
                      className="relative aspect-square rounded-lg cursor-pointer overflow-hidden"
                      style={{ backgroundColor: color }}
                      onMouseEnter={() => setHoveredCell(cell.id)}
                      onMouseLeave={() => setHoveredCell(null)}
                      animate={{
                        opacity: 0.3 + cell.severity * 0.7,
                        scale: isHovered ? 1.05 : 1,
                      }}
                      whileHover={{ scale: 1.05 }}
                    >
                      {/* Pulse for high severity */}
                      {cell.severity > 0.7 && (
                        <motion.div
                          className="absolute inset-0 rounded-lg"
                          style={{ backgroundColor: color }}
                          animate={{ opacity: [0.5, 0.8, 0.5] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      )}
                      
                      {/* Cascade ripple */}
                      {isRippling && (
                        <motion.div
                          className="absolute inset-0 rounded-lg border-2"
                          style={{ borderColor: color }}
                          initial={{ scale: 0.5, opacity: 1 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 0.5 }}
                        />
                      )}
                      
                      {/* Tooltip */}
                      <AnimatePresence>
                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/80 text-[10px] text-white font-bold text-center p-1"
                          >
                            {cell.name}
                            <br />
                            {Math.round(cell.severity * 100)}%
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#00E676' }} />
                  Low Risk
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#FFEA00' }} />
                  Moderate
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#FF1744' }} />
                  Critical
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* High Risk Villages */}
              <div className="p-4 rounded-xl bg-card/50 border border-border">
                <h3 className="text-sm font-bold mb-3 text-foreground">Top 5 High-Risk Villages</h3>
                <div className="space-y-2">
                  {highRiskVillages.map((village, index) => (
                    <motion.div
                      key={village.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border"
                    >
                      <div className="flex items-center gap-2">
                        <motion.div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getSeverityColor(village.urgency) }}
                          animate={village.urgency > 0.8 ? {
                            scale: [1, 1.3, 1],
                          } : {}}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        />
                        <div>
                          <div className="text-xs font-bold" style={{ color: getSeverityColor(village.urgency) }}>
                            {village.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{village.risk}</div>
                        </div>
                      </div>
                      <div className="text-[10px] text-right text-[#FFEA00]">
                        {village.demand}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Demand Forecast */}
              <div className="p-4 rounded-xl bg-card/50 border border-border">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-foreground">
                  <TrendingUp className="w-4 h-4 text-[#FFEA00]" />
                  Demand Forecast
                </h3>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={demandForecast}>
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fontSize: 10, fill: '#888' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#888' }} 
                      axisLine={false} 
                      tickLine={false}
                    />
                    <Bar dataKey="medicine" stackId="a" fill="#FF1744" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="food" stackId="a" fill="#FFEA00" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="water" stackId="a" fill="#00E676" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2 text-[10px]">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded" style={{ backgroundColor: '#FF1744' }} />
                    Medicine
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded" style={{ backgroundColor: '#FFEA00' }} />
                    Food
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded" style={{ backgroundColor: '#00E676' }} />
                    Water
                  </span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <motion.button
              className="w-full py-3 rounded-xl bg-[#00E676] text-black font-bold text-sm flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(0, 230, 118, 0.5)' }}
              whileTap={{ scale: 0.98 }}
            >
              Act Now - Route to Hotspots
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
