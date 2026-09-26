"use client"

import { TerminalIcon, FolderOpen, Clock, Code, BarChart3, Book, Laptop, Globe, Database } from "lucide-react"
import { Button } from "./ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import type { WindowState } from "./desktop"
import { useState, useEffect } from "react"
import Image from "next/image"

interface TaskbarProps {
  windows: WindowState[]
  onOpenTerminal: () => void
  onOpenFileManager: () => void
  onOpenPython?: () => void
  onOpenR?: () => void
  onOpenNotebook?: (language: "python" | "r") => void
  onOpenIDE?: (language: "python" | "r") => void
  onOpenBrowser?: () => void
  onOpenMySQL?: () => void
  onRestoreWindow: (id: string) => void
}

export function Taskbar({
  windows,
  onOpenTerminal,
  onOpenFileManager,
  onOpenPython,
  onOpenR,
  onOpenNotebook,
  onOpenIDE,
  onOpenBrowser,
  onOpenMySQL,
  onRestoreWindow,
}: TaskbarProps) {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="absolute bottom-0 left-0 right-0 h-12 bg-secondary/90 backdrop-blur-md border-t border-border flex items-center px-4 gap-2">
      <div className="flex items-center gap-3 mr-2">
        <Image src="/orca-icon.png" alt="OrcaOS Logo" width={32} height={32} className="rounded-full" />
        <span className="font-bold text-sm text-primary hidden sm:block">OrcaOS</span>
      </div>

      <div className="flex gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 hover:bg-primary/20 hover:text-primary"
          onClick={onOpenTerminal}
          title="Open Terminal"
        >
          <TerminalIcon className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 hover:bg-primary/20 hover:text-primary"
          onClick={onOpenFileManager}
          title="Open File Manager"
        >
          <FolderOpen className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 hover:bg-primary/20 hover:text-primary"
          onClick={onOpenBrowser}
          title="Open Browser"
        >
          <Globe className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 hover:bg-primary/20 hover:text-primary"
          onClick={onOpenMySQL}
          title="Open MySQL"
        >
          <Database className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 hover:bg-primary/20 hover:text-primary"
          onClick={onOpenPython}
          title="Open Python"
        >
          <Code className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9 hover:bg-primary/20 hover:text-primary"
          onClick={onOpenR}
          title="Open R"
        >
          <BarChart3 className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 hover:bg-primary/20 hover:text-primary"
              title="Open Notebook"
            >
              <Book className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onOpenNotebook?.("python")}>
              <Code className="h-4 w-4 mr-2" />
              Python Notebook
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenNotebook?.("r")}>
              <BarChart3 className="h-4 w-4 mr-2" />R Notebook
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 hover:bg-primary/20 hover:text-primary"
              title="Open IDE"
            >
              <Laptop className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onOpenIDE?.("python")}>
              <Code className="h-4 w-4 mr-2" />
              Python IDE
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenIDE?.("r")}>
              <BarChart3 className="h-4 w-4 mr-2" />R IDE
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="h-6 w-px bg-border mx-2" />

      <div className="flex-1 flex gap-2 overflow-x-auto">
        {windows.map((window) => (
          <Button
            key={window.id}
            size="sm"
            variant={window.isMinimized ? "outline" : "secondary"}
            className="h-8 min-w-[120px] justify-start"
            onClick={() => onRestoreWindow(window.id)}
          >
            {window.type === "terminal" ? (
              <TerminalIcon className="h-4 w-4 mr-2" />
            ) : window.type === "python-repl" ? (
              <Code className="h-4 w-4 mr-2" />
            ) : window.type === "r-repl" ? (
              <BarChart3 className="h-4 w-4 mr-2" />
            ) : window.type === "notebook" ? (
              <Book className="h-4 w-4 mr-2" />
            ) : window.type === "ide" ? (
              <Laptop className="h-4 w-4 mr-2" />
            ) : window.type === "browser" ? (
              <Globe className="h-4 w-4 mr-2" />
            ) : window.type === "mysql" ? (
              <Database className="h-4 w-4 mr-2" />
            ) : (
              <FolderOpen className="h-4 w-4 mr-2" />
            )}
            <span className="truncate">{window.title}</span>
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span suppressHydrationWarning>
            {time ? time.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
          </span>
        </div>
      </div>
    </div>
  )
}
