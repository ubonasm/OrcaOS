"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface QueryResult {
  columns: string[]
  values: any[][]
}

interface MySQLContextType {
  isReady: boolean
  databases: string[]
  currentDatabase: string | null
  createDatabase: (name: string) => boolean
  selectDatabase: (name: string) => boolean
  executeQuery: (query: string) => { success: boolean; result?: QueryResult; error?: string }
}

const MySQLContext = createContext<MySQLContextType | undefined>(undefined)

export function MySQLProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const [SQL, setSQL] = useState<any>(null)
  const [databases, setDatabases] = useState<Record<string, any>>({})
  const [currentDatabase, setCurrentDatabase] = useState<string | null>(null)

  useEffect(() => {
    const loadSQL = async () => {
      try {
        const script = document.createElement("script")
        script.src = "https://cdn.jsdelivr.net/npm/sql.js@1.10.2/dist/sql-wasm.js"
        script.async = true

        script.onload = async () => {
          let attempts = 0
          const checkInitSqlJs = setInterval(async () => {
            attempts++
            if ((window as any).initSqlJs) {
              clearInterval(checkInitSqlJs)
              try {
                const SqlModule = await (window as any).initSqlJs({
                  locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/sql.js@1.10.2/dist/${file}`,
                })
                setSQL(SqlModule)
                setIsReady(true)
              } catch (err) {
                console.error("[v0] Failed to initialize SQL.js:", err)
              }
            } else if (attempts > 50) {
              clearInterval(checkInitSqlJs)
              console.error("[v0] initSqlJs not available after timeout")
            }
          }, 100)
        }

        script.onerror = (error) => {
          console.error("[v0] Failed to load SQL.js script:", error)
        }

        document.head.appendChild(script)
      } catch (error) {
        console.error("[v0] Error setting up SQL.js:", error)
      }
    }

    loadSQL()
  }, [])

  const createDatabase = (name: string): boolean => {
    if (!SQL) return false
    if (databases[name]) return false

    try {
      const db = new SQL.Database()
      setDatabases((prev) => ({ ...prev, [name]: db }))
      return true
    } catch (error) {
      console.error("[v0] Failed to create database:", error)
      return false
    }
  }

  const selectDatabase = (name: string): boolean => {
    if (!databases[name]) return false
    setCurrentDatabase(name)
    return true
  }

  const executeQuery = (query: string): { success: boolean; result?: QueryResult; error?: string } => {
    if (!SQL || !currentDatabase || !databases[currentDatabase]) {
      return { success: false, error: "No database selected" }
    }

    const db = databases[currentDatabase]

    try {
      const results = db.exec(query)

      if (results.length === 0) {
        return { success: true, result: { columns: [], values: [] } }
      }

      const result = results[0]
      return {
        success: true,
        result: {
          columns: result.columns,
          values: result.values,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  return (
    <MySQLContext.Provider
      value={{
        isReady,
        databases: Object.keys(databases),
        currentDatabase,
        createDatabase,
        selectDatabase,
        executeQuery,
      }}
    >
      {children}
    </MySQLContext.Provider>
  )
}

export function useMySQL() {
  const context = useContext(MySQLContext)
  if (context === undefined) {
    throw new Error("useMySQL must be used within a MySQLProvider")
  }
  return context
}
