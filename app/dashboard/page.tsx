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
  Maximize2,
  Menu,
  X,
  Info
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
import { SimulationProvider, useSimulation } from "@/lib/simulation-context"

function DashboardContent() {
  const [activeTab, setActiveTab] = useState("map")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [villagesAtRisk] = useState(27)
  const [systemStatus] = useState<"ready" | "active" | "critical">("active")
  const [showPredictions, setShowPredictions] = useState(false)
  const [rightPanel, setRightPanel] = useState<"simulator" | "queue" | "reroute">("simulator")
  const [vizFullscreen, setVizFullscreen] = useState(false)
  const [showRightPanel, setShowRightPanel] = useState(false)
  const {
    triggerFlood,
    blockRoad,
    setTimeProgress,
    setFloodLevel,
    activateAirFallback,
    isolateVillage,
    togglePlay,
    reset,
    isPlaying,
  } = useSimulation()

  const getStatusColor = () => {
    switch (systemStatus) {
      case "ready": return "#00E676"
      case "active": return "#FFEA00"
      case "critical": return "#FF1744"
    }
  }

  const getStatusLabel = () => {
    switch (systemStatus) {
      case "ready": return "System Ready - All routes operational"
      case "active": return "Active Response - Monitoring flood conditions"
      case "critical": return "Critical Alert - Multiple routes blocked"
    }
  }

  const navItems = [
    { id: "map", icon: Map, label: "Map View", description: "Interactive flood map with village status" },
    { id: "graph", icon: Network, label: "Network", description: "Supply chain network visualization" },
    { id: "stats", icon: BarChart3, label: "Dashboard", description: "Real-time statistics and metrics" },
    { id: "viz", icon: Activity, label: "Visualization", description: "Flood ripple simulation" },
  ]

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

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop */}
      <motion.aside
        className="hidden lg:flex relative flex-col border-r border-border"
        style={{ backgroundColor: 'rgba(10, 22, 40, 0.95)' }}
        animate={{ width: sidebarCollapsed ? 64 : 260 }}
        transition={{ duration: 0.3 }}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <Link href="/" className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0"
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
        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {navItems.map(item => {
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
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                      }
                    `}
                    style={isActive ? { 
                      backgroundColor: 'rgba(255, 23, 68, 0.2)',
                      color: '#FF1744' 
                    } : {}}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <div className="text-left">
                        <span className="font-medium block">{item.label}</span>
                        <span className="text-[10px] text-muted-foreground">{item.description}</span>
                      </div>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Quick Actions */}
          {!sidebarCollapsed && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground mb-2 px-3">Quick Actions</div>
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
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors z-10"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* System Status */}
        <div className="p-3 border-t border-border">
          {!sidebarCollapsed && (
            <div className="text-xs text-muted-foreground mb-2 px-1">System Status</div>
          )}
          <div className="flex items-center gap-2 px-1">
            <motion.div
              className="w-3 h-3 rounded-full flex-shrink-0"
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
              <span className="text-xs font-medium capitalize" style={{ color: getStatusColor() }}>
                {systemStatus}
              </span>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <motion.aside
        className="fixed top-0 left-0 h-full w-72 z-50 flex flex-col border-r border-border lg:hidden"
        style={{ backgroundColor: 'rgba(10, 22, 40, 0.98)' }}
        initial={{ x: '-100%' }}
        animate={{ x: mobileMenuOpen ? 0 : '-100%' }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
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
            <div>
              <div className="font-bold text-foreground">Setu</div>
              <div className="text-xs text-muted-foreground">Command Center</div>
            </div>
          </Link>
          <button onClick={() => setMobileMenuOpen(false)} className="p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-auto">
          <ul className="space-y-2">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id)
                      setMobileMenuOpen(false)
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
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
                    <div className="text-left">
                      <span className="font-medium block">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2">Quick Actions</div>
            <button
              onClick={() => {
                setShowPredictions(true)
                setMobileMenuOpen(false)
              }}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-[#FF1744] hover:bg-[#FF1744]/10 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Predictions Hub
            </button>
            <button
              onClick={() => {
                setVizFullscreen(true)
                setMobileMenuOpen(false)
              }}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-[#FFEA00] hover:bg-[#FFEA00]/10 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
              Fullscreen Viz
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2">System Status</div>
          <div className="flex items-center gap-2">
            <motion.div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getStatusColor() }}
              animate={{ 
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm" style={{ color: getStatusColor() }}>
              {getStatusLabel()}
            </span>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border" style={{ backgroundColor: 'rgba(10, 22, 40, 0.8)' }}>
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-muted/20 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-foreground">Flood Response Dashboard</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Dhubri District, Assam</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <motion.button
              onClick={() => setShowPredictions(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#FF1744]/50 text-[#FF1744] text-sm hover:bg-[#FF1744]/10 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Zap className="w-4 h-4" />
              <span className="hidden md:inline">Predict</span>
            </motion.button>
            <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255, 23, 68, 0.1)', borderColor: 'rgba(255, 23, 68, 0.3)', borderWidth: 1 }}>
              <AlertTriangle className="w-4 h-4 text-[#FF1744]" />
              <span className="text-xs sm:text-sm font-mono text-[#FF1744]">{villagesAtRisk}</span>
              <span className="text-xs sm:text-sm font-mono text-[#FF1744] hidden sm:inline">villages at risk</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(0, 230, 118, 0.1)' }}>
              <Activity className="w-4 h-4 text-[#00E676]" />
              <span className="text-sm font-mono text-[#00E676]">Live</span>
            </div>
            {/* Mobile right panel toggle */}
            <button
              onClick={() => setShowRightPanel(!showRightPanel)}
              className="p-2 rounded-lg hover:bg-muted/20 lg:hidden"
            >
              <ListOrdered className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Main View */}
          <main className="flex-1 p-3 sm:p-6 overflow-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="mb-3 sm:mb-4 flex-wrap h-auto gap-1">
                <TabsTrigger value="map" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                  <Map className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Map</span>
                </TabsTrigger>
                <TabsTrigger value="graph" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                  <Network className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Network</span>
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                  <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Stats</span>
                </TabsTrigger>
                <TabsTrigger value="viz" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Ripple</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="h-[calc(100%-60px)] min-h-[400px]">
                <FloodMap onVillageSelect={(village) => village && setShowPredictions(true)} />
              </TabsContent>

              <TabsContent value="graph" className="h-[calc(100%-60px)] min-h-[400px]">
                <NetworkGraph />
              </TabsContent>

              <TabsContent value="stats" className="h-[calc(100%-60px)] overflow-auto">
                <StatsDashboard />
              </TabsContent>

              <TabsContent value="viz" className="h-[calc(100%-60px)] min-h-[400px]">
                <VisualizationDeck 
                  isFullscreen={false}
                  onToggleFullscreen={() => setVizFullscreen(true)}
                />
              </TabsContent>
            </Tabs>
          </main>

          {/* Right Sidebar - Desktop */}
          <aside className="w-80 border-l border-border flex-col overflow-hidden hidden lg:flex" style={{ backgroundColor: 'rgba(10, 22, 40, 0.5)' }}>
            {/* Panel Tabs */}
            <div className="flex border-b border-border">
              {[
                { id: "simulator", icon: Activity, label: "Sim", description: "Disaster simulator controls" },
                { id: "queue", icon: ListOrdered, label: "Queue", description: "Priority delivery queue" },
                { id: "reroute", icon: Route, label: "Routes", description: "Rerouting log" },
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
                    title={panel.description}
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
                    <SimulatorPanel
                      onTriggerFlood={triggerFlood}
                      onBlockRoad={() => blockRoad()}
                      onTimeChange={setTimeProgress}
                      onFloodLevelChange={setFloodLevel}
                      onAirFallback={activateAirFallback}
                      onIsolateVillage={isolateVillage}
                      onTogglePlay={togglePlay}
                      onReset={reset}
                      isSimulating={isPlaying}
                    />
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

          {/* Mobile Right Panel Overlay */}
          <AnimatePresence>
            {showRightPanel && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                  onClick={() => setShowRightPanel(false)}
                />
                <motion.aside
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  className="fixed top-0 right-0 h-full w-80 max-w-[90vw] border-l border-border flex flex-col z-40 lg:hidden"
                  style={{ backgroundColor: 'rgba(10, 22, 40, 0.98)' }}
                >
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <span className="font-bold">Control Panel</span>
                    <button onClick={() => setShowRightPanel(false)} className="p-2">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
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
                  <div className="flex-1 overflow-auto">
                    {rightPanel === "simulator" && (
                      <div className="p-4">
                        <SimulatorPanel
                          onTriggerFlood={triggerFlood}
                          onBlockRoad={() => blockRoad()}
                          onTimeChange={setTimeProgress}
                          onFloodLevelChange={setFloodLevel}
                          onAirFallback={activateAirFallback}
                          onIsolateVillage={isolateVillage}
                          onTogglePlay={togglePlay}
                          onReset={reset}
                          isSimulating={isPlaying}
                        />
                      </div>
                    )}
                    {rightPanel === "queue" && <PriorityQueue />}
                    {rightPanel === "reroute" && <RerouteCenter />}
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <SimulationProvider>
      <DashboardContent />
    </SimulationProvider>
  )
}
