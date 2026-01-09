"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useFileSystemContext } from "@/contexts/file-system-context"

interface PythonReplProps {
  onClose?: () => void
}

export function PythonRepl({ onClose }: PythonReplProps) {
  const [history, setHistory] = useState<Array<{ type: "input" | "output" | "error"; content: string }>>([
    { type: "output", content: "Python 3.11.0 (Pyodide)" },
    { type: "output", content: 'Type "exit()" or press Ctrl+D to exit' },
    { type: "output", content: "" },
  ])
  const [input, setInput] = useState("")
  const [pyodide, setPyodide] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [multilineMode, setMultilineMode] = useState(false)
  const [multilineBuffer, setMultilineBuffer] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)
  const fileSystem = useFileSystemContext()

  useEffect(() => {
    const loadPyodide = async () => {
      try {
        // @ts-ignore
        const pyodideModule = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
        })
        setPyodide(pyodideModule)
        setHistory((prev) => [
          ...prev,
          { type: "output", content: "Python environment loaded successfully!" },
          { type: "output", content: "" },
        ])
      } catch (error) {
        setHistory((prev) => [...prev, { type: "error", content: `Failed to load Python: ${error}` }])
      } finally {
        setIsLoading(false)
      }
    }

    // Load Pyodide script if not already loaded
    if (!document.getElementById("pyodide-script")) {
      const script = document.createElement("script")
      script.id = "pyodide-script"
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js"
      script.async = true
      script.onload = () => loadPyodide()
      script.onerror = () => {
        setHistory((prev) => [...prev, { type: "error", content: "Failed to load Pyodide script" }])
        setIsLoading(false)
      }
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

  const executeCode = async (code: string) => {
    if (!pyodide) {
      setHistory((prev) => [...prev, { type: "error", content: "Python is not loaded yet" }])
      return
    }

    try {
      const importMatch = code.match(/^(?:import|from)\s+(\w+)/)
      if (importMatch) {
        const packageName = importMatch[1]
        const commonPackages = ["numpy", "pandas", "matplotlib", "scipy", "scikit-learn", "requests"]

        if (commonPackages.includes(packageName)) {
          try {
            setHistory((prev) => [...prev, { type: "output", content: `Loading package '${packageName}'...` }])
            await pyodide.loadPackage(packageName)
          } catch (loadError: any) {
            // If package loading fails, continue anyway (might already be loaded)
          }
        }
      }

      // Capture stdout
      await pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
`)

      // Execute the code
      const result = await pyodide.runPythonAsync(code)

      // Get stdout/stderr
      const stdout = await pyodide.runPythonAsync("sys.stdout.getvalue()")
      const stderr = await pyodide.runPythonAsync("sys.stderr.getvalue()")

      // Reset stdout/stderr
      await pyodide.runPythonAsync(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`)

      if (stdout) {
        setHistory((prev) => [...prev, { type: "output", content: stdout }])
      }
      if (stderr) {
        setHistory((prev) => [...prev, { type: "error", content: stderr }])
      }
      if (result !== undefined && result !== null && !stdout) {
        setHistory((prev) => [...prev, { type: "output", content: String(result) }])
      }
    } catch (error: any) {
      setHistory((prev) => [...prev, { type: "error", content: error.message || String(error) }])
    }
  }

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const trimmedInput = input.trim()

      if (multilineMode) {
        setHistory((prev) => [...prev, { type: "input", content: `... ${input}` }])

        if (trimmedInput === "") {
          // Empty line ends multiline mode
          const fullCode = multilineBuffer.join("\n")
          setMultilineMode(false)
          setMultilineBuffer([])
          setInput("")
          await executeCode(fullCode)
          setHistory((prev) => [...prev, { type: "output", content: "" }])
        } else {
          setMultilineBuffer([...multilineBuffer, input])
          setInput("")
        }
      } else {
        if (trimmedInput === "") {
          setHistory((prev) => [...prev, { type: "output", content: "" }])
          setInput("")
          return
        }

        setHistory((prev) => [...prev, { type: "input", content: `>>> ${trimmedInput}` }])

        if (trimmedInput === "exit()" || trimmedInput === "quit()") {
          if (onClose) onClose()
          return
        }

        // Check if this starts a multiline statement
        if (
          trimmedInput.endsWith(":") ||
          trimmedInput.startsWith("def ") ||
          trimmedInput.startsWith("class ") ||
          trimmedInput.startsWith("if ") ||
          trimmedInput.startsWith("for ") ||
          trimmedInput.startsWith("while ") ||
          trimmedInput.startsWith("with ") ||
          trimmedInput.startsWith("try:")
        ) {
          setMultilineMode(true)
          setMultilineBuffer([trimmedInput])
          setInput("")
        } else {
          setInput("")
          await executeCode(trimmedInput)
          setHistory((prev) => [...prev, { type: "output", content: "" }])
        }
      }
    } else if (e.key === "d" && e.ctrlKey) {
      e.preventDefault()
      if (onClose) onClose()
    }
  }

  return (
    <div
      className="h-full bg-background/95 p-4 flex flex-col font-mono text-sm"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={outputRef} className="flex-1 overflow-y-auto mb-2 space-y-1">
        {history.map((line, i) => (
          <div
            key={i}
            className={`leading-relaxed whitespace-pre-wrap ${
              line.type === "error" ? "text-red-400" : line.type === "input" ? "text-cyan-400" : "text-foreground"
            }`}
          >
            {line.content}
          </div>
        ))}
      </div>
      {isLoading ? (
        <div className="text-primary animate-pulse">Loading Python environment...</div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-cyan-400">{multilineMode ? "..." : ">>>"}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-foreground"
            autoFocus
            disabled={isLoading}
          />
        </div>
      )}
    </div>
  )
}
