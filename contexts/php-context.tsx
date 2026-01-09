"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface PHPContextType {
  isReady: boolean
  execute: (code: string) => Promise<string>
}

const PHPContext = createContext<PHPContextType | undefined>(undefined)

export function PHPProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const [phpInstance, setPhpInstance] = useState<any>(null)

  useEffect(() => {
    const loadPHP = async () => {
      try {
        // Load php-wasm from CDN
        const script = document.createElement("script")
        script.src = "https://cdn.jsdelivr.net/npm/php-wasm@0.0.9/php-web.js"
        script.async = true

        script.onload = async () => {
          // Wait for PHP to be available
          const checkPHP = setInterval(() => {
            if ((window as any).PHP) {
              clearInterval(checkPHP)
              const PHP = (window as any).PHP
              PHP().then((php: any) => {
                setPhpInstance(php)
                setIsReady(true)
              })
            }
          }, 100)
        }

        document.head.appendChild(script)
      } catch (error) {
        console.error("[v0] Failed to load PHP:", error)
      }
    }

    loadPHP()
  }, [])

  const execute = async (code: string): Promise<string> => {
    if (!isReady || !phpInstance) {
      return "PHP is not ready yet. Please wait..."
    }

    try {
      const result = await phpInstance.run(code)
      return result
    } catch (error) {
      return `PHP Error: ${error instanceof Error ? error.message : String(error)}`
    }
  }

  return (
    <PHPContext.Provider
      value={{
        isReady,
        execute,
      }}
    >
      {children}
    </PHPContext.Provider>
  )
}

export function usePHP() {
  const context = useContext(PHPContext)
  if (context === undefined) {
    throw new Error("usePHP must be used within a PHPProvider")
  }
  return context
}
