"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Node {
  id: string
  label: string
  type: "village" | "warehouse" | "hub"
  status: "danger" | "warning" | "safe"
  x: number
  y: number
  connections: string[]
  urgency?: number
}

interface Edge {
  id: string
  from: string
  to: string
  status: "active" | "blocked" | "satellite"
  load?: number
}

const mockNodes: Node[] = [
  { id: "n1", label: "Dhubri Hub", type: "hub", status: "danger", x: 200, y: 200, connections: ["n2", "n3", "n4"], urgency: 0.9 },
  { id: "n2", label: "Warehouse A", type: "warehouse", status: "safe", x: 350, y: 100, connections: ["n1", "n5", "n6"] },
  { id: "n3", label: "Gauripur", type: "village", status: "danger", x: 100, y: 300, connections: ["n1", "n7"], urgency: 0.85 },
  { id: "n4", label: "Golakganj", type: "village", status: "warning", x: 300, y: 320, connections: ["n1", "n8"], urgency: 0.5 },
  { id: "n5", label: "Village A", type: "village", status: "safe", x: 450, y: 50, connections: ["n2"] },
  { id: "n6", label: "Village B", type: "village", status: "warning", x: 500, y: 150, connections: ["n2"], urgency: 0.4 },
  { id: "n7", label: "South Salmara", type: "village", status: "danger", x: 50, y: 400, connections: ["n3"], urgency: 0.95 },
  { id: "n8", label: "Bilasipara", type: "village", status: "safe", x: 400, y: 400, connections: ["n4"] },
  { id: "n9", label: "Satellite Hub", type: "hub", status: "warning", x: 550, y: 300, connections: ["n6", "n8"], urgency: 0.3 },
]

const mockEdges: Edge[] = [
  { id: "e1", from: "n1", to: "n2", status: "active", load: 0.8 },
  { id: "e2", from: "n1", to: "n3", status: "blocked" },
  { id: "e3", from: "n1", to: "n4", status: "active", load: 0.5 },
  { id: "e4", from: "n2", to: "n5", status: "active", load: 0.3 },
  { id: "e5", from: "n2", to: "n6", status: "active", load: 0.6 },
  { id: "e6", from: "n3", to: "n7", status: "blocked" },
  { id: "e7", from: "n4", to: "n8", status: "active", load: 0.4 },
  { id: "e8", from: "n6", to: "n9", status: "satellite" },
  { id: "e9", from: "n8", to: "n9", status: "satellite" },
]

export function NetworkGraph({ onNodeSelect }: { onNodeSelect?: (node: Node | null) => void }) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [rippleNodes, setRippleNodes] = useState<string[]>([])
  const svgRef = useRef<SVGSVGElement>(null)

  // BFS ripple animation for blocked routes
  useEffect(() => {
    const blockedEdges = mockEdges.filter(e => e.status === "blocked")
    if (blockedEdges.length > 0) {
      const interval = setInterval(() => {
        // Start from danger nodes and ripple outward
        const dangerNodes = mockNodes.filter(n => n.status === "danger").map(n => n.id)
        setRippleNodes(dangerNodes)
        
        setTimeout(() => {
          // Second wave - connected nodes
          const secondWave = mockNodes
            .filter(n => n.status === "warning")
            .map(n => n.id)
          setRippleNodes(prev => [...prev, ...secondWave])
        }, 500)
        
        setTimeout(() => {
          setRippleNodes([])
        }, 1500)
      }, 3000)
      
      return () => clearInterval(interval)
    }
  }, [])

  const handleNodeClick = (node: Node) => {
    setSelectedNode(node)
    onNodeSelect?.(node)
  }

  const getNodeColor = (node: Node) => {
    if (node.type === "warehouse") return "#00FF00"
    if (node.type === "hub") return node.status === "danger" ? "#FF0000" : "#FFD700"
    switch (node.status) {
      case "danger": return "#FF0000"
      case "warning": return "#FFD700"
      case "safe": return "#00FF00"
      default: return "#888888"
    }
  }

  const getNodeSize = (node: Node) => {
    if (node.type === "hub") return 30
    if (node.type === "warehouse") return 25
    if (node.urgency) return 15 + node.urgency * 10
    return 15
  }

  const getEdgeColor = (edge: Edge) => {
    switch (edge.status) {
      case "blocked": return "#FF0000"
      case "satellite": return "#FFD700"
      case "active": return "#00FF00"
      default: return "#444444"
    }
  }

  return (
    <div className="relative w-full h-full min-h-[400px] bg-[#0a1628] rounded-xl overflow-hidden border border-border">
      {/* Background grid */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-yRE3Kxlj9qkv08uLgledySFlOaUbfI.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(100%) brightness(0.5)',
        }}
      />

      <svg 
        ref={svgRef}
        className="w-full h-full"
        viewBox="0 0 600 450"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Glow filters */}
          <filter id="glow-red">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glow-yellow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glow-green">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {mockEdges.map(edge => {
          const fromNode = mockNodes.find(n => n.id === edge.from)
          const toNode = mockNodes.find(n => n.id === edge.to)
          if (!fromNode || !toNode) return null

          const edgeColor = getEdgeColor(edge)
          const strokeWidth = edge.load ? 2 + edge.load * 4 : 2

          return (
            <g key={edge.id}>
              <motion.line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={edgeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={edge.status === "blocked" ? "5,5" : edge.status === "satellite" ? "10,5" : "none"}
                opacity={edge.status === "blocked" ? 0.6 : 0.8}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8 }}
              />
              
              {/* Flow animation for active edges */}
              {edge.status === "active" && (
                <motion.circle
                  r="3"
                  fill="#00FF00"
                  filter="url(#glow-green)"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    cx: [fromNode.x, toNode.x],
                    cy: [fromNode.y, toNode.y],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              )}
            </g>
          )
        })}

        {/* Nodes */}
        {mockNodes.map((node, index) => {
          const isHovered = hoveredNode === node.id
          const isSelected = selectedNode?.id === node.id
          const isRippling = rippleNodes.includes(node.id)
          const size = getNodeSize(node)
          const color = getNodeColor(node)
          const filter = node.status === "danger" ? "url(#glow-red)" :
                        node.status === "warning" ? "url(#glow-yellow)" : "url(#glow-green)"

          return (
            <g 
              key={node.id}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => handleNodeClick(node)}
            >
              {/* Ripple effect */}
              <AnimatePresence>
                {isRippling && (
                  <motion.circle
                    cx={node.x}
                    cy={node.y}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    initial={{ r: size, opacity: 1 }}
                    animate={{ r: size * 3, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                  />
                )}
              </AnimatePresence>

              {/* Node circle */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={size}
                fill={color}
                filter={filter}
                initial={{ scale: 0 }}
                animate={{ 
                  scale: isHovered || isSelected ? 1.2 : 1,
                  r: node.status === "danger" && !isHovered ? [size, size * 1.15, size] : size,
                }}
                transition={{ 
                  scale: { duration: 0.2 },
                  r: { duration: 1, repeat: node.status === "danger" ? Infinity : 0 }
                }}
              />

              {/* Node type icon */}
              {node.type === "hub" && (
                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  fill="#000"
                  fontSize="14"
                  fontWeight="bold"
                >
                  H
                </text>
              )}
              {node.type === "warehouse" && (
                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  fill="#000"
                  fontSize="12"
                  fontWeight="bold"
                >
                  W
                </text>
              )}

              {/* Label on hover */}
              <AnimatePresence>
                {(isHovered || isSelected) && (
                  <motion.g
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <rect
                      x={node.x - 50}
                      y={node.y + size + 5}
                      width={100}
                      height={45}
                      rx={5}
                      fill="rgba(10, 22, 40, 0.95)"
                      stroke={color}
                      strokeWidth={1}
                    />
                    <text
                      x={node.x}
                      y={node.y + size + 22}
                      textAnchor="middle"
                      fill={color}
                      fontSize="11"
                      fontWeight="bold"
                    >
                      {node.label}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + size + 38}
                      textAnchor="middle"
                      fill="#888"
                      fontSize="9"
                    >
                      {node.type.toUpperCase()} • {node.status.toUpperCase()}
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 p-3 bg-card/90 backdrop-blur-sm rounded-lg border border-border text-xs">
        <div className="font-bold mb-2 text-foreground">Network Legend</div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#FF0000' }} />
            <span className="text-muted-foreground">High Urgency</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FFD700' }} />
            <span className="text-muted-foreground">Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#00FF00' }} />
            <span className="text-muted-foreground">Stable</span>
          </div>
          <div className="flex items-center gap-2 mt-1 pt-1 border-t border-border">
            <div className="w-5 h-0.5 bg-[#FFD700]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #FFD700 0, #FFD700 4px, transparent 4px, transparent 8px)' }} />
            <span className="text-muted-foreground">Satellite Link</span>
          </div>
        </div>
      </div>
    </div>
  )
}
