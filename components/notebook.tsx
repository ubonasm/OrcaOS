"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Play, Plus, Trash2, ChevronUp, ChevronDown, FileText, CodeIcon } from "lucide-react"
import { Button } from "./ui/button"

interface Cell {
  id: string
  type: "code" | "markdown"
  content: string
  output?: string
  error?: string
  isEditing?: boolean
}

interface NotebookProps {
  language?: "python" | "r"
}

declare global {
  interface Window {
    loadPyodide: any
    WebR: any
  }
}

export function Notebook({ language = "python" }: NotebookProps) {
  const [cells, setCells] = useState<Cell[]>([
    {
      id: "cell-1",
      type: "markdown",
      content: `# Welcome to OrcaOS Notebook

This is a Jupyter-style notebook for ${language === "python" ? "Python" : "R"} programming.

Click a cell to edit it, or press Shift+Enter to execute.`,
      isEditing: false,
    },
    {
      id: "cell-2",
      type: "code",
      content: language === "python" ? "print('Hello from OrcaOS!')" : "print('Hello from OrcaOS!')",
      isEditing: false,
    },
  ])
  const [interpreter, setInterpreter] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadInterpreter = async () => {
      try {
        if (language === "python") {
          const pyodideModule = await window.loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
          })
          setInterpreter(pyodideModule)
        } else {
          if (!window.WebR) {
            const script = document.createElement("script")
            script.type = "module"
            script.innerHTML = `
              import { WebR } from 'https://webr.r-wasm.org/latest/webr.mjs';
              window.WebR = WebR;
            `
            document.head.appendChild(script)

            await new Promise((resolve) => {
              const checkWebR = setInterval(() => {
                if (window.WebR) {
                  clearInterval(checkWebR)
                  resolve(true)
                }
              }, 100)

              setTimeout(() => {
                clearInterval(checkWebR)
                resolve(false)
              }, 10000)
            })
          }

          if (!window.WebR) {
            throw new Error("WebR failed to load")
          }

          const webRInstance = new window.WebR()
          await webRInstance.init()
          setInterpreter(webRInstance)
        }
      } catch (error) {
        console.error(`Failed to load ${language} interpreter:`, error)
      } finally {
        setIsLoading(false)
      }
    }

    if (!document.getElementById("pyodide-script") && language === "python") {
      const script = document.createElement("script")
      script.id = "pyodide-script"
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js"
      script.async = true
      script.onload = () => loadInterpreter()
      document.head.appendChild(script)
    } else {
      loadInterpreter()
    }
  }, [language])

  const addCell = (type: "code" | "markdown", afterId?: string) => {
    const newCell: Cell = {
      id: `cell-${Date.now()}`,
      type,
      content: "",
      isEditing: true,
    }

    if (afterId) {
      const index = cells.findIndex((c) => c.id === afterId)
      const newCells = [...cells]
      newCells.splice(index + 1, 0, newCell)
      setCells(newCells)
    } else {
      setCells([...cells, newCell])
    }
  }

  const deleteCell = (id: string) => {
    if (cells.length === 1) return
    setCells(cells.filter((c) => c.id !== id))
  }

  const moveCell = (id: string, direction: "up" | "down") => {
    const index = cells.findIndex((c) => c.id === id)
    if ((direction === "up" && index === 0) || (direction === "down" && index === cells.length - 1)) return

    const newCells = [...cells]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    ;[newCells[index], newCells[targetIndex]] = [newCells[targetIndex], newCells[index]]
    setCells(newCells)
  }

  const updateCell = (id: string, updates: Partial<Cell>) => {
    setCells(cells.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }

  const executeCell = async (id: string) => {
    const cell = cells.find((c) => c.id === id)
    if (!cell || cell.type !== "code" || !interpreter) return

    try {
      if (language === "python") {
        await interpreter.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
`)

        const result = await interpreter.runPythonAsync(cell.content)
        const stdout = await interpreter.runPythonAsync("sys.stdout.getvalue()")
        const stderr = await interpreter.runPythonAsync("sys.stderr.getvalue()")

        await interpreter.runPythonAsync(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`)

        if (stderr) {
          updateCell(id, { error: stderr, output: undefined })
        } else {
          const output = stdout || (result !== undefined && result !== null ? String(result) : "")
          updateCell(id, { output, error: undefined })
        }
      } else {
        const result = await interpreter.evalR(cell.content)
        const output = await result.toJs()
        const outputStr = formatROutput(output)
        updateCell(id, { output: outputStr, error: undefined })
      }
    } catch (error: any) {
      updateCell(id, { error: error.message || String(error), output: undefined })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault()
      executeCell(id)
    }
  }

  const renderMarkdown = (content: string) => {
    const lines = content.split("\n")
    return lines.map((line, i) => {
      if (line.startsWith("# ")) {
        return (
          <h1 key={i} className="text-3xl font-bold mt-4 mb-2">
            {line.slice(2)}
          </h1>
        )
      } else if (line.startsWith("## ")) {
        return (
          <h2 key={i} className="text-2xl font-bold mt-3 mb-2">
            {line.slice(3)}
          </h2>
        )
      } else if (line.startsWith("### ")) {
        return (
          <h3 key={i} className="text-xl font-bold mt-2 mb-1">
            {line.slice(4)}
          </h3>
        )
      } else if (line.startsWith("- ")) {
        return (
          <li key={i} className="ml-4">
            {line.slice(2)}
          </li>
        )
      } else if (line.trim() === "") {
        return <div key={i} className="h-2" />
      } else {
        return (
          <p key={i} className="my-1">
            {line}
          </p>
        )
      }
    })
  }

  const formatROutput = (result: any): string => {
    if (!result || typeof result !== "object") {
      return String(result)
    }

    if (result.values) {
      const values = result.values
      if (Array.isArray(values)) {
        if (values.length === 0) return ""
        if (values.length === 1) return `[1] ${values[0]}`

        let output = ""
        for (let i = 0; i < values.length; i += 5) {
          const chunk = values.slice(i, i + 5)
          output += `[${i + 1}] ${chunk.join(" ")}\n`
        }
        return output.trim()
      }
      return `[1] ${values}`
    }

    return JSON.stringify(result, null, 2)
  }

  return (
    <div className="h-full bg-background/95 flex flex-col">
      <div className="border-b border-border p-2 flex items-center gap-2 bg-secondary/50">
        <Button size="sm" onClick={() => addCell("code")} className="gap-2">
          <Plus className="h-4 w-4" />
          Code
        </Button>
        <Button size="sm" variant="outline" onClick={() => addCell("markdown")} className="gap-2">
          <Plus className="h-4 w-4" />
          Markdown
        </Button>
        <div className="ml-auto text-sm text-muted-foreground">
          {isLoading ? "Loading..." : `${language === "python" ? "Python" : "R"} Ready`}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {cells.map((cell, index) => (
          <div key={cell.id} className="border border-border rounded-lg overflow-hidden bg-card">
            <div className="flex items-center gap-1 p-1 bg-secondary/30 border-b border-border">
              <div className="flex items-center gap-1 px-2">
                {cell.type === "code" ? (
                  <CodeIcon className="h-4 w-4 text-cyan-400" />
                ) : (
                  <FileText className="h-4 w-4 text-blue-400" />
                )}
                <span className="text-xs text-muted-foreground">{cell.type === "code" ? "Code" : "Markdown"}</span>
              </div>
              <div className="flex-1" />
              {cell.type === "code" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2"
                  onClick={() => executeCell(cell.id)}
                  disabled={isLoading}
                >
                  <Play className="h-3 w-3 mr-1" />
                  Run
                </Button>
              )}
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => moveCell(cell.id, "up")}>
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => moveCell(cell.id, "down")}>
                <ChevronDown className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => deleteCell(cell.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            <div className="p-4 cursor-text" onClick={() => updateCell(cell.id, { isEditing: true })}>
              {cell.isEditing ? (
                <textarea
                  className="w-full min-h-[80px] bg-transparent outline-none resize-none font-mono text-sm"
                  value={cell.content}
                  onChange={(e) => updateCell(cell.id, { content: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, cell.id)}
                  onBlur={() => updateCell(cell.id, { isEditing: false })}
                  autoFocus
                />
              ) : cell.type === "markdown" ? (
                <div className="prose prose-invert max-w-none">{renderMarkdown(cell.content)}</div>
              ) : (
                <pre className="font-mono text-sm whitespace-pre-wrap">{cell.content || "Click to edit..."}</pre>
              )}
            </div>

            {cell.type === "code" && (cell.output || cell.error) && (
              <div className="border-t border-border p-4 bg-background/50">
                {cell.error ? (
                  <pre className="font-mono text-sm text-red-400 whitespace-pre-wrap">{cell.error}</pre>
                ) : (
                  <pre className="font-mono text-sm whitespace-pre-wrap">{cell.output}</pre>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
