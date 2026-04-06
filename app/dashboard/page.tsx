"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { 
  Home, 
  Map, 
  Network, 
  BarChart3, 
  AlertTriangle,
  Activity,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  Route,
  Zap,
  Maximize2
} from "lucide-react"
import { FloodMap } from "@/components/flood-map"
import { NetworkGraph } from "@/components/network-graph"
import { SimulatorPanel } from "@/components/simulator-panel"
import { StatsDashboard } from "@/components/stats-dashboard"
import { PriorityQueue } from "@/components/priority-queue"
import { PredictionsHub } from "@/components/predictions-hub"
import { RerouteCenter } from "@/components/reroute-center"
import { VisualizationDeck } from "@/components/visualization-deck"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("map")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [villagesAtRisk] = useState(27)
  const [systemStatus] = useState<"ready" | "active" | "critical">("active")
  const [showPredictions, setShowPredictions] = useState(false)
  const [rightPanel, setRightPanel] = useState<"simulator" | "queue" | "reroute">("simulator")
  const [vizFullscreen, setVizFullscreen] = useState(false)

  const getStatusColor = () => {
    switch (systemStatus) {
      case "ready": return "#00E676"
      case "active": return "#FFEA00"
      case "critical": return "#FF1744"
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Predictions Modal */}
      <PredictionsHub 
        isOpen={showPredictions} 
        onClose={() => setShowPredictions(false)} 
      />

      {/* Fullscreen Visualization */}
      <AnimatePresence>
        {vizFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80"
          >
            <VisualizationDeck 
              isFullscreen={true}
              onToggleFullscreen={() => setVizFullscreen(false)}
              onClose={() => setVizFullscreen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className="relative flex flex-col border-r border-border"
        style={{ backgroundColor: 'rgba(10, 22, 40, 0.95)' }}
        animate={{ width: sidebarCollapsed ? 64 : 240 }}
        transition={{ duration: 0.3 }}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <Link href="/" className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg"
              style={{
                background: 'linear-gradient(135deg, #FF1744 0%, #FFEA00 100%)',
                color: 'black',
              }}
            >
              S
            </div>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="font-bold text-foreground">Setu</div>
                <div className="text-xs text-muted-foreground">Command Center</div>
              </motion.div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {[
              { id: "map", icon: Map, label: "Map View" },
              { id: "graph", icon: Network, label: "Network Graph" },
              { id: "stats", icon: BarChart3, label: "Dashboard" },
              { id: "viz", icon: Activity, label: "Visualization" },
            ].map(item => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                      ${isActive 
                        ? 'text-white' 
                        : 'text-muted-foreground hover:text-foreground'
                      }
                    `}
                    style={isActive ? { 
                      backgroundColor: 'rgba(255, 23, 68, 0.2)',
                      color: '#FF1744' 
                    } : {}}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Quick Actions */}
          {!sidebarCollapsed && (
            <div className="mt-6 pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2">Quick Actions</div>
              <button
                onClick={() => setShowPredictions(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#FF1744] hover:bg-[#FF1744]/10 transition-colors"
              >
                <Zap className="w-4 h-4" />
                Predictions Hub
              </button>
              <button
                onClick={() => setVizFullscreen(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#FFEA00] hover:bg-[#FFEA00]/10 transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
                Fullscreen Viz
              </button>
            </div>
          )}
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* System Status */}
        <div className="p-4 border-t border-border">
          {!sidebarCollapsed && (
            <div className="text-xs text-muted-foreground mb-2">System Status</div>
          )}
          <div className="flex items-center gap-2">
            <motion.div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getStatusColor() }}
              animate={{ 
                scale: [1, 1.2, 1],
                boxShadow: [
                  `0 0 5px ${getStatusColor()}`,
                  `0 0 15px ${getStatusColor()}`,
                  `0 0 5px ${getStatusColor()}`,
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {!sidebarCollapsed && (
              <span className="text-sm font-medium capitalize" style={{ color: getStatusColor() }}>
                {systemStatus}
              </span>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border" style={{ backgroundColor: 'rgba(10, 22, 40, 0.8)' }}>
          <div>
            <h1 className="text-xl font-bold text-foreground">Flood Response Dashboard</h1>
            <p className="text-sm text-muted-foreground">Dhubri District, Assam</p>
          </div>
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => setShowPredictions(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#FF1744]/50 text-[#FF1744] text-sm hover:bg-[#FF1744]/10 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Zap className="w-4 h-4" />
              Predict
            </motion.button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255, 23, 68, 0.1)', borderColor: 'rgba(255, 23, 68, 0.3)', borderWidth: 1 }}>
              <AlertTriangle className="w-4 h-4 text-[#FF1744]" />
              <span className="text-sm font-mono text-[#FF1744]">{villagesAtRisk} villages at risk</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(0, 230, 118, 0.1)' }}>
              <Activity className="w-4 h-4 text-[#00E676]" />
              <span className="text-sm font-mono text-[#00E676]">Live</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main View */}
          <main className="flex-1 p-6 overflow-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="mb-4">
                <TabsTrigger value="map" className="flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  Map View
                </TabsTrigger>
                <TabsTrigger value="graph" className="flex items-center gap-2">
                  <Network className="w-4 h-4" />
                  Network
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Stats
                </TabsTrigger>
                <TabsTrigger value="viz" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Ripple Viz
                </TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="h-[calc(100%-60px)]">
                <FloodMap onVillageSelect={(village) => village && setShowPredictions(true)} />
              </TabsContent>

              <TabsContent value="graph" className="h-[calc(100%-60px)]">
                <NetworkGraph />
              </TabsContent>

              <TabsContent value="stats" className="h-[calc(100%-60px)] overflow-auto">
                <StatsDashboard />
              </TabsContent>

              <TabsContent value="viz" className="h-[calc(100%-60px)]">
                <VisualizationDeck 
                  isFullscreen={false}
                  onToggleFullscreen={() => setVizFullscreen(true)}
                />
              </TabsContent>
            </Tabs>
          </main>

          {/* Right Sidebar - Panel Switcher */}
          <aside className="w-80 border-l border-border flex flex-col overflow-hidden hidden lg:flex" style={{ backgroundColor: 'rgba(10, 22, 40, 0.5)' }}>
            {/* Panel Tabs */}
            <div className="flex border-b border-border">
              {[
                { id: "simulator", icon: Activity, label: "Sim" },
                { id: "queue", icon: ListOrdered, label: "Queue" },
                { id: "reroute", icon: Route, label: "Routes" },
              ].map(panel => {
                const Icon = panel.icon
                const isActive = rightPanel === panel.id
                return (
                  <button
                    key={panel.id}
                    onClick={() => setRightPanel(panel.id as typeof rightPanel)}
                    className={`
                      flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors
                      ${isActive 
                        ? 'border-b-2 border-[#FF1744] text-[#FF1744]' 
                        : 'text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {panel.label}
                  </button>
                )
              })}
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {rightPanel === "simulator" && (
                  <motion.div
                    key="simulator"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full p-4 overflow-auto"
                  >
                    <SimulatorPanel />
                  </motion.div>
                )}
                {rightPanel === "queue" && (
                  <motion.div
                    key="queue"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <PriorityQueue />
                  </motion.div>
                )}
                {rightPanel === "reroute" && (
                  <motion.div
                    key="reroute"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full"
                  >
                    <RerouteCenter />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
