"use client"

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react"

export interface Village {
  id: string
  name: string
  lat: number
  lng: number
  status: "danger" | "warning" | "safe"
  urgencyDecay: number
  population: number
  supplies: string[]
  isIsolated: boolean
}

export interface Route {
  id: string
  from: string
  to: string
  status: "active" | "blocked" | "rerouted"
  eta?: number
}

export interface SimulationEvent {
  id: string
  timestamp: Date
  type: "flood_trigger" | "road_blocked" | "village_isolated" | "air_fallback" | "time_advance" | "reroute"
  message: string
  severity: "low" | "medium" | "high" | "critical"
}

interface SimulationState {
  // Core simulation state
  villages: Village[]
  routes: Route[]
  events: SimulationEvent[]
  
  // Simulation parameters
  floodLevel: number
  timeProgress: number
  severity: "low" | "medium" | "high" | "critical"
  isPlaying: boolean
  airFallbackActive: boolean
  
  // Actions
  triggerFlood: () => void
  blockRoad: (routeId?: string) => void
  isolateVillage: (villageId: string) => void
  activateAirFallback: () => void
  setFloodLevel: (level: number) => void
  setTimeProgress: (time: number) => void
  togglePlay: () => void
  reset: () => void
  rerouteDelivery: (fromVillage: string, toVillage: string) => void
}

const initialVillages: Village[] = [
  { id: "v1", name: "Dhubri Town", lat: 26.0219, lng: 89.9820, status: "safe", urgencyDecay: 0.2, population: 78520, supplies: [], isIsolated: false },
  { id: "v2", name: "Golakganj", lat: 26.1024, lng: 89.8369, status: "safe", urgencyDecay: 0.15, population: 25340, supplies: [], isIsolated: false },
  { id: "v3", name: "Bilasipara", lat: 26.2311, lng: 90.2321, status: "safe", urgencyDecay: 0.1, population: 18920, supplies: [], isIsolated: false },
  { id: "v4", name: "Gauripur", lat: 26.0833, lng: 89.9667, status: "safe", urgencyDecay: 0.15, population: 32100, supplies: [], isIsolated: false },
  { id: "v5", name: "Agomoni", lat: 26.1500, lng: 89.7833, status: "safe", urgencyDecay: 0.1, population: 12450, supplies: [], isIsolated: false },
  { id: "v6", name: "Chapar", lat: 26.2833, lng: 90.1667, status: "safe", urgencyDecay: 0.1, population: 8920, supplies: [], isIsolated: false },
  { id: "v7", name: "Sapatgram", lat: 26.3333, lng: 90.1167, status: "safe", urgencyDecay: 0.12, population: 15600, supplies: [], isIsolated: false },
  { id: "v8", name: "South Salmara", lat: 25.9167, lng: 90.0333, status: "safe", urgencyDecay: 0.18, population: 28900, supplies: [], isIsolated: false },
]

const initialRoutes: Route[] = [
  { id: "r1", from: "Dhubri Town", to: "Golakganj", status: "active", eta: 25 },
  { id: "r2", from: "Golakganj", to: "Bilasipara", status: "active", eta: 45 },
  { id: "r3", from: "Dhubri Town", to: "Gauripur", status: "active", eta: 20 },
  { id: "r4", from: "Gauripur", to: "Sapatgram", status: "active", eta: 30 },
  { id: "r5", from: "Chapar", to: "Bilasipara", status: "active", eta: 35 },
  { id: "r6", from: "South Salmara", to: "Dhubri Town", status: "active", eta: 40 },
  { id: "r7", from: "Agomoni", to: "Golakganj", status: "active", eta: 20 },
]

const SimulationContext = createContext<SimulationState | null>(null)

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [villages, setVillages] = useState<Village[]>(initialVillages)
  const [routes, setRoutes] = useState<Route[]>(initialRoutes)
  const [events, setEvents] = useState<SimulationEvent[]>([])
  const [floodLevel, setFloodLevelState] = useState(0)
  const [timeProgress, setTimeProgressState] = useState(0)
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("low")
  const [isPlaying, setIsPlaying] = useState(false)
  const [airFallbackActive, setAirFallbackActive] = useState(false)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Add event to log
  const addEvent = useCallback((type: SimulationEvent["type"], message: string, eventSeverity: SimulationEvent["severity"]) => {
    const newEvent: SimulationEvent = {
      id: `event-${Date.now()}`,
      timestamp: new Date(),
      type,
      message,
      severity: eventSeverity,
    }
    setEvents(prev => [newEvent, ...prev].slice(0, 50)) // Keep last 50 events
  }, [])

  // Update village statuses based on flood level and time
  const updateVillageStatuses = useCallback((flood: number, time: number) => {
    setVillages(prev => prev.map(village => {
      const riskFactor = (flood / 100) * 0.6 + (time / 100) * 0.4 + village.urgencyDecay * 0.3
      
      let newStatus: Village["status"] = "safe"
      let newSupplies: string[] = []
      let newUrgency = village.urgencyDecay
      
      if (riskFactor > 0.7 || village.isIsolated) {
        newStatus = "danger"
        newSupplies = ["Medicine", "Food", "Shelter"]
        newUrgency = Math.min(0.95, riskFactor)
      } else if (riskFactor > 0.4) {
        newStatus = "warning"
        newSupplies = riskFactor > 0.55 ? ["Food", "Water"] : ["Water"]
        newUrgency = Math.min(0.7, riskFactor)
      } else {
        newStatus = "safe"
        newSupplies = []
        newUrgency = Math.max(0.1, riskFactor)
      }
      
      return {
        ...village,
        status: village.isIsolated ? "danger" : newStatus,
        supplies: newSupplies,
        urgencyDecay: newUrgency,
      }
    }))
  }, [])

  // Trigger flood event
  const triggerFlood = useCallback(() => {
    const newFloodLevel = Math.min(100, floodLevel + 30)
    setFloodLevelState(newFloodLevel)
    
    // Determine severity
    let newSeverity: SimulationState["severity"] = "low"
    if (newFloodLevel >= 75) newSeverity = "critical"
    else if (newFloodLevel >= 50) newSeverity = "high"
    else if (newFloodLevel >= 25) newSeverity = "medium"
    setSeverity(newSeverity)
    
    // Block a random active route
    setRoutes(prev => {
      const activeRoutes = prev.filter(r => r.status === "active")
      if (activeRoutes.length === 0) return prev
      const randomRoute = activeRoutes[Math.floor(Math.random() * activeRoutes.length)]
      return prev.map(r => r.id === randomRoute.id ? { ...r, status: "blocked" as const } : r)
    })
    
    updateVillageStatuses(newFloodLevel, timeProgress)
    addEvent("flood_trigger", `Flood surge detected! Water level at ${newFloodLevel}%. Routes may be affected.`, newSeverity)
  }, [floodLevel, timeProgress, updateVillageStatuses, addEvent])

  // Block a road
  const blockRoad = useCallback((routeId?: string) => {
    setRoutes(prev => {
      if (routeId) {
        return prev.map(r => r.id === routeId ? { ...r, status: "blocked" as const } : r)
      }
      // Block random active route
      const activeRoutes = prev.filter(r => r.status === "active")
      if (activeRoutes.length === 0) return prev
      const randomRoute = activeRoutes[Math.floor(Math.random() * activeRoutes.length)]
      addEvent("road_blocked", `Route ${randomRoute.from} → ${randomRoute.to} has been blocked due to flooding.`, "high")
      return prev.map(r => r.id === randomRoute.id ? { ...r, status: "blocked" as const } : r)
    })
  }, [addEvent])

  // Isolate a village
  const isolateVillage = useCallback((villageId: string) => {
    setVillages(prev => prev.map(v => {
      if (v.id === villageId || v.name.toLowerCase().includes(villageId.toLowerCase())) {
        addEvent("village_isolated", `${v.name} has been cut off from supply routes. Emergency status activated.`, "critical")
        return { ...v, isIsolated: true, status: "danger" as const, supplies: ["Medicine", "Food", "Shelter", "Rescue"] }
      }
      return v
    }))
    
    // Block routes to/from the village
    setRoutes(prev => prev.map(r => {
      const village = villages.find(v => v.id === villageId || v.name.toLowerCase().includes(villageId.toLowerCase()))
      if (village && (r.from === village.name || r.to === village.name)) {
        return { ...r, status: "blocked" as const }
      }
      return r
    }))
  }, [addEvent, villages])

  // Activate air fallback
  const activateAirFallback = useCallback(() => {
    setAirFallbackActive(true)
    
    // Reroute blocked paths to use "air" delivery (mark as rerouted)
    setRoutes(prev => prev.map(r => 
      r.status === "blocked" ? { ...r, status: "rerouted" as const, eta: (r.eta || 30) + 15 } : r
    ))
    
    addEvent("air_fallback", "Air delivery activated! Helicopters/drones now serving isolated villages.", "medium")
  }, [addEvent])

  // Set flood level
  const setFloodLevel = useCallback((level: number) => {
    setFloodLevelState(level)
    
    let newSeverity: SimulationState["severity"] = "low"
    if (level >= 75) newSeverity = "critical"
    else if (level >= 50) newSeverity = "high"
    else if (level >= 25) newSeverity = "medium"
    setSeverity(newSeverity)
    
    updateVillageStatuses(level, timeProgress)
  }, [timeProgress, updateVillageStatuses])

  // Set time progress
  const setTimeProgress = useCallback((time: number) => {
    setTimeProgressState(time)
    
    let newSeverity: SimulationState["severity"] = "low"
    const combinedRisk = (floodLevel / 100) * 0.5 + (time / 100) * 0.5
    if (combinedRisk >= 0.75) newSeverity = "critical"
    else if (combinedRisk >= 0.5) newSeverity = "high"
    else if (combinedRisk >= 0.25) newSeverity = "medium"
    setSeverity(newSeverity)
    
    updateVillageStatuses(floodLevel, time)
    
    // Random road blocks at certain thresholds
    if (time > 30 && time < 35) blockRoad()
    if (time > 60 && time < 65) blockRoad()
  }, [floodLevel, updateVillageStatuses, blockRoad])

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev)
  }, [])

  // Auto-advance time when playing
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setTimeProgressState(prev => {
          const newTime = prev + 1
          if (newTime >= 100) {
            setIsPlaying(false)
            return 100
          }
          
          // Update village statuses
          updateVillageStatuses(floodLevel, newTime)
          
          // Random events during auto-play
          if (Math.random() < 0.05) {
            blockRoad()
          }
          
          return newTime
        })
      }, 500)
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
    
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [isPlaying, floodLevel, updateVillageStatuses, blockRoad])

  // Reroute delivery
  const rerouteDelivery = useCallback((fromVillage: string, toVillage: string) => {
    // Find blocked route and create reroute
    setRoutes(prev => {
      const blockedRoute = prev.find(r => 
        r.status === "blocked" && 
        (r.from === fromVillage || r.to === toVillage)
      )
      
      if (blockedRoute) {
        addEvent("reroute", `Delivery rerouted: ${blockedRoute.from} → ${blockedRoute.to} via alternate path.`, "medium")
        return prev.map(r => 
          r.id === blockedRoute.id ? { ...r, status: "rerouted" as const, eta: (r.eta || 30) * 1.5 } : r
        )
      }
      return prev
    })
  }, [addEvent])

  // Reset simulation
  const reset = useCallback(() => {
    setVillages(initialVillages)
    setRoutes(initialRoutes)
    setEvents([])
    setFloodLevelState(0)
    setTimeProgressState(0)
    setSeverity("low")
    setIsPlaying(false)
    setAirFallbackActive(false)
    addEvent("time_advance", "Simulation reset. All systems nominal.", "low")
  }, [addEvent])

  return (
    <SimulationContext.Provider value={{
      villages,
      routes,
      events,
      floodLevel,
      timeProgress,
      severity,
      isPlaying,
      airFallbackActive,
      triggerFlood,
      blockRoad,
      isolateVillage,
      activateAirFallback,
      setFloodLevel,
      setTimeProgress,
      togglePlay,
      reset,
      rerouteDelivery,
    }}>
      {children}
    </SimulationContext.Provider>
  )
}

export function useSimulation() {
  const context = useContext(SimulationContext)
  if (!context) {
    throw new Error("useSimulation must be used within a SimulationProvider")
  }
  return context
}
