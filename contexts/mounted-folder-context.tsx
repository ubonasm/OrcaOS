"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface MountedFolderContextType {
  directoryHandle: FileSystemDirectoryHandle | null
  isMounted: boolean
  mountFolder: () => Promise<boolean>
  unmountFolder: () => void
  readMountedFile: (path: string) => Promise<string | null>
  listMountedDirectory: (path: string) => Promise<string[]>
  setDirectoryHandle: (handle: FileSystemDirectoryHandle | null) => void
}

const MountedFolderContext = createContext<MountedFolderContextType | null>(null)

export function MountedFolderProvider({ children }: { children: ReactNode }) {
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null)

  const mountFolder = async (): Promise<boolean> => {
    try {
      if (!("showDirectoryPicker" in window)) {
        console.error("File System Access API not supported")
        return false
      }

      const handle = await (window as any).showDirectoryPicker({
        mode: "read",
      })

      setDirectoryHandle(handle)
      console.log("[v0] Folder mounted:", handle.name)
      return true
    } catch (error) {
      console.error("[v0] Failed to mount folder:", error)
      return false
    }
  }

  const unmountFolder = () => {
    setDirectoryHandle(null)
    console.log("[v0] Folder unmounted")
  }

  const readMountedFile = async (path: string): Promise<string | null> => {
    if (!directoryHandle) return null

    try {
      const parts = path.split("/").filter(Boolean)
      let currentHandle: FileSystemDirectoryHandle = directoryHandle

      for (let i = 0; i < parts.length - 1; i++) {
        try {
          currentHandle = await currentHandle.getDirectoryHandle(parts[i])
        } catch {
          return null
        }
      }

      const filename = parts[parts.length - 1]
      const fileHandle = await currentHandle.getFileHandle(filename)
      const file = await fileHandle.getFile()
      const text = await file.text()
      return text
    } catch (error) {
      console.error("[v0] Failed to read mounted file:", error)
      return null
    }
  }

  const listMountedDirectory = async (path = ""): Promise<string[]> => {
    if (!directoryHandle) return []

    try {
      const parts = path.split("/").filter(Boolean)
      let currentHandle: FileSystemDirectoryHandle = directoryHandle

      for (const part of parts) {
        try {
          currentHandle = await currentHandle.getDirectoryHandle(part)
        } catch {
          return []
        }
      }

      const entries: string[] = []
      for await (const entry of (currentHandle as any).values()) {
        const prefix = entry.kind === "directory" ? "📁" : "📄"
        entries.push(`${prefix} ${entry.name}`)
      }
      return entries
    } catch (error) {
      console.error("[v0] Failed to list mounted directory:", error)
      return []
    }
  }

  const value: MountedFolderContextType = {
    directoryHandle,
    isMounted: directoryHandle !== null,
    mountFolder,
    unmountFolder,
    readMountedFile,
    listMountedDirectory,
    setDirectoryHandle,
  }

  return <MountedFolderContext.Provider value={value}>{children}</MountedFolderContext.Provider>
}

export function useMountedFolder() {
  const context = useContext(MountedFolderContext)
  if (!context) {
    throw new Error("useMountedFolder must be used within MountedFolderProvider")
  }
  return context
}
