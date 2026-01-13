"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, Minus, Square } from "lucide-react"
import { Button } from "./ui/button"
import type { WindowState } from "./desktop"

interface WindowProps {
  window: WindowState
  onClose: () => void
  onMinimize: () => void
  onMaximize: () => void
  onFocus: () => void
  onUpdatePosition: (id: string, x: number, y: number) => void
  onUpdateSize: (id: string, width: number, height: number) => void
  children: React.ReactNode
}

export function Window({
  window,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onUpdatePosition,
  onUpdateSize,
  children,
}: WindowProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const windowRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".window-controls")) return
    if (window.isMaximized) return

    setIsDragging(true)
    setDragOffset({
      x: e.clientX - window.x,
      y: e.clientY - window.y,
    })
    onFocus()
  }

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.isMaximized) return
    setIsResizing(true)
    onFocus()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, e.clientX - dragOffset.x)
        const newY = Math.max(0, e.clientY - dragOffset.y)
        onUpdatePosition(window.id, newX, newY)
      } else if (isResizing) {
        const rect = windowRef.current?.getBoundingClientRect()
        if (rect) {
          const newWidth = Math.max(400, e.clientX - rect.left)
          const newHeight = Math.max(300, e.clientY - rect.top)
          onUpdateSize(window.id, newWidth, newHeight)
        }
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, isResizing, dragOffset, window.id, onUpdatePosition, onUpdateSize])

  const style = window.isMaximized
    ? {
        left: 0,
        top: 0,
        width: "100%",
        height: "calc(100% - 48px)",
        zIndex: window.zIndex,
      }
    : {
        left: window.x,
        top: window.y,
        width: window.width,
        height: window.height,
        zIndex: window.zIndex,
      }

  return (
    <div
      ref={windowRef}
      className="absolute bg-card rounded-lg shadow-2xl border-2 border-border/60 overflow-hidden flex flex-col"
      style={style}
      onMouseDown={onFocus}
    >
      {/* Title bar */}
      <div
        className="h-10 bg-secondary/50 backdrop-blur-sm flex items-center justify-between px-3 cursor-move select-none border-b-2 border-border/60"
        onMouseDown={handleMouseDown}
      >
        <span className="text-sm font-medium text-foreground">{window.title}</span>
        <div className="flex gap-2 window-controls">
          <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-muted" onClick={onMinimize}>
            <Minus className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-muted" onClick={onMaximize}>
            <Square className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* Resize handle */}
      {!window.isMaximized && (
        <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize" onMouseDown={handleResizeMouseDown} />
      )}
    </div>
  )
}
