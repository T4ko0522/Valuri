"use client"

import { useState, useEffect } from "react"
import { invoke } from '@tauri-apps/api/core'
import { useRouter } from 'next/navigation'
import { listen } from '@tauri-apps/api/event'
import { Settings, Users, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import SettingsManager from "@/components/settings-manager"
import AccountManager from "@/components/alt-manager"

type ActiveUtility = "settings" | "accounts"

export default function DesktopUtilities() {
  const [activeUtility, setActiveUtility] = useState<ActiveUtility>("accounts")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()

  // useEffect(() => {
  //   const checkInitial = async () => {
  //     try {
  //       const isRunning = await invoke<boolean>("check_riot_status")
  //       if (!isRunning) {
  //         router.replace("/unauthorized")
  //       }
  //     } catch {
  //       router.replace("/unauthorized")
  //     }
  //   }
    
  //   checkInitial()

  //   const unlisten = listen("riot_client_closed", () => {
  //     router.replace("/unauthorized")
  //   })

  //   return () => {
  //     unlisten.then((fn) => fn())
  //   }
  // }, [router])

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div
        className={`bg-gray-800 border-r border-gray-700 transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            {!sidebarCollapsed && <h1 className="text-xl font-bold text-white">Utility Manager</h1>}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>

          <nav className="space-y-2">
            <Button
              variant={activeUtility === "settings" ? "secondary" : "ghost"}
              className={`w-full justify-start text-left ${
                activeUtility === "settings"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
              onClick={() => setActiveUtility("settings")}
            >
              <Settings className="h-4 w-4 mr-3" />
              {!sidebarCollapsed && "Settings Manager"}
            </Button>

            <Button
              variant={activeUtility === "accounts" ? "secondary" : "ghost"}
              className={`w-full justify-start text-left ${
                activeUtility === "accounts"
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
              onClick={() => setActiveUtility("accounts")}
            >
              <Users className="h-4 w-4 mr-3" />
              {!sidebarCollapsed && "Account Manager"}
            </Button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeUtility === "settings" && <SettingsManager />}
        {activeUtility === "accounts" && <AccountManager />}
      </div>
    </div>
  )
}
