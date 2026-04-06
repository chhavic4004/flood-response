"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import { 
  Truck, 
  Check, 
  Clock, 
  AlertTriangle,
  Pill,
  UtensilsCrossed,
  Home,
  Droplet,
  X
} from "lucide-react"

interface QueueItem {
  id: string
  village: string
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  supplyType: "medicine" | "food" | "shelter" | "water"
  waitTime: number // in seconds
  maxWait: number // threshold for auto-escalation
  population: number
  status: "pending" | "approved" | "dispatched"
}

const initialQueue: QueueItem[] = [
  { id: "q1", village: "South Salmara", priority: "CRITICAL", supplyType: "medicine", waitTime: 2700, maxWait: 3600, population: 28900, status: "pending" },
  { id: "q2", village: "Gauripur", priority: "HIGH", supplyType: "medicine", waitTime: 1800, maxWait: 2700, population: 32100, status: "pending" },
  { id: "q3", village: "Dhubri Town", priority: "HIGH", supplyType: "food", waitTime: 1500, maxWait: 2700, population: 78520, status: "pending" },
  { id: "q4", village: "Agomoni", priority: "MEDIUM", supplyType: "shelter", waitTime: 900, maxWait: 1800, population: 12450, status: "pending" },
  { id: "q5", village: "Golakganj", priority: "MEDIUM", supplyType: "water", waitTime: 600, maxWait: 1800, population: 25340, status: "pending" },
  { id: "q6", village: "Sapatgram", priority: "LOW", supplyType: "food", waitTime: 300, maxWait: 1200, population: 15600, status: "pending" },
]

const priorityColors = {
  CRITICAL: "#FF1744",
  HIGH: "#FF6D00",
  MEDIUM: "#FFEA00",
  LOW: "#00E676",
}

const supplyIcons = {
  medicine: Pill,
  food: UtensilsCrossed,
  shelter: Home,
  water: Droplet,
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function PriorityQueue() {
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue)
  const [simTick, setSimTick] = useState(0)

  // Simulation tick - every 30 seconds (accelerated to 3 seconds for demo)
  useEffect(() => {
    const interval = setInterval(() => {
      setSimTick(prev => prev + 1)
      
      setQueue(prevQueue => {
        return prevQueue.map(item => {
          if (item.status !== "pending") return item
          
          const newWaitTime = item.waitTime + 30
          const ratio = newWaitTime / item.maxWait
          
          // Auto-escalate priority based on wait time
          let newPriority = item.priority
          if (ratio >= 1 && item.priority !== "CRITICAL") {
            newPriority = "CRITICAL"
          } else if (ratio >= 0.75 && item.priority === "MEDIUM") {
            newPriority = "HIGH"
          } else if (ratio >= 0.5 && item.priority === "LOW") {
            newPriority = "MEDIUM"
          }
          
          return { ...item, waitTime: newWaitTime, priority: newPriority }
        }).sort((a, b) => {
          const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
          if (a.status === "dispatched" && b.status !== "dispatched") return 1
          if (b.status === "dispatched" && a.status !== "dispatched") return -1
          if (a.supplyType === "medicine" && b.supplyType !== "medicine") return -1
          if (b.supplyType === "medicine" && a.supplyType !== "medicine") return 1
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        })
      })
    }, 3000)
    
    return () => clearInterval(interval)
  }, [])

  const handleApprove = useCallback((id: string) => {
    setQueue(prev => prev.map(item => 
      item.id === id ? { ...item, status: "approved" as const } : item
    ))
  }, [])

  const handleDispatch = useCallback((id: string) => {
    setQueue(prev => prev.map(item => 
      item.id === id ? { ...item, status: "dispatched" as const } : item
    ))
  }, [])

  const urgentCount = queue.filter(q => q.priority === "CRITICAL" || q.priority === "HIGH").length
  const medicineFirst = queue.filter(q => q.supplyType === "medicine" && q.status === "pending").length

  return (
    <div className="relative h-full flex flex-col rounded-xl overflow-hidden border border-border">
      {/* Background */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-MbxtLusR0eRL0zVbifJEv5CGTDY2UH.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'hue-rotate(-30deg) saturate(1.5)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#FF1744]/10 via-[#FFEA00]/5 to-transparent" />
      
      {/* Header */}
      <div className="relative z-10 px-4 py-3 border-b border-border bg-[#0a1628]/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <AlertTriangle className="w-5 h-5 text-[#FF1744]" />
            </motion.div>
            <span className="font-bold text-sm text-foreground">Priority Queue</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[#FF1744] font-mono">{urgentCount} Urgent</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-[#FF1744] font-mono">Medicine First: {medicineFirst}</span>
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="relative z-10 flex-1 overflow-auto p-3 space-y-2">
        <AnimatePresence mode="popLayout">
          {queue.map((item, index) => {
            const Icon = supplyIcons[item.supplyType]
            const color = priorityColors[item.priority]
            const urgencyRatio = item.waitTime / item.maxWait
            const isEscalating = urgencyRatio > 0.75 && item.priority !== "CRITICAL"
            
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -50, scale: 0.8 }}
                animate={{ 
                  opacity: item.status === "dispatched" ? 0.5 : 1, 
                  x: 0, 
                  scale: 1,
                }}
                exit={{ opacity: 0, x: 50, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={`
                  relative p-3 rounded-lg border backdrop-blur-sm
                  ${item.status === "dispatched" ? 'bg-[#00E676]/10 border-[#00E676]/30' : 'bg-[#0a1628]/80 border-border'}
                `}
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: color,
                  boxShadow: isEscalating ? `0 0 20px ${color}40` : undefined,
                }}
              >
                {/* Escalation Glow Animation */}
                {isEscalating && item.status === "pending" && (
                  <motion.div
                    className="absolute inset-0 rounded-lg"
                    style={{ boxShadow: `inset 0 0 20px ${color}30` }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}

                <div className="relative flex items-center justify-between gap-3">
                  {/* Left: Status + Village */}
                  <div className="flex items-center gap-3 min-w-0">
                    <motion.div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                      animate={item.priority === "CRITICAL" ? {
                        scale: [1, 1.3, 1],
                        boxShadow: [`0 0 5px ${color}`, `0 0 15px ${color}`, `0 0 5px ${color}`],
                      } : {}}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground truncate">{item.village}</span>
                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{item.supplyType}</span>
                        <span>•</span>
                        <span>{item.population.toLocaleString()} people</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Timer */}
                  <div className="flex items-center gap-2 px-3">
                    <Clock className="w-4 h-4" style={{ color }} />
                    <motion.span 
                      className="font-mono text-sm font-bold"
                      style={{ color }}
                      animate={item.priority === "CRITICAL" ? {
                        opacity: [1, 0.5, 1],
                      } : {}}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      {formatTime(item.waitTime)}
                    </motion.span>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.status === "pending" && (
                      <motion.button
                        onClick={() => handleApprove(item.id)}
                        className="p-2 rounded-lg border border-[#00E676]/50 bg-[#00E676]/10 hover:bg-[#00E676]/20 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Approve"
                      >
                        <Truck className="w-4 h-4 text-[#00E676]" />
                      </motion.button>
                    )}
                    
                    {item.status === "approved" && (
                      <motion.button
                        onClick={() => handleDispatch(item.id)}
                        className="p-2 rounded-lg border border-[#00E676] bg-[#00E676]/20 hover:bg-[#00E676]/30 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        title="Send"
                      >
                        <Check className="w-4 h-4 text-[#00E676]" />
                      </motion.button>
                    )}
                    
                    {item.status === "dispatched" && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="p-2 rounded-lg bg-[#00E676]/20"
                      >
                        <Check className="w-4 h-4 text-[#00E676]" />
                      </motion.div>
                    )}

                    {/* Priority Badge */}
                    <span 
                      className="px-2 py-1 rounded text-[10px] font-black"
                      style={{ 
                        backgroundColor: `${color}20`,
                        color: color,
                      }}
                    >
                      {item.priority}
                    </span>
                  </div>
                </div>

                {/* Urgency Bar */}
                {item.status === "pending" && (
                  <div className="mt-2 h-1 bg-border/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(urgencyRatio * 100, 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Footer Stats */}
      <div className="relative z-10 px-4 py-2 border-t border-border bg-[#0a1628]/80 backdrop-blur-sm">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Sim Tick: <span className="font-mono text-[#FFEA00]">{simTick}</span></span>
          <span className="text-muted-foreground">Dispatched: <span className="font-mono text-[#00E676]">{queue.filter(q => q.status === "dispatched").length}/{queue.length}</span></span>
        </div>
      </div>
    </div>
  )
}
