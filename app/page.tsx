"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Waves, Mountain, Wind, AlertTriangle, Activity, MapPin } from "lucide-react"
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
  const [villagesAtRisk, setVillagesAtRisk] = useState(0)

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
      <div className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-safe animate-pulse" style={{ backgroundColor: 'var(--safe)' }} />
            <span className="text-sm font-mono text-muted-foreground">System Ready</span>
          </div>
        </div>
        <div className="flex items-center gap-6 font-mono text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: villagesAtRisk > 0 ? 'var(--danger)' : 'var(--safe)' }} />
            <span style={{ color: villagesAtRisk > 0 ? 'var(--danger)' : 'var(--foreground)' }}>
              {villagesAtRisk} villages at risk
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-safe" style={{ color: 'var(--safe)' }} />
            <span>Ready</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
            <span className="bg-gradient-to-r from-[#FF0000] via-[#FF4500] to-[#FFD700] bg-clip-text text-transparent">
              Setu
            </span>
          </h1>
          <p className="text-xl md:text-2xl font-bold text-foreground mb-2">
            Lifeline for Assam Floods
          </p>
          <p className="text-lg text-warning max-w-xl mx-auto" style={{ color: 'var(--warning)' }}>
            Real-time rescue routes when roads fail
          </p>
        </motion.div>

        {/* Disaster Selector Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-12"
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
                  relative p-6 rounded-xl border-2
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
                    className={`w-12 h-12 mx-auto mb-4 ${isSelected ? 'text-[#FF0000]' : 'text-muted-foreground'}`}
                  />
                  <h3 className={`text-xl font-bold mb-2 ${isSelected ? 'text-[#FF0000]' : 'text-foreground'}`}>
                    {disaster.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{disaster.description}</p>
                  {!isActive && (
                    <span className="inline-block mt-3 px-3 py-1 text-xs font-mono rounded-full bg-muted text-muted-foreground">
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
              className="relative px-12 py-4 text-lg font-bold rounded-xl text-black overflow-hidden"
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
              <span className="relative z-10 flex items-center gap-3">
                <MapPin className="w-5 h-5" />
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
          className="grid grid-cols-3 gap-4 mt-16 max-w-2xl w-full"
        >
          <div className="p-4 rounded-lg bg-card/50 border border-border text-center">
            <div className="text-3xl font-black font-mono" style={{ color: 'var(--danger)' }}>27</div>
            <div className="text-xs text-muted-foreground mt-1">Districts Affected</div>
          </div>
          <div className="p-4 rounded-lg bg-card/50 border border-border text-center">
            <div className="text-3xl font-black font-mono" style={{ color: 'var(--warning)' }}>156</div>
            <div className="text-xs text-muted-foreground mt-1">Routes Blocked</div>
          </div>
          <div className="p-4 rounded-lg bg-card/50 border border-border text-center">
            <div className="text-3xl font-black font-mono" style={{ color: 'var(--safe)' }}>89%</div>
            <div className="text-xs text-muted-foreground mt-1">Delivery Success</div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
