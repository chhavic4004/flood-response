"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { 
  Home, 
  Map, 
  Network, 
  BarChart3, 
  Settings,
  AlertTriangle,
  Activity,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { FloodMap } from "@/components/flood-map"
import { NetworkGraph } from "@/components/network-graph"
import { SimulatorPanel } from "@/components/simulator-panel"
import { StatsDashboard } from "@/components/stats-dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("map")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [villagesAtRisk] = useState(27)
  const [systemStatus] = useState<"ready" | "active" | "critical">("active")

  const getStatusColor = () => {
    switch (systemStatus) {
      case "ready": return "#00FF00"
      case "active": return "#FFD700"
      case "critical": return "#FF0000"
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <motion.aside
        className="relative flex flex-col border-r border-border bg-card/50 backdrop-blur-sm"
        animate={{ width: sidebarCollapsed ? 64 : 240 }}
        transition={{ duration: 0.3 }}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <Link href="/" className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg"
              style={{
                background: 'linear-gradient(135deg, #FF0000 0%, #FFD700 100%)',
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
                        ? 'bg-primary/10 text-primary' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                    style={isActive ? { color: '#FF0000' } : {}}
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
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <div>
            <h1 className="text-xl font-bold text-foreground">Flood Response Dashboard</h1>
            <p className="text-sm text-muted-foreground">Dhubri District, Assam</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FF0000]/10 border border-[#FF0000]/30">
              <AlertTriangle className="w-4 h-4 text-[#FF0000]" />
              <span className="text-sm font-mono text-[#FF0000]">{villagesAtRisk} villages at risk</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
              <Activity className="w-4 h-4 text-[#00FF00]" />
              <span className="text-sm font-mono">Live</span>
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
              </TabsList>

              <TabsContent value="map" className="h-[calc(100%-60px)]">
                <FloodMap />
              </TabsContent>

              <TabsContent value="graph" className="h-[calc(100%-60px)]">
                <NetworkGraph />
              </TabsContent>

              <TabsContent value="stats" className="h-[calc(100%-60px)] overflow-auto">
                <StatsDashboard />
              </TabsContent>
            </Tabs>
          </main>

          {/* Right Sidebar - Simulator */}
          <aside className="w-80 border-l border-border bg-card/30 backdrop-blur-sm p-4 overflow-auto hidden lg:block">
            <SimulatorPanel />
          </aside>
        </div>
      </div>
    </div>
  )
}
