"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

interface TextEditorProps {
  filename: string
  initialContent: string
  onSave: (content: string) => void
  onClose: () => void
  editorType: "vi" | "nano"
}

export function TextEditor({ filename, initialContent, onSave, onClose, editorType }: TextEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [mode, setMode] = useState<"normal" | "insert">(editorType === "nano" ? "insert" : "normal")
  const [statusMessage, setStatusMessage] = useState("")
  const [commandInput, setCommandInput] = useState("")
  const [showCommandInput, setShowCommandInput] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const commandInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (editorType !== "vi") return

      if (document.activeElement === commandInputRef.current) return

      if (mode === "normal") {
        if (e.key === "i") {
          e.preventDefault()
          setMode("insert")
          setStatusMessage("-- INSERT --")
          textareaRef.current?.focus()
        } else if (e.key === ":") {
          e.preventDefault()
          setShowCommandInput(true)
          setCommandInput(":")
          setTimeout(() => commandInputRef.current?.focus(), 0)
        }
      } else if (mode === "insert") {
        if (e.key === "Escape") {
          e.preventDefault()
          setMode("normal")
          setStatusMessage("")
        }
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [mode, editorType])

  const handleSave = () => {
    onSave(content)
    setStatusMessage(`"${filename}" written`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editorType === "nano") {
      if (e.ctrlKey) {
        if (e.key === "o") {
          e.preventDefault()
          handleSave()
        } else if (e.key === "x") {
          e.preventDefault()
          onClose()
        }
      }
    }
  }

  const handleViCommand = (command: string) => {
    if (command === ":w") {
      onSave(content)
      setStatusMessage(`"${filename}" ${content.length} bytes written`)
    } else if (command === ":q") {
      onClose()
    } else if (command === ":wq" || command === ":x") {
      onSave(content)
      setStatusMessage(`"${filename}" ${content.length} bytes written`)
      setTimeout(() => {
        onClose()
      }, 100)
    } else {
      setStatusMessage(`Unknown command: ${command}`)
    }
    setShowCommandInput(false)
    setCommandInput("")
    textareaRef.current?.focus()
  }

  return (
    <div className="h-full flex flex-col bg-background font-mono text-sm">
      <div className="px-4 py-2 bg-muted/50 border-b border-border flex items-center justify-between">
        <span className="text-foreground">
          {editorType === "vi" ? "Vi" : "Nano"} - {filename}
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleSave}>
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 p-4 bg-background text-foreground resize-none outline-none focus:ring-0"
        readOnly={editorType === "vi" && mode === "normal"}
        spellCheck={false}
        autoFocus
      />

      <div className="px-4 py-2 bg-muted/50 border-t border-border">
        {editorType === "vi" ? (
          <div className="flex items-center gap-4">
            <span className="text-primary">{statusMessage || `-- ${mode.toUpperCase()} --`}</span>
            <span className="text-muted-foreground text-xs">
              Press 'i' for INSERT | ESC for NORMAL | ':w' to save | ':q' to quit
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <span className="text-primary">{statusMessage}</span>
            <span className="text-muted-foreground text-xs">^O Save | ^X Exit</span>
          </div>
        )}
      </div>

      {editorType === "vi" && showCommandInput && (
        <div className="absolute bottom-16 left-4 right-4">
          <input
            ref={commandInputRef}
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            className="w-full bg-background/95 border border-border px-3 py-1 text-foreground font-mono"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleViCommand(commandInput)
              } else if (e.key === "Escape") {
                setShowCommandInput(false)
                setCommandInput("")
                textareaRef.current?.focus()
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                setShowCommandInput(false)
                setCommandInput("")
              }, 100)
            }}
          />
        </div>
      )}
    </div>
  )
}
