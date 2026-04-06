"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Droplets, 
  Route, 
  Clock, 
  Target, 
  Plane,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface SimulatorPanelProps {
  onTriggerFlood?: () => void
  onBlockRoad?: () => void
  onTimeChange?: (time: number) => void
  onFloodLevelChange?: (level: number) => void
  onAirFallback?: () => void
  onIsolateVillage?: (villageId: string) => void
  onTogglePlay?: () => void
  onReset?: () => void
  isSimulating?: boolean
}

export function SimulatorPanel({
  onTriggerFlood,
  onBlockRoad,
  onTimeChange,
  onFloodLevelChange,
  onAirFallback,
  onIsolateVillage,
  onTogglePlay,
  onReset,
  isSimulating,
}: SimulatorPanelProps) {
  const [floodLevel, setFloodLevel] = useState([30])
  const [timeProgress, setTimeProgress] = useState([0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [showFloodBlast, setShowFloodBlast] = useState(false)
  const [blockedRoads, setBlockedRoads] = useState(2)
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium")

  const handleTriggerFlood = () => {
    setShowFloodBlast(true)
    setSeverity("critical")
    setTimeout(() => setShowFloodBlast(false), 1000)
    onTriggerFlood?.()
  }

  const handleBlockRoad = () => {
    setBlockedRoads(prev => prev + 1)
    onBlockRoad?.()
  }

  const handleIsolateVillage = (villageName: string) => {
    onIsolateVillage?.(villageName)
    setSeverity("critical")
  }

  const handleReset = () => {
    setTimeProgress([0])
    setFloodLevel([30])
    setSeverity("low")
    setBlockedRoads(2)
    setIsPlaying(false)
    onReset?.()
  }

  const handlePlayToggle = () => {
    setIsPlaying(prev => !prev)
    onTogglePlay?.()
  }

  const isRunning = isSimulating ?? isPlaying

  const handleTimeChange = (value: number[]) => {
    setTimeProgress(value)
    
    // Update severity based on time
    if (value[0] < 25) setSeverity("low")
    else if (value[0] < 50) setSeverity("medium")
    else if (value[0] < 75) setSeverity("high")
    else setSeverity("critical")
    
    onTimeChange?.(value[0])
  }

  const handleFloodLevelChange = (value: number[]) => {
    setFloodLevel(value)
    onFloodLevelChange?.(value[0])
  }

  const getSeverityColor = () => {
    switch (severity) {
      case "low": return "#00FF00"
      case "medium": return "#FFD700"
      case "high": return "#FF8C00"
      case "critical": return "#FF0000"
    }
  }

  const getSeverityGradient = () => {
    switch (severity) {
      case "low": return "from-[#00FF00]/20 to-transparent"
      case "medium": return "from-[#FFD700]/20 to-transparent"
      case "high": return "from-[#FF8C00]/20 to-transparent"
      case "critical": return "from-[#FF0000]/20 to-transparent"
    }
  }

  return (
    <div className="relative bg-card/90 backdrop-blur-sm rounded-xl border border-border overflow-hidden">
      {/* Background flood drawing effect */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-MbxtLusR0eRL0zVbifJEv5CGTDY2UH.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(50%) blur(2px)',
        }}
      />

      {/* Severity gradient overlay */}
      <motion.div 
        className={`absolute inset-0 bg-gradient-to-b ${getSeverityGradient()} pointer-events-none`}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Flood blast effect */}
      <AnimatePresence>
        {showFloodBlast && (
          <motion.div
            className="absolute inset-0 bg-[#FF0000] rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: getSeverityColor() }} />
            Disaster Simulator
          </h3>
          <div 
            className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
            style={{ 
              backgroundColor: `${getSeverityColor()}20`,
              color: getSeverityColor(),
              border: `1px solid ${getSeverityColor()}40`
            }}
          >
            {severity.toUpperCase()}
          </div>
        </div>

        {/* Info Box */}
        <div className="mb-4 p-2 rounded-lg bg-muted/30 border border-border text-[10px] text-muted-foreground flex items-start gap-2">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>Use these controls to simulate flood scenarios and test rescue route optimization.</span>
        </div>

        {/* Main Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {/* Trigger Flood Button */}
          <motion.button
            onClick={handleTriggerFlood}
            className="relative p-3 rounded-xl text-white font-bold overflow-hidden text-xs"
            style={{
              background: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
              boxShadow: '0 0 15px rgba(255, 0, 0, 0.4)',
            }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(255, 0, 0, 0.6)' }}
            whileTap={{ scale: 0.98 }}
            animate={{
              boxShadow: [
                '0 0 10px rgba(255, 0, 0, 0.4)',
                '0 0 20px rgba(255, 0, 0, 0.6)',
                '0 0 10px rgba(255, 0, 0, 0.4)',
              ],
            }}
            transition={{
              boxShadow: { duration: 1.5, repeat: Infinity },
            }}
          >
            <Droplets className="w-5 h-5 mx-auto mb-1" />
            <span>TRIGGER FLOOD</span>
          </motion.button>

          {/* Block Road Button */}
          <motion.button
            onClick={handleBlockRoad}
            className="relative p-3 rounded-xl font-bold text-xs"
            style={{
              background: 'linear-gradient(135deg, #444 0%, #333 100%)',
              border: '2px solid #FF0000',
              color: '#FF0000',
            }}
            whileHover={{ scale: 1.02, borderColor: '#FF4444' }}
            whileTap={{ scale: 0.98 }}
          >
            <Route className="w-5 h-5 mx-auto mb-1" />
            <span>BLOCK ROAD</span>
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#FF0000] text-white text-[10px] flex items-center justify-center">
              {blockedRoads}
            </span>
          </motion.button>
        </div>

        {/* Time Evolution Slider */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Time Evolution
            </label>
            <span className="text-xs font-mono" style={{ color: getSeverityColor() }}>
              {timeProgress[0]}h
            </span>
          </div>
          <div className="relative">
            <Slider
              value={timeProgress}
              onValueChange={handleTimeChange}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Simulates flood progression over time. Color shifts from green (0h) to red (100h).
          </p>
        </div>

        {/* Flood Level Slider */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Droplets className="w-3 h-3" />
              Flood Level
            </label>
            <span className="text-xs font-mono" style={{ color: floodLevel[0] > 70 ? '#FF0000' : floodLevel[0] > 40 ? '#FFD700' : '#00FF00' }}>
              {floodLevel[0]}%
            </span>
          </div>
          <Slider
            value={floodLevel}
            onValueChange={handleFloodLevelChange}
            max={100}
            step={1}
            className="w-full"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Water level as percentage of danger threshold.
          </p>
        </div>

        {/* Village Isolator */}
        <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Target className="w-3 h-3" />
              Village Isolator
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-2">Click to simulate village becoming cut off:</p>
          <div className="flex flex-wrap gap-1.5">
            {["Dhubri", "Gauripur", "Golakganj", "Bilasipara"].map(village => (
              <motion.button
                key={village}
                onClick={() => handleIsolateVillage(village)}
                className="px-2 py-1 rounded text-[10px] font-medium border transition-colors"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)',
                }}
                whileHover={{ 
                  borderColor: '#FFD700',
                  backgroundColor: 'rgba(255, 215, 0, 0.1)',
                }}
                whileTap={{ scale: 0.95 }}
              >
                {village}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Air Fallback Button */}
        <motion.button
          onClick={onAirFallback}
          className="w-full p-3 rounded-xl font-bold flex items-center justify-center gap-2 text-xs"
          style={{
            background: 'linear-gradient(135deg, #00AA00 0%, #008800 100%)',
            color: 'white',
            boxShadow: '0 0 10px rgba(0, 255, 0, 0.3)',
          }}
          whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)' }}
          whileTap={{ scale: 0.98 }}
        >
          <Plane className="w-4 h-4" />
          ACTIVATE AIR FALLBACK
        </motion.button>
        <p className="text-[10px] text-muted-foreground mt-1 text-center">
          Enables helicopter/drone delivery for isolated villages
        </p>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant={isRunning ? "destructive" : "default"}
            size="sm"
            onClick={handlePlayToggle}
            className="px-6"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
