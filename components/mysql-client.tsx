"use client"

import { useState } from "react"
import { Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useMySQL } from "@/contexts/mysql-context"

interface MySQLClientProps {
  onClose: () => void
}

export function MySQLClient({ onClose }: MySQLClientProps) {
  const [input, setInput] = useState("")
  const [history, setHistory] = useState<string[]>(["MySQL Client (sql.js)", 'Type "help" for available commands', ""])
  const mysql = useMySQL()

  const executeCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim()
    if (!trimmedCmd) return

    setHistory((prev) => [...prev, `mysql> ${trimmedCmd}`])

    if (!mysql.isReady) {
      setHistory((prev) => [...prev, "MySQL is initializing, please wait...", ""])
      return
    }

    if (trimmedCmd.toLowerCase() === "help") {
      setHistory((prev) => [
        ...prev,
        "Database Commands:",
        "  SHOW DATABASES;              - List all databases",
        "  CREATE DATABASE <name>;      - Create a new database",
        "  USE <database>;              - Switch to a database",
        "  SHOW TABLES;                 - List tables in current database",
        "",
        "Table Operations:",
        "  CREATE TABLE <name> (...);   - Create a new table",
        "  DROP TABLE <name>;           - Delete a table",
        "  DESCRIBE <table>;            - Show table structure",
        "",
        "Data Operations:",
        "  INSERT INTO <table> VALUES (...); - Insert data",
        "  SELECT * FROM <table>;            - Query data",
        "  UPDATE <table> SET ...;           - Update data",
        "  DELETE FROM <table> WHERE ...;    - Delete data",
        "",
        "Other:",
        "  exit, quit               - Close MySQL client",
        "  help                     - Show this help",
        "",
      ])
      setInput("")
      return
    }

    if (trimmedCmd.toLowerCase() === "exit" || trimmedCmd.toLowerCase() === "quit") {
      onClose()
      return
    }

    if (trimmedCmd.toLowerCase() === "show databases;") {
      if (mysql.databases.length === 0) {
        setHistory((prev) => [...prev, "No databases found", ""])
      } else {
        setHistory((prev) => [...prev, "Databases:", ...mysql.databases.map((db) => `  - ${db}`), ""])
      }
      setInput("")
      return
    }

    const createDbMatch = trimmedCmd.match(/^CREATE DATABASE (\w+);?$/i)
    if (createDbMatch) {
      const dbName = createDbMatch[1]
      if (mysql.createDatabase(dbName)) {
        setHistory((prev) => [...prev, `Database '${dbName}' created`, ""])
      } else {
        setHistory((prev) => [...prev, `Failed to create database '${dbName}'`, ""])
      }
      setInput("")
      return
    }

    const useDbMatch = trimmedCmd.match(/^USE (\w+);?$/i)
    if (useDbMatch) {
      const dbName = useDbMatch[1]
      if (mysql.selectDatabase(dbName)) {
        setHistory((prev) => [...prev, `Database changed to '${dbName}'`, ""])
      } else {
        setHistory((prev) => [...prev, `Database '${dbName}' not found`, ""])
      }
      setInput("")
      return
    }

    const result = mysql.executeQuery(trimmedCmd)

    if (result.success && result.result) {
      if (result.result.values.length === 0) {
        setHistory((prev) => [...prev, "Query OK, 0 rows affected", ""])
      } else {
        const table = formatTable(result.result.columns, result.result.values)
        setHistory((prev) => [...prev, table, ""])
      }
    } else {
      setHistory((prev) => [...prev, `Error: ${result.error}`, ""])
    }

    setInput("")
  }

  const formatTable = (columns: string[], values: any[][]): string => {
    if (columns.length === 0) return "Empty set"

    const colWidths = columns.map((col, i) => {
      const dataWidth = Math.max(...values.map((row) => String(row[i] ?? "NULL").length))
      return Math.max(col.length, dataWidth)
    })

    const separator = "+" + colWidths.map((w) => "-".repeat(w + 2)).join("+") + "+"
    const header = "|" + columns.map((col, i) => ` ${col.padEnd(colWidths[i])} `).join("|") + "|"

    const rows = values.map(
      (row) => "|" + row.map((val, i) => ` ${String(val ?? "NULL").padEnd(colWidths[i])} `).join("|") + "|",
    )

    return [separator, header, separator, ...rows, separator].join("\n")
  }

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="border-b p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">MySQL Client</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
        {history.map((line, i) => (
          <div key={i} className="whitespace-pre leading-relaxed">
            {line}
          </div>
        ))}
      </div>

      <div className="border-t p-3 flex items-center gap-2">
        <span className="text-primary font-mono">mysql&gt;</span>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              executeCommand(input)
            }
          }}
          placeholder="Enter SQL command..."
          className="flex-1 font-mono"
          autoFocus
        />
      </div>
    </div>
  )
}
