"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useFileSystem, type FileSystem } from "@/hooks/use-file-system"

const FileSystemContext = createContext<FileSystem | null>(null)

export function FileSystemProvider({ children }: { children: ReactNode }) {
  const fileSystem = useFileSystem()
  return <FileSystemContext.Provider value={fileSystem}>{children}</FileSystemContext.Provider>
}

export function useFileSystemContext() {
  const context = useContext(FileSystemContext)
  if (!context) {
    throw new Error("useFileSystemContext must be used within FileSystemProvider")
  }
  return context
}
