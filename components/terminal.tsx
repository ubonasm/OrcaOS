"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useFileSystemContext } from "@/contexts/file-system-context"
import { useWebServer } from "@/contexts/web-server-context"
import { usePHP } from "@/contexts/php-context"
import { useMySQL } from "@/contexts/mysql-context"

interface TerminalProps {
  onOpenEditor?: (filename: string, content: string, type: "vi" | "nano") => void
  onOpenPython?: () => void
  onOpenR?: () => void
  onOpenNotebook?: () => void
  onOpenMySQL?: () => void
}

export function Terminal({ onOpenEditor, onOpenPython, onOpenR, onOpenNotebook, onOpenMySQL }: TerminalProps) {
  const [history, setHistory] = useState<string[]>([
    "OrcaOS v1.0.0 - Web-based OS Simulator",
    'Type "help" for available commands',
    "",
  ])
  const [input, setInput] = useState("")
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const fileSystem = useFileSystemContext()
  const webServer = useWebServer()
  const php = usePHP()
  const mysql = useMySQL()

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [history])

  const executeCommand = async (cmd: string) => {
    const trimmedCmd = cmd.trim()
    if (!trimmedCmd) return

    setHistory([...history, `$ ${trimmedCmd}`])
    setCommandHistory([...commandHistory, trimmedCmd])
    setHistoryIndex(-1)

    const [command, ...args] = trimmedCmd.split(" ")

    if (command === "mysql") {
      if (onOpenMySQL) {
        onOpenMySQL()
        setHistory((prev) => [...prev, "Opening MySQL client...", ""])
      } else {
        setHistory((prev) => [...prev, "MySQL client not available", ""])
      }
      setInput("")
      return
    }

    if (command === "php") {
      if (args.length === 0) {
        setHistory((prev) => [...prev, "Usage: php <script.php>", ""])
      } else {
        const filename = args[0]
        const content = fileSystem.readFile(filename)
        if (content !== null) {
          if (!php.isReady) {
            setHistory((prev) => [...prev, "PHP is not ready yet. Please wait...", ""])
          } else {
            const result = await php.execute(content)
            setHistory((prev) => [...prev, result, ""])
          }
        } else {
          setHistory((prev) => [...prev, `php: ${filename}: No such file`, ""])
        }
      }
      setInput("")
      return
    }

    if (command === "apache2") {
      const subcommand = args[0]
      if (subcommand === "start") {
        webServer.start()
        setHistory((prev) => [...prev, "Apache HTTP Server started", ""])
      } else if (subcommand === "stop") {
        webServer.stop()
        setHistory((prev) => [...prev, "Apache HTTP Server stopped", ""])
      } else if (subcommand === "restart") {
        webServer.restart()
        setHistory((prev) => [...prev, "Apache HTTP Server restarted", ""])
      } else if (subcommand === "status") {
        setHistory((prev) => [...prev, webServer.status(), ""])
      } else {
        setHistory((prev) => [...prev, "Usage: apache2 {start|stop|restart|status}", ""])
      }
      setInput("")
      return
    }

    if (command === "R" || command === "r") {
      if (onOpenR) {
        onOpenR()
        setHistory((prev) => [...prev, "Opening R interpreter...", ""])
      } else {
        setHistory((prev) => [...prev, "R interpreter not available", ""])
      }
      setInput("")
      return
    }

    if (command === "python" || command === "python3") {
      if (onOpenPython) {
        onOpenPython()
        setHistory((prev) => [...prev, "Opening Python interpreter...", ""])
      } else {
        setHistory((prev) => [...prev, "Python interpreter not available", ""])
      }
      setInput("")
      return
    }

    if ((command === "vi" || command === "nano") && args.length > 0 && onOpenEditor) {
      const filename = args[0]
      const fullPath = `${fileSystem.currentPath}/${filename}`

      let content = fileSystem.readFile(filename)

      if (content === null) {
        fileSystem.createFile(fullPath, "")
        content = ""
      }

      onOpenEditor(fullPath, content, command)
      setHistory((prev) => [...prev, `Opening ${filename} in ${command}...`, ""])
      setInput("")
      return
    }

    const output = fileSystem.executeCommand(command, args)

    setHistory((prev) => [...prev, output, ""])
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeCommand(input)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex + 1
        if (newIndex < commandHistory.length) {
          setHistoryIndex(newIndex)
          setInput(commandHistory[commandHistory.length - 1 - newIndex])
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput("")
      }
    }
  }

  return (
    <div
      className="h-full bg-background/95 p-4 flex flex-col font-mono text-sm text-foreground"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={outputRef} className="flex-1 overflow-y-auto terminal-output mb-2">
        {history.map((line, i) => (
          <div key={i} className="leading-relaxed whitespace-pre-wrap">
            {line}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-primary">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-foreground"
          autoFocus
        />
      </div>
    </div>
  )
}
