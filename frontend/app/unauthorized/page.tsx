"use client"

import { useRouter } from "next/navigation"
import { Lock } from "lucide-react"
import { exit } from "@tauri-apps/plugin-process"

export default function UnauthorizedPage() {
  const router = useRouter()
  const handleQuit = async () => {
    try {
      await process.exit(0)
    } catch (error) {
      console.error("終了に失敗しました:", error)
      await exit()
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-white">
      <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
        <div className="mb-8">
        </div>

        <div className="mb-6 flex items-center justify-center">
          <Lock className="mr-2 h-12 w-12 text-red-500" />
          <h1 className="text-4xl font-bold">アクセス権限がありません</h1>
        </div>

        <div className="mb-8 max-w-md">
          <p className="mb-4 text-lg text-gray-300">
            Riot Clientを起動してください。
          </p>

          <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <button
              onClick={()=> router.replace("/")}
              className="flex w-full items-center justify-center rounded-md bg-green-500 px-6 py-3 text-white transition-colors hover:bg-green-600 sm:w-auto"
            >
              起動した
            </button>
            <button
              onClick={handleQuit}
              className="flex w-full items-center justify-center rounded-md border bg-red-500 px-6 py-3 text-white transition-colors hover:bg-red-600 sm:w-auto"
            >
              Quit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}