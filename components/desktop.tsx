"use client"

import { useState, useEffect } from "react"
import { Window } from "./window"
import { Taskbar } from "./taskbar"
import { Terminal } from "./terminal"
import { FileManager } from "./file-manager"
import { TextEditor } from "./text-editor"
import { PythonRepl } from "./python-repl"
import { RRepl } from "./r-repl"
import { Notebook } from "./notebook"
import { DataScienceIDE } from "./data-science-ide"
import { WebBrowser } from "./web-browser"
import { MySQLClient } from "./mysql-client"
import { useFileSystemContext } from "@/contexts/file-system-context"

export type WindowType =
  | "terminal"
  | "file-manager"
  | "text-editor"
  | "python-repl"
  | "r-repl"
  | "notebook"
  | "ide"
  | "browser"
  | "mysql"

export interface WindowState {
  id: string
  type: WindowType
  title: string
  isMinimized: boolean
  isMaximized: boolean
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  metadata?: {
    filename?: string
    fullPath?: string
    content?: string
    editorType?: "vi" | "nano"
    language?: "python" | "r"
  }
}

export function Desktop() {
  const [windows, setWindows] = useState<WindowState[]>([])
  const [maxZIndex, setMaxZIndex] = useState(1)
  const fileSystem = useFileSystemContext()
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  const openWindow = (type: WindowType, metadata?: WindowState["metadata"] & { language?: "python" | "r" }) => {
    const title =
      type === "terminal"
        ? "Terminal"
        : type === "file-manager"
          ? "File Manager"
          : type === "python-repl"
            ? "Python"
            : type === "r-repl"
              ? "R"
              : type === "notebook"
                ? `Notebook (${metadata?.language || "python"})`
                : type === "ide"
                  ? `IDE (${metadata?.language || "python"})`
                  : type === "browser"
                    ? "Web Browser"
                    : type === "mysql"
                      ? "MySQL Client"
                      : metadata?.filename || "Text Editor"
    const newWindow: WindowState = {
      id: `${type}-${Date.now()}`,
      type,
      title,
      isMinimized: false,
      isMaximized: false,
      x: 100 + windows.length * 30,
      y: 80 + windows.length * 30,
      width:
        type === "terminal"
          ? 700
          : type === "file-manager"
            ? 800
            : type === "python-repl" || type === "r-repl"
              ? 700
              : type === "notebook"
                ? 900
                : type === "ide"
                  ? 1000
                  : type === "browser"
                    ? 1100
                    : type === "mysql"
                      ? 900
                      : 750,
      height:
        type === "terminal"
          ? 500
          : type === "file-manager"
            ? 600
            : type === "python-repl" || type === "r-repl"
              ? 500
              : type === "notebook"
                ? 650
                : type === "ide"
                  ? 700
                  : type === "browser"
                    ? 750
                    : type === "mysql"
                      ? 650
                      : 550,
      zIndex: maxZIndex + 1,
      metadata,
    }
    setWindows([...windows, newWindow])
    setMaxZIndex(maxZIndex + 1)
  }

  const handleOpenEditor = (filename: string, content: string, editorType: "vi" | "nano") => {
    openWindow("text-editor", { filename, fullPath: filename, content, editorType })
  }

  const handleSaveFile = (windowId: string, fullPath: string, content: string, shouldClose = true) => {
    fileSystem.writeFile(fullPath, content)

    if (shouldClose) {
      closeWindow(windowId)
    }
  }

  const closeWindow = (id: string) => {
    setWindows(windows.filter((w) => w.id !== id))
  }

  const minimizeWindow = (id: string) => {
    setWindows(windows.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)))
  }

  const restoreWindow = (id: string) => {
    setWindows(windows.map((w) => (w.id === id ? { ...w, isMinimized: false, zIndex: maxZIndex + 1 } : w)))
    setMaxZIndex(maxZIndex + 1)
  }

  const maximizeWindow = (id: string) => {
    setWindows(windows.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w)))
  }

  const focusWindow = (id: string) => {
    setWindows(windows.map((w) => (w.id === id ? { ...w, zIndex: maxZIndex + 1 } : w)))
    setMaxZIndex(maxZIndex + 1)
  }

  const updateWindowPosition = (id: string, x: number, y: number) => {
    setWindows(windows.map((w) => (w.id === id ? { ...w, x, y } : w)))
  }

  const updateWindowSize = (id: string, width: number, height: number) => {
    setWindows(windows.map((w) => (w.id === id ? { ...w, width, height } : w)))
  }

  return (
    <div className="h-screen w-screen bg-background overflow-hidden relative">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/japanese-landscape.jpg')",
          opacity: 0.85,
        }}
      />
      <div className="absolute inset-0 bg-background/20" />

      {showSplash && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="text-center space-y-6 p-8">
            <div className="flex items-center justify-center mb-8">
              <img src="/orcaos01.jpg" alt="OrcaOS Logo" className="w-32 h-32 object-contain" />
            </div>
            <h1 className="text-5xl font-bold text-primary mb-2">OrcaOS</h1>
            <p className="text-xl text-muted-foreground">Lightweight Web-based Operating System</p>
            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Developed by <span className="text-foreground font-semibold">SAKAMOTO, M.</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Professor, Faculty of Education, Nagoya University</p>
              <p className="text-xs text-muted-foreground">2026</p>
            </div>
            <div className="mt-8">
              <div className="animate-pulse text-primary">Loading...</div>
            </div>
          </div>
        </div>
      )}

      {/* Windows */}
      {windows.map((window) => {
        if (window.isMinimized) return null

        return (
          <Window
            key={window.id}
            window={window}
            onClose={() => closeWindow(window.id)}
            onMinimize={() => minimizeWindow(window.id)}
            onMaximize={() => maximizeWindow(window.id)}
            onFocus={() => focusWindow(window.id)}
            onUpdatePosition={updateWindowPosition}
            onUpdateSize={updateWindowSize}
          >
            {window.type === "terminal" && (
              <Terminal
                onOpenEditor={handleOpenEditor}
                onOpenPython={() => openWindow("python-repl")}
                onOpenR={() => openWindow("r-repl")}
                onOpenNotebook={() => openWindow("notebook", { language: "python" } as any)}
                onOpenMySQL={() => openWindow("mysql")}
              />
            )}
            {window.type === "file-manager" && <FileManager fileSystem={fileSystem} />}
            {window.type === "python-repl" && <PythonRepl onClose={() => closeWindow(window.id)} />}
            {window.type === "r-repl" && <RRepl onClose={() => closeWindow(window.id)} />}
            {window.type === "text-editor" && window.metadata && (
              <TextEditor
                filename={window.metadata.filename || "untitled"}
                initialContent={window.metadata.content || ""}
                editorType={window.metadata.editorType || "vi"}
                onSave={(content) => {
                  const pathToSave = window.metadata?.fullPath || window.metadata?.filename || "untitled"
                  handleSaveFile(window.id, pathToSave, content, false)
                }}
                onClose={() => closeWindow(window.id)}
              />
            )}
            {window.type === "notebook" && <Notebook language={(window.metadata as any)?.language || "python"} />}
            {window.type === "ide" && <DataScienceIDE language={(window.metadata as any)?.language || "python"} />}
            {window.type === "browser" && <WebBrowser onClose={() => closeWindow(window.id)} />}
            {window.type === "mysql" && <MySQLClient onClose={() => closeWindow(window.id)} />}
          </Window>
        )
      })}

      {/* Taskbar */}
      <Taskbar
        windows={windows}
        onOpenTerminal={() => openWindow("terminal")}
        onOpenFileManager={() => openWindow("file-manager")}
        onOpenPython={() => openWindow("python-repl")}
        onOpenR={() => openWindow("r-repl")}
        onOpenNotebook={(language) => openWindow("notebook", { language } as any)}
        onOpenIDE={(language) => openWindow("ide", { language } as any)}
        onOpenBrowser={() => openWindow("browser")}
        onOpenMySQL={() => openWindow("mysql")}
        onRestoreWindow={restoreWindow}
      />
    </div>
  )
}
