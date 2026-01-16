"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useFileSystemContext } from "@/contexts/file-system-context"
import { useWebServer } from "@/contexts/web-server-context"
import { usePHP } from "@/contexts/php-context"
import { useMySQL } from "@/contexts/mysql-context"
import { useMountedFolder } from "@/contexts/mounted-folder-context"

interface TerminalProps {
  onOpenEditor?: (filename: string, content: string, type: "vi" | "nano") => void
  onOpenPython?: () => void
  onOpenR?: () => void
  onOpenNotebook?: () => void
  onOpenMySQL?: () => void
}

export function Terminal({ onOpenEditor, onOpenPython, onOpenR, onOpenNotebook, onOpenMySQL }: TerminalProps) {
  const [history, setHistory] = useState<string[]>([
    "OrcaOS v1.1.0 - Web-based OS Simulator",
    'Type "help" for available commands',
    "",
  ])
  const [input, setInput] = useState("")
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [pyodide, setPyodide] = useState<any>(null)
  const [pyodideLoading, setPyodideLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const fileSystem = useFileSystemContext()
  const webServer = useWebServer()
  const php = usePHP()
  const mysql = useMySQL()
  const mountedFolder = useMountedFolder()

  useEffect(() => {
    const loadPyodide = async () => {
      if ((window as any).pyodideInstance) {
        setPyodide((window as any).pyodideInstance)
        return
      }

      try {
        let attempts = 0
        const maxAttempts = 50

        while (attempts < maxAttempts && typeof (window as any).loadPyodide !== "function") {
          await new Promise((resolve) => setTimeout(resolve, 100))
          attempts++
        }

        if (typeof (window as any).loadPyodide === "function") {
          const pyodideModule = await (window as any).loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
          })
          ;(window as any).pyodideInstance = pyodideModule
          setPyodide(pyodideModule)
        }
      } catch (error) {
        console.error("[v0] Failed to load Pyodide for terminal:", error)
      }
    }

    const existingScript = document.getElementById("pyodide-script")
    if (!existingScript) {
      const script = document.createElement("script")
      script.id = "pyodide-script"
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js"
      script.async = true
      script.onload = () => loadPyodide()
      document.head.appendChild(script)
    } else {
      loadPyodide()
    }
  }, [])

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

    const parseCommand = (cmdStr: string): string[] => {
      const parts: string[] = []
      let current = ""
      let inQuote = false
      let quoteChar = ""

      for (let i = 0; i < cmdStr.length; i++) {
        const char = cmdStr[i]

        if ((char === '"' || char === "'") && !inQuote) {
          inQuote = true
          quoteChar = char
        } else if (char === quoteChar && inQuote) {
          inQuote = false
          quoteChar = ""
        } else if (char === " " && !inQuote) {
          if (current) {
            parts.push(current)
            current = ""
          }
        } else {
          current += char
        }
      }

      if (current) {
        parts.push(current)
      }

      return parts
    }

    const parts = parseCommand(trimmedCmd)
    const [command, ...args] = parts

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
      if (args.length > 0) {
        const filename = args[0]
        const content = fileSystem.readFile(filename)

        if (content === null) {
          setHistory((prev) => [...prev, `python: ${filename}: No such file`, ""])
          setInput("")
          return
        }

        if (!pyodide) {
          setHistory((prev) => [...prev, "Python is loading, please wait...", ""])
          setInput("")
          return
        }

        try {
          const importMatches = content.match(/(?:^|\n)(?:import|from)\s+(\w+)/g)
          if (importMatches) {
            const packageMap: Record<string, string> = {
              pandas: "pandas",
              numpy: "numpy",
              matplotlib: "matplotlib",
              scipy: "scipy",
              sklearn: "scikit-learn",
              requests: "requests",
            }

            for (const match of importMatches) {
              const packageName = match
                .replace(/(?:import|from)\s+/, "")
                .trim()
                .toLowerCase()
              const packageToLoad = packageMap[packageName]
              if (packageToLoad) {
                try {
                  await pyodide.loadPackage(packageToLoad)
                } catch (loadError) {
                  console.log(`[v0] Package ${packageToLoad} already loaded or failed`)
                }
              }
            }
          }

          await pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
`)

          await pyodide.runPythonAsync(content)

          const stdout = await pyodide.runPythonAsync("sys.stdout.getvalue()")
          const stderr = await pyodide.runPythonAsync("sys.stderr.getvalue()")

          await pyodide.runPythonAsync(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`)

          if (stdout) {
            setHistory((prev) => [...prev, stdout.trim(), ""])
          }
          if (stderr) {
            setHistory((prev) => [...prev, stderr.trim(), ""])
          }
          if (!stdout && !stderr) {
            setHistory((prev) => [...prev, ""])
          }
        } catch (error: any) {
          setHistory((prev) => [...prev, `Error: ${error.message || String(error)}`, ""])
        }
      } else {
        if (onOpenPython) {
          onOpenPython()
          setHistory((prev) => [...prev, "Opening Python interpreter...", ""])
        } else {
          setHistory((prev) => [...prev, "Python interpreter not available", ""])
        }
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

    if (command === "mount") {
      try {
        if (typeof window === "undefined" || !("showDirectoryPicker" in window)) {
          setHistory((prev) => [...prev, "mount: File System Access API not supported in this browser", ""])
          setInput("")
          return
        }

        setHistory((prev) => [...prev, "Opening folder picker...", ""])

        const dirHandle = await (window as any).showDirectoryPicker()

        if (dirHandle) {
          const folderName = dirHandle.name

          mountedFolder.setDirectoryHandle(dirHandle)

          const syncFolder = async (handle: FileSystemDirectoryHandle, basePath: string) => {
            for await (const entry of (handle as any).values()) {
              const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name

              if (entry.kind === "directory") {
                fileSystem.createDirectory(`/home/user/data/${entryPath}`)
                await syncFolder(entry, entryPath)
              } else if (entry.kind === "file") {
                const fileHandle = entry as FileSystemFileHandle
                const file = await fileHandle.getFile()

                const isImage = /\.(png|jpg|jpeg|gif|bmp|webp|svg|ico)$/i.test(entry.name)

                if (isImage) {
                  const arrayBuffer = await file.arrayBuffer()
                  const base64 = btoa(
                    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
                  )
                  const mimeType = file.type || "image/png"
                  const dataUrl = `data:${mimeType};base64,${base64}`
                  fileSystem.writeFile(`/home/user/data/${entryPath}`, dataUrl)
                } else {
                  const content = await file.text()
                  fileSystem.writeFile(`/home/user/data/${entryPath}`, content)
                }
              }
            }
          }

          await syncFolder(dirHandle, "")

          setHistory((prev) => [
            ...prev,
            `Mounted: ${folderName} to /home/user/data/`,
            "Files synced to virtual filesystem",
            "Use 'ls data' to see files",
            "",
          ])
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          setHistory((prev) => [...prev, "mount: Folder selection cancelled", ""])
        } else {
          setHistory((prev) => [...prev, `mount: Error - ${error.message || error}`, ""])
        }
      }
      setInput("")
      return
    }

    if (command === "unmount") {
      if (mountedFolder.isMounted) {
        mountedFolder.unmountFolder()
        setHistory((prev) => [...prev, "Unmounted /home/user/data/", ""])
      } else {
        setHistory((prev) => [...prev, "unmount: No folder is currently mounted", ""])
      }
      setInput("")
      return
    }

    const output = await fileSystem.executeCommand(command, args)

    if (output === "@@MOUNT_FOLDER@@") {
      setHistory((prev) => [...prev, "mount: Use mount command to select a folder", ""])
      setInput("")
      return
    }

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
