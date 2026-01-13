"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

interface RReplProps {
  onClose?: () => void
}

declare global {
  interface Window {
    WebR: any
  }
}

export function RRepl({ onClose }: RReplProps) {
  const [history, setHistory] = useState<Array<{ type: "input" | "output" | "error"; content: string }>>([
    { type: "output", content: "R version 4.3.0 (WebR)" },
    { type: "output", content: 'Type "q()" to exit' },
    { type: "output", content: "" },
  ])
  const [input, setInput] = useState("")
  const [webR, setWebR] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadWebR = async () => {
      try {
        if (!window.WebR) {
          const script = document.createElement("script")
          script.type = "module"
          script.innerHTML = `
            import { WebR } from 'https://webr.r-wasm.org/latest/webr.mjs';
            window.WebR = WebR;
          `
          document.head.appendChild(script)

          // Wait for WebR to be available
          await new Promise((resolve) => {
            const checkWebR = setInterval(() => {
              if (window.WebR) {
                clearInterval(checkWebR)
                resolve(true)
              }
            }, 100)

            // Timeout after 10 seconds
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
        setWebR(webRInstance)
        setHistory((prev) => [
          ...prev,
          { type: "output", content: "R environment loaded successfully!" },
          { type: "output", content: "" },
        ])
      } catch (error) {
        console.error("WebR loading error:", error)
        setHistory((prev) => [...prev, { type: "error", content: `Failed to load R: ${error}` }])
      } finally {
        setIsLoading(false)
      }
    }

    loadWebR()
  }, [])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [history])

  const executeCode = async (code: string) => {
    if (!webR) {
      setHistory((prev) => [...prev, { type: "error", content: "R is not loaded yet" }])
      return
    }

    try {
      const result = await webR.evalR(code)
      const output = await result.toJs()

      if (output !== null && output !== undefined) {
        let outputStr = ""

        // Handle different R object types
        if (typeof output === "object" && output.values) {
          // Vector output
          const values = output.values
          if (Array.isArray(values)) {
            if (values.length === 1) {
              outputStr = `[1] ${values[0]}`
            } else {
              outputStr = values.map((v, i) => (i % 5 === 0 ? `[${i + 1}] ${v}` : v)).join(" ")
            }
          } else {
            outputStr = `[1] ${values}`
          }
        } else if (typeof output === "object") {
          // Complex object - show formatted JSON
          outputStr = JSON.stringify(output, null, 2)
        } else {
          outputStr = String(output)
        }

        setHistory((prev) => [...prev, { type: "output", content: outputStr }])
      }
    } catch (error: any) {
      setHistory((prev) => [...prev, { type: "error", content: error.message || String(error) }])
    }
  }

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const trimmedInput = input.trim()

      if (trimmedInput === "") {
        setHistory((prev) => [...prev, { type: "output", content: "" }])
        setInput("")
        return
      }

      setHistory((prev) => [...prev, { type: "input", content: `> ${trimmedInput}` }])

      if (trimmedInput === "q()" || trimmedInput === "quit()") {
        if (onClose) onClose()
        return
      }

      setInput("")
      await executeCode(trimmedInput)
      setHistory((prev) => [...prev, { type: "output", content: "" }])
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
              line.type === "error" ? "text-red-400" : line.type === "input" ? "text-blue-400" : "text-foreground"
            }`}
          >
            {line.content}
          </div>
        ))}
      </div>
      {isLoading ? (
        <div className="text-primary animate-pulse">Loading R environment...</div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-blue-400">{">"}</span>
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
