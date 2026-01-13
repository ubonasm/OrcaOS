"use client"

import { useState } from "react"
import type { FileSystem } from "@/hooks/use-file-system"
import { Folder, File, ArrowLeft, Home } from "lucide-react"
import { Button } from "./ui/button"

interface FileManagerProps {
  fileSystem: FileSystem
}

export function FileManager({ fileSystem }: FileManagerProps) {
  const [currentPath, setCurrentPath] = useState("/")
  const currentDir = fileSystem.getDirectory(currentPath)
  const pathParts = currentPath.split("/").filter(Boolean)

  const navigateToDir = (dirName: string) => {
    if (dirName === "..") {
      const parentPath = pathParts.slice(0, -1).join("/")
      setCurrentPath(parentPath ? `/${parentPath}` : "/")
    } else {
      const newPath = currentPath === "/" ? `/${dirName}` : `${currentPath}/${dirName}`
      setCurrentPath(newPath)
    }
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Toolbar */}
      <div className="h-12 bg-secondary/50 border-b border-border flex items-center px-4 gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => navigateToDir("..")}
          disabled={currentPath === "/"}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setCurrentPath("/")}>
          <Home className="h-4 w-4" />
        </Button>
        <div className="flex-1 ml-4 text-sm text-muted-foreground">{currentPath}</div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-1">
          {currentPath !== "/" && (
            <button
              className="flex items-center gap-3 p-3 rounded hover:bg-secondary/50 text-left"
              onClick={() => navigateToDir("..")}
            >
              <Folder className="h-5 w-5 text-primary" />
              <span className="text-sm">..</span>
            </button>
          )}
          {currentDir?.children &&
            Object.entries(currentDir.children).map(([name, node]) => (
              <button
                key={name}
                className="flex items-center gap-3 p-3 rounded hover:bg-secondary/50 text-left"
                onClick={() => node.type === "directory" && navigateToDir(name)}
              >
                {node.type === "directory" ? (
                  <Folder className="h-5 w-5 text-primary" />
                ) : (
                  <File className="h-5 w-5 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <div className="text-sm">{name}</div>
                  {node.type === "file" && (
                    <div className="text-xs text-muted-foreground">{node.content?.length || 0} bytes</div>
                  )}
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}
