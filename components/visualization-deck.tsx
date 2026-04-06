"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Play, 
  Pause, 
  SkipBack,
  X,
  Maximize2,
  Minimize2,
  Activity,
  Flame
} from "lucide-react"
import { Slider } from "@/components/ui/slider"

interface Node {
  id: string
  x: number
  y: number
  label: string
  severity: number
  isAffected: boolean
}

interface VisualizationDeckProps {
  isFullscreen: boolean
  onToggleFullscreen: () => void
  onClose?: () => void
}

const generateNodes = (): Node[] => {
  const nodes: Node[] = []
  const centerX = 300
  const centerY = 200
  
  // Central hub
  nodes.push({ id: "hub", x: centerX, y: centerY, label: "Dhubri Hub", severity: 0.9, isAffected: true })
  
  // Surrounding villages
  const villageNames = [
    "South Salmara", "Gauripur", "Golakganj", "Bilasipara", 
    "Agomoni", "Chapar", "Sapatgram", "Tamarhat",
    "Rupsi", "Bagribari", "Balajan", "Fakirganj"
  ]
  
  villageNames.forEach((name, i) => {
    const angle = (i / villageNames.length) * Math.PI * 2
    const radius = 120 + Math.random() * 40
    nodes.push({
      id: `v${i}`,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      label: name,
      severity: Math.random(),
      isAffected: false
    })
  })
  
  // Outer layer
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + 0.2
    const radius = 180 + Math.random() * 30
    nodes.push({
      id: `o${i}`,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      label: `Zone ${i + 1}`,
      severity: Math.random() * 0.5,
      isAffected: false
    })
  }
  
  return nodes
}

export function VisualizationDeck({ isFullscreen, onToggleFullscreen, onClose }: VisualizationDeckProps) {
  const [nodes, setNodes] = useState<Node[]>(() => generateNodes())
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeSlider, setTimeSlider] = useState([0])
  const [rippleWaves, setRippleWaves] = useState<{id: string, x: number, y: number}[]>([])
  const [speed, setSpeed] = useState(1)
  const [impactCount, setImpactCount] = useState(0)

  // BFS Ripple simulation
  const triggerRipple = useCallback((nodeId: string) => {
    const sourceNode = nodes.find(n => n.id === nodeId)
    if (!sourceNode) return

    // Add ripple visual
    setRippleWaves(prev => [...prev, { id: `wave-${Date.now()}`, x: sourceNode.x, y: sourceNode.y }])
    
    // Propagate to nearby nodes
    let affected = 0
    setNodes(prevNodes => {
      return prevNodes.map(node => {
        const distance = Math.sqrt(
          Math.pow(node.x - sourceNode.x, 2) + Math.pow(node.y - sourceNode.y, 2)
        )
        
        if (distance < 100 && node.id !== nodeId && !node.isAffected) {
          affected++
          return { ...node, isAffected: true, severity: Math.min(node.severity + 0.3, 1) }
        }
        return node
      })
    })
    
    setImpactCount(prev => prev + affected)
    
    // Clean up ripple after animation
    setTimeout(() => {
      setRippleWaves(prev => prev.filter(w => w.id !== `wave-${Date.now()}`))
    }, 1000)
  }, [nodes])

  // Auto-play simulation
  useEffect(() => {
    if (!isPlaying) return
    
    const interval = setInterval(() => {
      setTimeSlider(prev => {
        const newVal = Math.min(prev[0] + 1, 100)
        
        // Trigger ripples at certain time points
        if (newVal % 15 === 0) {
          const unaffectedNodes = nodes.filter(n => !n.isAffected)
          if (unaffectedNodes.length > 0) {
            const affectedNodes = nodes.filter(n => n.isAffected)
            if (affectedNodes.length > 0) {
              triggerRipple(affectedNodes[Math.floor(Math.random() * affectedNodes.length)].id)
            }
          }
        }
        
        if (newVal >= 100) {
          setIsPlaying(false)
          return [100]
        }
        return [newVal]
      })
    }, 1000 / speed)
    
    return () => clearInterval(interval)
  }, [isPlaying, speed, nodes, triggerRipple])

  // Update severity based on time slider
  useEffect(() => {
    const timeRatio = timeSlider[0] / 100
    setNodes(prev => prev.map(node => ({
      ...node,
      severity: node.isAffected 
        ? Math.min(0.3 + timeRatio * 0.7, 1)
        : node.severity * (1 + timeRatio * 0.5)
    })))
  }, [timeSlider])

  const handleReset = () => {
    setNodes(generateNodes())
    setTimeSlider([0])
    setIsPlaying(false)
    setImpactCount(0)
    setRippleWaves([])
  }

  const handleNodeClick = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (node && !node.isAffected) {
      setNodes(prev => prev.map(n => 
        n.id === nodeId ? { ...n, isAffected: true } : n
      ))
    }
    triggerRipple(nodeId)
  }

  const getSeverityColor = (severity: number, isAffected: boolean) => {
    if (!isAffected && severity < 0.4) return "#00E676"
    if (severity > 0.7) return "#FF1744"
    if (severity > 0.4) return "#FFEA00"
    return "#00E676"
  }

  return (
    <div className={`
      relative flex flex-col bg-[#0a1628] border border-border rounded-xl overflow-hidden
      ${isFullscreen ? 'fixed inset-4 z-50' : 'h-full'}
    `}>
      {/* Background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-yRE3Kxlj9qkv08uLgledySFlOaUbfI.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(100%) brightness(0.3)',
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-[#0a1628]/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ duration: 2, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
          >
            <Activity className="w-5 h-5 text-[#FF1744]" />
          </motion.div>
          <div>
            <h3 className="font-bold text-sm text-foreground">Ripple & Heat: See the Chaos Unfold</h3>
            <p className="text-[10px] text-muted-foreground">Click nodes to trigger ripple • Watch cascade spread</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#FF1744] font-mono">
            Impact: {impactCount} Villages
          </span>
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded hover:bg-muted transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex">
        {/* Left: Ripple Simulator */}
        <div className="flex-1 relative">
          <svg className="w-full h-full" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="glow-red-viz">
                <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="glow-yellow-viz">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Connections */}
            {nodes.slice(1).map((node, i) => (
              <motion.line
                key={`line-${node.id}`}
                x1={nodes[0].x}
                y1={nodes[0].y}
                x2={node.x}
                y2={node.y}
                stroke={node.isAffected ? "#FF1744" : "#333"}
                strokeWidth={node.isAffected ? 2 : 1}
                opacity={node.isAffected ? 0.6 : 0.2}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: i * 0.02 }}
              />
            ))}

            {/* Ripple Waves */}
            <AnimatePresence>
              {rippleWaves.map(wave => (
                <motion.circle
                  key={wave.id}
                  cx={wave.x}
                  cy={wave.y}
                  fill="none"
                  stroke="#FFEA00"
                  strokeWidth={2}
                  initial={{ r: 10, opacity: 1 }}
                  animate={{ r: 120, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              ))}
            </AnimatePresence>

            {/* Nodes */}
            {nodes.map((node, i) => {
              const color = getSeverityColor(node.severity, node.isAffected)
              const size = node.id === "hub" ? 20 : 8 + node.severity * 8
              const filter = node.severity > 0.7 ? "url(#glow-red-viz)" : 
                            node.severity > 0.4 ? "url(#glow-yellow-viz)" : undefined
              
              return (
                <g 
                  key={node.id} 
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleNodeClick(node.id)}
                >
                  {/* Pulse for affected nodes */}
                  {node.isAffected && (
                    <motion.circle
                      cx={node.x}
                      cy={node.y}
                      r={size}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      animate={{ r: [size, size + 15], opacity: [0.8, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  
                  <motion.circle
                    cx={node.x}
                    cy={node.y}
                    r={size}
                    fill={color}
                    filter={filter}
                    initial={{ scale: 0 }}
                    animate={{ 
                      scale: 1,
                      r: node.isAffected ? [size, size * 1.1, size] : size
                    }}
                    transition={{ 
                      scale: { delay: i * 0.02 },
                      r: { duration: 1, repeat: node.isAffected ? Infinity : 0 }
                    }}
                    whileHover={{ scale: 1.2 }}
                  />
                  
                  {/* Label for hub */}
                  {node.id === "hub" && (
                    <text
                      x={node.x}
                      y={node.y + 4}
                      textAnchor="middle"
                      fill="#000"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      H
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Right: Severity Heatmap */}
        <div className="w-48 border-l border-border p-3 bg-[#0a1628]/50">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-[#FF1744]" />
            <span className="text-xs font-bold text-foreground">Severity Map</span>
          </div>
          
          <div className="grid grid-cols-4 gap-1">
            {nodes.slice(1, 17).map((node, i) => {
              const color = getSeverityColor(node.severity, node.isAffected)
              return (
                <motion.div
                  key={node.id}
                  className="aspect-square rounded"
                  style={{ backgroundColor: color }}
                  animate={{ 
                    opacity: 0.3 + node.severity * 0.7,
                    scale: node.isAffected ? [1, 1.05, 1] : 1
                  }}
                  transition={{ 
                    scale: { duration: 1, repeat: node.isAffected ? Infinity : 0 }
                  }}
                  title={node.label}
                />
              )
            })}
          </div>

          <div className="mt-4 space-y-2">
            <div className="text-[10px] text-muted-foreground">Time Evolution</div>
            <div className="h-2 bg-gradient-to-r from-[#00E676] via-[#FFEA00] to-[#FF1744] rounded-full" />
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>0h</span>
              <span>{Math.round(timeSlider[0] / 100 * 24)}h</span>
              <span>24h</span>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 p-2 rounded-lg bg-background/50 border border-border">
            <div className="text-[10px] text-muted-foreground mb-1">Cascade Stats</div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-[#FF1744] font-mono">{nodes.filter(n => n.isAffected).length}</span>
                <span className="text-muted-foreground ml-1">Affected</span>
              </div>
              <div>
                <span className="text-[#00E676] font-mono">{nodes.filter(n => !n.isAffected).length}</span>
                <span className="text-muted-foreground ml-1">Safe</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 px-4 py-3 border-t border-border bg-[#0a1628]/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {/* Play Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Reset"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <motion.button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg bg-[#FF1744] text-white"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </motion.button>
          </div>

          {/* Time Slider */}
          <div className="flex-1">
            <Slider
              value={timeSlider}
              onValueChange={setTimeSlider}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Speed Control */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Speed:</span>
            {[1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded ${speed === s ? 'bg-[#FF1744] text-white' : 'bg-muted'}`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
