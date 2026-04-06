"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Route, 
  Satellite, 
  ChevronDown, 
  ChevronUp,
  Check,
  X as XIcon,
  Truck,
  Clock
} from "lucide-react"

interface RerouteEntry {
  id: string
  timestamp: Date
  blockLocation: string
  originalRoute: string
  newRoute: string
  method: "buddy" | "satellite" | "alternate"
  etaDiff: number // negative = faster
  status: "active" | "completed" | "failed"
  truckId: string
}

const mockReroutes: RerouteEntry[] = [
  {
    id: "r1",
    timestamp: new Date(Date.now() - 120000),
    blockLocation: "Bridge @ Gauripur",
    originalRoute: "Dhubri → Gauripur → South Salmara",
    newRoute: "Dhubri → Golakganj → Buddy Village Q → South Salmara",
    method: "buddy",
    etaDiff: -5,
    status: "active",
    truckId: "TRK-001"
  },
  {
    id: "r2",
    timestamp: new Date(Date.now() - 300000),
    blockLocation: "Flood @ Agomoni Road",
    originalRoute: "Warehouse A → Agomoni",
    newRoute: "Warehouse A → Satellite Link → Agomoni",
    method: "satellite",
    etaDiff: 15,
    status: "active",
    truckId: "TRK-003"
  },
  {
    id: "r3",
    timestamp: new Date(Date.now() - 600000),
    blockLocation: "Landslide @ NH-31",
    originalRoute: "Bilasipara → Chapar",
    newRoute: "Bilasipara → Sapatgram → Chapar",
    method: "alternate",
    etaDiff: 8,
    status: "completed",
    truckId: "TRK-002"
  },
  {
    id: "r4",
    timestamp: new Date(Date.now() - 900000),
    blockLocation: "Water Level @ Dhubri Bridge",
    originalRoute: "Hub → Dhubri Town",
    newRoute: "Hub → Buddy Golakganj → Dhubri Town",
    method: "buddy",
    etaDiff: -3,
    status: "completed",
    truckId: "TRK-005"
  },
]

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export function RerouteCenter() {
  const [reroutes, setReroutes] = useState<RerouteEntry[]>(mockReroutes)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newReroute, setNewReroute] = useState<RerouteEntry | null>(null)

  // Simulate new reroute arriving
  useEffect(() => {
    const timeout = setTimeout(() => {
      const newEntry: RerouteEntry = {
        id: `r${Date.now()}`,
        timestamp: new Date(),
        blockLocation: "Flash Flood @ Tamarhat",
        originalRoute: "Golakganj → Tamarhat → Agomoni",
        newRoute: "Golakganj → Satellite Emergency → Agomoni",
        method: "satellite",
        etaDiff: 10,
        status: "active",
        truckId: "TRK-007"
      }
      setNewReroute(newEntry)
      
      setTimeout(() => {
        setReroutes(prev => [newEntry, ...prev])
        setNewReroute(null)
      }, 2000)
    }, 5000)
    
    return () => clearTimeout(timeout)
  }, [])

  const activeCount = reroutes.filter(r => r.status === "active").length

  const getMethodColor = (method: string) => {
    switch (method) {
      case "buddy": return "#00E676"
      case "satellite": return "#FFEA00"
      case "alternate": return "#00BFFF"
      default: return "#888888"
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "satellite": return Satellite
      default: return Route
    }
  }

  return (
    <div className="relative h-full flex flex-col rounded-xl overflow-hidden border border-border">
      {/* Background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-0o7KsuxGuLwJsXt84b2wbGLPPE8zo9.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(50%)',
        }}
      />
      
      {/* Header */}
      <div className="relative z-10 px-4 py-3 border-b border-border bg-[#0a1628]/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-[#00E676]" />
            <span className="font-bold text-sm text-foreground">Live Reroutes</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#00E676] font-mono">{activeCount} Active</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">Network Holding</span>
          </div>
        </div>
      </div>

      {/* New Reroute Animation */}
      <AnimatePresence>
        {newReroute && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-20 overflow-hidden"
          >
            <div className="p-3 bg-[#00E676]/20 border-b border-[#00E676]/50">
              <div className="flex items-center gap-2 text-[#00E676]">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <Route className="w-4 h-4" />
                </motion.div>
                <span className="text-xs font-bold">New Reroute Calculating...</span>
              </div>
              <motion.div
                className="mt-2 h-1 bg-[#0a1628] rounded-full overflow-hidden"
              >
                <motion.div
                  className="h-full bg-[#00E676]"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2 }}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reroute List */}
      <div className="relative z-10 flex-1 overflow-auto">
        <AnimatePresence>
          {reroutes.map((reroute, index) => {
            const MethodIcon = getMethodIcon(reroute.method)
            const methodColor = getMethodColor(reroute.method)
            const isExpanded = expandedId === reroute.id
            
            return (
              <motion.div
                key={reroute.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-border/50"
              >
                {/* Main Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : reroute.id)}
                  className="w-full p-3 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      {/* Status Indicator */}
                      <motion.div
                        className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: reroute.status === "active" ? "#00E676" : reroute.status === "completed" ? "#888" : "#FF1744" }}
                        animate={reroute.status === "active" ? {
                          scale: [1, 1.3, 1],
                          boxShadow: ['0 0 5px #00E676', '0 0 10px #00E676', '0 0 5px #00E676'],
                        } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">
                          Road Block @ {reroute.blockLocation.split('@')[1]?.trim() || reroute.blockLocation}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(reroute.timestamp)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* ETA Diff */}
                      <span 
                        className="text-[10px] font-mono font-bold"
                        style={{ color: reroute.etaDiff < 0 ? '#00E676' : '#FFEA00' }}
                      >
                        {reroute.etaDiff > 0 ? '+' : ''}{reroute.etaDiff}min
                      </span>
                      
                      {/* Method Badge */}
                      <div 
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{ backgroundColor: `${methodColor}20`, color: methodColor }}
                      >
                        <MethodIcon className="w-3 h-3" />
                        {reroute.method.toUpperCase()}
                      </div>
                      
                      {/* Expand Icon */}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-2">
                        {/* Route Visualization */}
                        <div className="p-2 rounded-lg bg-background/50 border border-border">
                          {/* Old Route */}
                          <div className="flex items-center gap-2 text-[10px]">
                            <XIcon className="w-3 h-3 text-[#FF1744]" />
                            <motion.span 
                              className="text-muted-foreground line-through"
                              initial={{ opacity: 1 }}
                              animate={{ opacity: 0.5 }}
                            >
                              {reroute.originalRoute}
                            </motion.span>
                          </div>
                          
                          {/* Animated transition line */}
                          <motion.div
                            className="my-1 h-px mx-4"
                            style={{ backgroundColor: methodColor }}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.5 }}
                          />
                          
                          {/* New Route */}
                          <div className="flex items-center gap-2 text-[10px]">
                            <Check className="w-3 h-3 text-[#00E676]" />
                            <motion.span 
                              className="text-foreground font-medium"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.3 }}
                            >
                              {reroute.newRoute}
                            </motion.span>
                          </div>
                        </div>

                        {/* Truck Info */}
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Truck className="w-3 h-3" />
                            <span>{reroute.truckId}</span>
                          </div>
                          <span 
                            className="font-bold"
                            style={{ color: reroute.status === "active" ? "#00E676" : "#888" }}
                          >
                            {reroute.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative z-10 px-4 py-2 border-t border-border bg-[#0a1628]/80 backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1" style={{ color: '#00E676' }}>
              <div className="w-2 h-2 rounded-full bg-[#00E676]" />
              <span>Buddy: {reroutes.filter(r => r.method === 'buddy').length}</span>
            </div>
            <div className="flex items-center gap-1" style={{ color: '#FFEA00' }}>
              <Satellite className="w-3 h-3" />
              <span>Satellite: {reroutes.filter(r => r.method === 'satellite').length}</span>
            </div>
          </div>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-[#00E676] text-[10px]"
          >
            ● Network Stable
          </motion.div>
        </div>
      </div>
    </div>
  )
}
