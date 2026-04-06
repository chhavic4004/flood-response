"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, Info, HelpCircle } from "lucide-react"
import { useSimulation, type Village } from "@/lib/simulation-context"

export function FloodMap({ onVillageSelect }: { onVillageSelect?: (village: Village | null) => void }) {
  const { villages, routes } = useSimulation()
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null)
  const [hoveredVillage, setHoveredVillage] = useState<string | null>(null)
  const [truckPositions, setTruckPositions] = useState<{[key: string]: number}>({})
  const [showHelp, setShowHelp] = useState(false)

  // Animate trucks along routes
  useEffect(() => {
    const interval = setInterval(() => {
      setTruckPositions(prev => {
        const newPositions = { ...prev }
        routes.forEach(route => {
          if (route.status === "active" || route.status === "rerouted") {
            newPositions[route.id] = ((prev[route.id] || 0) + 2) % 100
          }
        })
        return newPositions
      })
    }, 100)
    return () => clearInterval(interval)
  }, [routes])

  const handleVillageClick = (village: Village) => {
    setSelectedVillage(village)
    onVillageSelect?.(village)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "danger": return "#FF0000"
      case "warning": return "#FFD700"
      case "safe": return "#00FF00"
      default: return "#888888"
    }
  }

  const getStatusGlow = (status: string) => {
    switch (status) {
      case "danger": return "0 0 20px rgba(255, 0, 0, 0.6)"
      case "warning": return "0 0 15px rgba(255, 215, 0, 0.5)"
      case "safe": return "0 0 10px rgba(0, 255, 0, 0.4)"
      default: return "none"
    }
  }

  // Map bounds for Dhubri district
  const mapBounds = {
    minLat: 25.85,
    maxLat: 26.4,
    minLng: 89.7,
    maxLng: 90.35,
  }

  const latToY = (lat: number) => {
    return ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) * 100
  }

  const lngToX = (lng: number) => {
    return ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100
  }

  return (
    <div className="relative w-full h-full min-h-[300px] sm:min-h-[500px] bg-[#0a1628] rounded-xl overflow-hidden border border-border">
      {/* Background Map Image */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-0o7KsuxGuLwJsXt84b2wbGLPPE8zo9.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'hue-rotate(180deg) saturate(0.5)',
        }}
      />

      {/* Map Grid Overlay */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <pattern id="grid" width="10%" height="10%" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(0,255,0,0.1)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Routes */}
        {routes.map(route => {
          const fromVillage = villages.find(v => v.name === route.from)
          const toVillage = villages.find(v => v.name === route.to)
          if (!fromVillage || !toVillage) return null

          const x1 = lngToX(fromVillage.lng)
          const y1 = latToY(fromVillage.lat)
          const x2 = lngToX(toVillage.lng)
          const y2 = latToY(toVillage.lat)

          const routeColor = route.status === "blocked" ? "#FF0000" : 
                            route.status === "rerouted" ? "#FFD700" : "#00FF00"

          return (
            <g key={route.id}>
              <motion.line
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke={routeColor}
                strokeWidth={route.status === "blocked" ? 2 : 3}
                strokeDasharray={route.status === "blocked" ? "5,5" : route.status === "rerouted" ? "10,5" : "none"}
                opacity={0.7}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              />
              
              {/* Blocked X marker */}
              {route.status === "blocked" && (
                <g>
                  <motion.line
                    x1={`${(x1 + x2) / 2 - 2}%`}
                    y1={`${(y1 + y2) / 2 - 2}%`}
                    x2={`${(x1 + x2) / 2 + 2}%`}
                    y2={`${(y1 + y2) / 2 + 2}%`}
                    stroke="#FF0000"
                    strokeWidth={3}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <motion.line
                    x1={`${(x1 + x2) / 2 + 2}%`}
                    y1={`${(y1 + y2) / 2 - 2}%`}
                    x2={`${(x1 + x2) / 2 - 2}%`}
                    y2={`${(y1 + y2) / 2 + 2}%`}
                    stroke="#FF0000"
                    strokeWidth={3}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </g>
              )}

              {/* Truck Animation */}
              {(route.status === "active" || route.status === "rerouted") && (
                <motion.circle
                  cx={`${x1 + (x2 - x1) * (truckPositions[route.id] || 0) / 100}%`}
                  cy={`${y1 + (y2 - y1) * (truckPositions[route.id] || 0) / 100}%`}
                  r="6"
                  fill="#00FF00"
                  filter="drop-shadow(0 0 5px rgba(0, 255, 0, 0.8))"
                />
              )}
            </g>
          )
        })}
      </svg>

      {/* Village Markers */}
      {villages.map((village, index) => {
        const x = lngToX(village.lng)
        const y = latToY(village.lat)
        const isHovered = hoveredVillage === village.id
        const isSelected = selectedVillage?.id === village.id
        const size = village.status === "danger" ? 16 + village.urgencyDecay * 10 : 
                    village.status === "warning" ? 12 + village.urgencyDecay * 8 : 10

        return (
          <motion.div
            key={village.id}
            className="absolute cursor-pointer"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: isHovered || isSelected ? 1.3 : 1, 
              opacity: 1 
            }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onMouseEnter={() => setHoveredVillage(village.id)}
            onMouseLeave={() => setHoveredVillage(null)}
            onClick={() => handleVillageClick(village)}
          >
            <motion.div
              className="rounded-full"
              style={{
                width: size,
                height: size,
                backgroundColor: getStatusColor(village.status),
                boxShadow: getStatusGlow(village.status),
              }}
              animate={village.status === "danger" ? {
                scale: [1, 1.2, 1],
                boxShadow: [
                  "0 0 20px rgba(255, 0, 0, 0.6)",
                  "0 0 40px rgba(255, 0, 0, 0.8)",
                  "0 0 20px rgba(255, 0, 0, 0.6)",
                ],
              } : {}}
              transition={village.status === "danger" ? {
                duration: 1,
                repeat: Infinity,
              } : {}}
            />
            
            {/* Village Label */}
            <AnimatePresence>
              {(isHovered || isSelected) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-card/95 backdrop-blur-sm rounded-lg border border-border whitespace-nowrap z-50"
                  style={{
                    borderColor: getStatusColor(village.status),
                  }}
                >
                  <div className="text-xs sm:text-sm font-bold" style={{ color: getStatusColor(village.status) }}>
                    {village.name}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    Pop: {village.population.toLocaleString()}
                  </div>
                  {village.supplies.length > 0 && (
                    <div className="text-[10px] sm:text-xs mt-1" style={{ color: '#FF0000' }}>
                      Needs: {village.supplies.join(", ")}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}

      {/* Help Button */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 rounded-lg bg-card/90 border border-border hover:bg-card transition-colors z-20"
      >
        <HelpCircle className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Help Panel */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-12 right-2 sm:top-14 sm:right-4 p-3 sm:p-4 bg-card/95 backdrop-blur-sm rounded-lg border border-border z-20 max-w-[200px] sm:max-w-xs"
          >
            <div className="text-xs sm:text-sm font-bold mb-2 text-foreground flex items-center gap-2">
              <Info className="w-4 h-4" />
              How to Read This Map
            </div>
            <div className="space-y-2 text-[10px] sm:text-xs text-muted-foreground">
              <p><strong>Dots</strong> represent villages. Click to see details.</p>
              <p><strong>Dot size</strong> indicates urgency level - larger = more urgent.</p>
              <p><strong>Pulsing red dots</strong> need immediate assistance.</p>
              <p><strong>Lines</strong> show supply routes between villages.</p>
              <p><strong>Moving green dots</strong> on routes are supply trucks in transit.</p>
              <p><strong>X marks</strong> indicate blocked/flooded routes.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend - Responsive positioning */}
      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 p-2 sm:p-4 bg-card/90 backdrop-blur-sm rounded-lg border border-border max-w-[150px] sm:max-w-none">
        <div className="text-[10px] sm:text-xs font-bold mb-2 sm:mb-3 text-foreground">Village Status Legend</div>
        <div className="flex flex-col gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#FF0000', boxShadow: '0 0 6px rgba(255,0,0,0.6)' }} />
            <div>
              <span className="text-muted-foreground font-medium" style={{ color: '#FF0000' }}>Danger</span>
              <span className="text-muted-foreground hidden sm:inline"> - Critical flood, needs rescue</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#FFD700', boxShadow: '0 0 6px rgba(255,215,0,0.6)' }} />
            <div>
              <span className="text-muted-foreground font-medium" style={{ color: '#FFD700' }}>Warning</span>
              <span className="text-muted-foreground hidden sm:inline"> - Rising water, monitor</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#00FF00', boxShadow: '0 0 6px rgba(0,255,0,0.6)' }} />
            <div>
              <span className="text-muted-foreground font-medium" style={{ color: '#00FF00' }}>Safe</span>
              <span className="text-muted-foreground hidden sm:inline"> - Stable conditions</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1 sm:mt-2 pt-1 sm:pt-2 border-t border-border">
            <div className="w-5 sm:w-6 h-0.5" style={{ backgroundColor: '#00FF00' }} />
            <span className="text-muted-foreground">Active Route</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 sm:w-6 h-0.5" style={{ backgroundColor: '#FFD700', backgroundImage: 'repeating-linear-gradient(90deg, #FFD700 0, #FFD700 4px, transparent 4px, transparent 8px)' }} />
            <span className="text-muted-foreground">Rerouted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 sm:w-6 h-0.5" style={{ backgroundColor: '#FF0000', backgroundImage: 'repeating-linear-gradient(90deg, #FF0000 0, #FF0000 2px, transparent 2px, transparent 4px)' }} />
            <span className="text-muted-foreground">Blocked</span>
          </div>
        </div>
      </div>

      {/* Mini Stats - Responsive */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 p-2 sm:p-4 bg-card/90 backdrop-blur-sm rounded-lg border border-border">
        <div className="text-[10px] sm:text-xs font-bold mb-1 sm:mb-2 text-foreground">Total Villages</div>
        <div className="text-2xl sm:text-4xl font-black font-mono" style={{ color: '#00FF00' }}>
          {villages.length}
        </div>
        <div className="mt-2 sm:mt-3 flex flex-col gap-0.5 sm:gap-1 text-[10px] sm:text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FF0000' }} />
            <span style={{ color: '#FF0000' }}>Danger: {villages.filter(v => v.status === 'danger').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FFD700' }} />
            <span style={{ color: '#FFD700' }}>Warning: {villages.filter(v => v.status === 'warning').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00FF00' }} />
            <span style={{ color: '#00FF00' }}>Safe: {villages.filter(v => v.status === 'safe').length}</span>
          </div>
        </div>
      </div>

      {/* Last Update - Hidden on very small screens */}
      <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 px-2 sm:px-3 py-1 sm:py-2 bg-card/90 backdrop-blur-sm rounded-lg border border-border text-[10px] sm:text-xs text-muted-foreground hidden xs:block">
        <Clock className="inline-block w-3 h-3 mr-1" />
        Last Update: {new Date().toLocaleTimeString()}
      </div>
    </div>
  )
}
