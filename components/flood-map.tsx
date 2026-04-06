"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Truck, AlertTriangle, CheckCircle2, Clock } from "lucide-react"

interface Village {
  id: string
  name: string
  lat: number
  lng: number
  status: "danger" | "warning" | "safe"
  urgencyDecay: number
  population: number
  supplies: string[]
}

interface Route {
  id: string
  from: string
  to: string
  status: "active" | "blocked" | "rerouted"
  eta?: number
}

const mockVillages: Village[] = [
  { id: "v1", name: "Dhubri Town", lat: 26.0219, lng: 89.9820, status: "danger", urgencyDecay: 0.9, population: 78520, supplies: ["Medicine", "Food"] },
  { id: "v2", name: "Golakganj", lat: 26.1024, lng: 89.8369, status: "warning", urgencyDecay: 0.6, population: 25340, supplies: ["Water"] },
  { id: "v3", name: "Bilasipara", lat: 26.2311, lng: 90.2321, status: "safe", urgencyDecay: 0.2, population: 18920, supplies: [] },
  { id: "v4", name: "Gauripur", lat: 26.0833, lng: 89.9667, status: "danger", urgencyDecay: 0.85, population: 32100, supplies: ["Medicine", "Shelter"] },
  { id: "v5", name: "Agomoni", lat: 26.1500, lng: 89.7833, status: "warning", urgencyDecay: 0.5, population: 12450, supplies: ["Food"] },
  { id: "v6", name: "Chapar", lat: 26.2833, lng: 90.1667, status: "safe", urgencyDecay: 0.15, population: 8920, supplies: [] },
  { id: "v7", name: "Sapatgram", lat: 26.3333, lng: 90.1167, status: "warning", urgencyDecay: 0.45, population: 15600, supplies: ["Water", "Food"] },
  { id: "v8", name: "South Salmara", lat: 25.9167, lng: 90.0333, status: "danger", urgencyDecay: 0.95, population: 28900, supplies: ["Medicine", "Food", "Shelter"] },
]

const mockRoutes: Route[] = [
  { id: "r1", from: "Dhubri Town", to: "Golakganj", status: "blocked" },
  { id: "r2", from: "Golakganj", to: "Bilasipara", status: "active", eta: 45 },
  { id: "r3", from: "Dhubri Town", to: "Gauripur", status: "rerouted", eta: 90 },
  { id: "r4", from: "Gauripur", to: "Sapatgram", status: "active", eta: 30 },
  { id: "r5", from: "Chapar", to: "Bilasipara", status: "blocked" },
]

export function FloodMap({ onVillageSelect }: { onVillageSelect?: (village: Village | null) => void }) {
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null)
  const [hoveredVillage, setHoveredVillage] = useState<string | null>(null)
  const [truckPositions, setTruckPositions] = useState<{[key: string]: number}>({})

  // Animate trucks along routes
  useEffect(() => {
    const interval = setInterval(() => {
      setTruckPositions(prev => {
        const newPositions = { ...prev }
        mockRoutes.forEach(route => {
          if (route.status === "active" || route.status === "rerouted") {
            newPositions[route.id] = ((prev[route.id] || 0) + 2) % 100
          }
        })
        return newPositions
      })
    }, 100)
    return () => clearInterval(interval)
  }, [])

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
    <div className="relative w-full h-full min-h-[500px] bg-[#0a1628] rounded-xl overflow-hidden border border-border">
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
        {mockRoutes.map(route => {
          const fromVillage = mockVillages.find(v => v.name === route.from)
          const toVillage = mockVillages.find(v => v.name === route.to)
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
      {mockVillages.map((village, index) => {
        const x = lngToX(village.lng)
        const y = latToY(village.lat)
        const isHovered = hoveredVillage === village.id
        const isSelected = selectedVillage?.id === village.id
        const size = village.status === "danger" ? 20 + village.urgencyDecay * 15 : 
                    village.status === "warning" ? 15 + village.urgencyDecay * 10 : 12

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
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-card/95 backdrop-blur-sm rounded-lg border border-border whitespace-nowrap z-50"
                  style={{
                    borderColor: getStatusColor(village.status),
                  }}
                >
                  <div className="text-sm font-bold" style={{ color: getStatusColor(village.status) }}>
                    {village.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Pop: {village.population.toLocaleString()}
                  </div>
                  {village.supplies.length > 0 && (
                    <div className="text-xs mt-1" style={{ color: 'var(--danger)' }}>
                      Needs: {village.supplies.join(", ")}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 p-4 bg-card/90 backdrop-blur-sm rounded-lg border border-border">
        <div className="text-xs font-bold mb-3 text-foreground">FloodGate Legend</div>
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00FF00' }} />
            <span className="text-muted-foreground">Status: Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FFD700' }} />
            <span className="text-muted-foreground">Status: Stage 2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF0000' }} />
            <span className="text-muted-foreground">Status: Stage 3</span>
          </div>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
            <div className="w-6 h-0.5" style={{ backgroundColor: '#00FF00' }} />
            <span className="text-muted-foreground">Active Route</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5" style={{ backgroundColor: '#FFD700', backgroundImage: 'repeating-linear-gradient(90deg, #FFD700 0, #FFD700 4px, transparent 4px, transparent 8px)' }} />
            <span className="text-muted-foreground">Rerouted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5" style={{ backgroundColor: '#FF0000', backgroundImage: 'repeating-linear-gradient(90deg, #FF0000 0, #FF0000 2px, transparent 2px, transparent 4px)' }} />
            <span className="text-muted-foreground">Blocked</span>
          </div>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="absolute top-4 left-4 p-4 bg-card/90 backdrop-blur-sm rounded-lg border border-border">
        <div className="text-xs font-bold mb-2 text-foreground">Total Gate</div>
        <div className="text-4xl font-black font-mono" style={{ color: 'var(--safe)' }}>
          {mockVillages.length}
        </div>
        <div className="mt-3 flex flex-col gap-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FF0000' }} />
            <span style={{ color: '#FF0000' }}>Danger: {mockVillages.filter(v => v.status === 'danger').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FFD700' }} />
            <span style={{ color: '#FFD700' }}>Warning: {mockVillages.filter(v => v.status === 'warning').length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00FF00' }} />
            <span style={{ color: '#00FF00' }}>Safe: {mockVillages.filter(v => v.status === 'safe').length}</span>
          </div>
        </div>
      </div>

      {/* Last Update */}
      <div className="absolute top-4 right-4 px-3 py-2 bg-card/90 backdrop-blur-sm rounded-lg border border-border text-xs text-muted-foreground">
        <Clock className="inline-block w-3 h-3 mr-1" />
        Last Update: {new Date().toLocaleTimeString()}
      </div>
    </div>
  )
}
