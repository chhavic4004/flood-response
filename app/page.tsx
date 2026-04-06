"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Waves, Mountain, Wind, AlertTriangle, Activity, MapPin, Info } from "lucide-react"
import Link from "next/link"

const disasters = [
  {
    id: "flood",
    name: "Flood",
    icon: Waves,
    description: "Real-time rescue routing during floods",
    active: true,
  },
  {
    id: "earthquake",
    name: "Earthquake",
    icon: Mountain,
    description: "Emergency response for seismic events",
    active: false,
  },
  {
    id: "cyclone",
    name: "Cyclone",
    icon: Wind,
    description: "Storm tracking and evacuation routes",
    active: false,
  },
]

export default function LandingPage() {
  const [selectedDisaster, setSelectedDisaster] = useState("flood")
  const [villagesAtRisk] = useState(27)

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Blurred Flood Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-15"
        style={{
          backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-twwzfDNVxr0OB1BFgpYUDVNquP9Odm.png')`,
          filter: 'blur(4px)',
        }}
      />
      
      {/* Water Ripple Animation Overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0066cc]/20 to-transparent"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3 gap-2 sm:gap-0 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: '#00FF00' }} />
            <span className="text-xs sm:text-sm font-mono text-muted-foreground">System Ready</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 font-mono text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: villagesAtRisk > 0 ? '#FF0000' : '#00FF00' }} />
            <span style={{ color: villagesAtRisk > 0 ? '#FF0000' : 'inherit' }}>
              {villagesAtRisk} villages at risk
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: '#00FF00' }} />
            <span>Ready</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-4">
            <span className="bg-gradient-to-r from-[#FF0000] via-[#FF4500] to-[#FFD700] bg-clip-text text-transparent">
              Setu
            </span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2">
            Lifeline for Assam Floods
          </p>
          <p className="text-base sm:text-lg max-w-xl mx-auto px-4" style={{ color: '#FFD700' }}>
            Real-time rescue routes when roads fail
          </p>
        </motion.div>

        {/* Status Color Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 sm:mb-8 p-3 sm:p-4 rounded-xl bg-card/60 backdrop-blur-sm border border-border max-w-lg w-full mx-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs sm:text-sm font-semibold text-foreground">Status Color Guide</span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#FF0000', boxShadow: '0 0 8px rgba(255,0,0,0.6)' }} />
              <div>
                <div className="font-semibold" style={{ color: '#FF0000' }}>Danger</div>
                <div className="text-muted-foreground text-[10px] sm:text-xs">Critical - Immediate help needed</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#FFD700', boxShadow: '0 0 8px rgba(255,215,0,0.6)' }} />
              <div>
                <div className="font-semibold" style={{ color: '#FFD700' }}>Warning</div>
                <div className="text-muted-foreground text-[10px] sm:text-xs">At risk - Monitor closely</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#00FF00', boxShadow: '0 0 8px rgba(0,255,0,0.6)' }} />
              <div>
                <div className="font-semibold" style={{ color: '#00FF00' }}>Safe</div>
                <div className="text-muted-foreground text-[10px] sm:text-xs">Stable - No immediate threat</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Disaster Selector Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl w-full mb-8 sm:mb-12 px-4"
        >
          {disasters.map((disaster, index) => {
            const Icon = disaster.icon
            const isSelected = selectedDisaster === disaster.id
            const isActive = disaster.active

            return (
              <motion.button
                key={disaster.id}
                onClick={() => isActive && setSelectedDisaster(disaster.id)}
                disabled={!isActive}
                className={`
                  relative p-4 sm:p-6 rounded-xl border-2
                  ${isActive ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                  ${isSelected 
                    ? 'border-[#FF0000] shadow-[0_0_30px_rgba(255,0,0,0.3)]' 
                    : 'border-[#2a2a3a] hover:border-[#FFD700]/50'
                  }
                `}
                style={{
                  backgroundColor: isSelected ? 'rgba(255, 0, 0, 0.1)' : 'rgba(26, 26, 40, 0.5)',
                }}
                whileHover={isActive ? { scale: 1.02 } : {}}
                whileTap={isActive ? { scale: 0.98 } : {}}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
              >
                {isSelected && (
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,0,0,0.1) 0%, rgba(255,69,0,0.05) 100%)',
                    }}
                    animate={{
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                )}
                <div className="relative z-10">
                  <Icon 
                    className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 ${isSelected ? 'text-[#FF0000]' : 'text-muted-foreground'}`}
                  />
                  <h3 className={`text-lg sm:text-xl font-bold mb-1 sm:mb-2 ${isSelected ? 'text-[#FF0000]' : 'text-foreground'}`}>
                    {disaster.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{disaster.description}</p>
                  {!isActive && (
                    <span className="inline-block mt-2 sm:mt-3 px-3 py-1 text-xs font-mono rounded-full bg-muted text-muted-foreground">
                      Coming Soon
                    </span>
                  )}
                </div>
              </motion.button>
            )
          })}
        </motion.div>

        {/* Start Simulation Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link href="/dashboard">
            <motion.button
              className="relative px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg font-bold rounded-xl text-black overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #00FF00 0%, #00CC00 100%)',
                boxShadow: '0 0 30px rgba(0, 255, 0, 0.4)',
              }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: '0 0 50px rgba(0, 255, 0, 0.6)',
              }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  '0 0 20px rgba(0, 255, 0, 0.4)',
                  '0 0 40px rgba(0, 255, 0, 0.6)',
                  '0 0 20px rgba(0, 255, 0, 0.4)',
                ],
              }}
              transition={{
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                },
              }}
            >
              <span className="relative z-10 flex items-center gap-2 sm:gap-3">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                START SIMULATION
              </span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Emergency Info Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-3 gap-2 sm:gap-4 mt-10 sm:mt-16 max-w-2xl w-full px-4"
        >
          <div className="p-3 sm:p-4 rounded-lg bg-card/50 border border-border text-center">
            <div className="text-xl sm:text-3xl font-black font-mono" style={{ color: '#FF0000' }}>27</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">Districts Affected</div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg bg-card/50 border border-border text-center">
            <div className="text-xl sm:text-3xl font-black font-mono" style={{ color: '#FFD700' }}>156</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">Routes Blocked</div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg bg-card/50 border border-border text-center">
            <div className="text-xl sm:text-3xl font-black font-mono" style={{ color: '#00FF00' }}>89%</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">Delivery Success</div>
          </div>
        </motion.div>

        {/* What Each Metric Means */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-6 sm:mt-8 p-4 rounded-xl bg-card/40 border border-border max-w-2xl w-full mx-4"
        >
          <h3 className="text-xs sm:text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Understanding the Dashboard
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div>
              <span className="font-semibold text-foreground">Districts Affected:</span> Number of administrative regions currently experiencing flood conditions
            </div>
            <div>
              <span className="font-semibold text-foreground">Routes Blocked:</span> Road segments impassable due to flooding, requiring alternate routing
            </div>
            <div>
              <span className="font-semibold text-foreground">Delivery Success:</span> Percentage of emergency supplies successfully reaching affected villages
            </div>
            <div>
              <span className="font-semibold text-foreground">Villages at Risk:</span> Communities requiring immediate evacuation or emergency supplies
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
