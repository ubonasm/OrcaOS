"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { FileSystem } from "@/hooks/use-file-system"

interface WebServerContextType {
  isRunning: boolean
  start: () => void
  stop: () => void
  restart: () => void
  status: () => string
  serveFile: (path: string, phpExecutor?: (code: string) => Promise<string>) => Promise<string>
}

const WebServerContext = createContext<WebServerContextType | undefined>(undefined)

export function WebServerProvider({ children, fileSystem }: { children: ReactNode; fileSystem: FileSystem }) {
  const [isRunning, setIsRunning] = useState(false)

  const start = () => {
    setIsRunning(true)
  }

  const stop = () => {
    setIsRunning(false)
  }

  const restart = () => {
    setIsRunning(false)
    setTimeout(() => setIsRunning(true), 100)
  }

  const status = () => {
    return isRunning ? "Apache HTTP Server is running" : "Apache HTTP Server is stopped"
  }

  const serveFile = async (path: string, phpExecutor?: (code: string) => Promise<string>): Promise<string> => {
    if (!isRunning) {
      return `
<!DOCTYPE html>
<html>
<head>
  <title>Service Unavailable</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    h1 { color: #dc2626; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>503 Service Unavailable</h1>
  <p>The web server is not running.</p>
  <p>To start the server, open a terminal and run: <code>apache2 start</code></p>
</body>
</html>`
    }

    // Normalize path - default to index.html or index.php
    let filePath = path.replace(/^https?:\/\/localhost(:\d+)?/, "")
    if (filePath === "/" || filePath === "") {
      // Try index.php first, then index.html
      const phpIndex = fileSystem.readFile("/var/www/html/index.php")
      if (phpIndex !== null && phpExecutor) {
        const phpResult = await phpExecutor(phpIndex)
        return phpResult
      }
      filePath = "/var/www/html/index.html"
    } else if (!filePath.startsWith("/var/www/html") && !filePath.startsWith("/home/user/data")) {
      filePath = `/var/www/html${filePath}`
    }

    // Try to read file from file system
    const content = fileSystem.readFile(filePath)

    if (content !== null) {
      if (content.startsWith("data:image/")) {
        // Return as-is for images - the browser component will handle it
        return content
      }

      if (filePath.endsWith(".php") && phpExecutor) {
        try {
          const phpResult = await phpExecutor(content)
          return phpResult
        } catch (error) {
          return `
<!DOCTYPE html>
<html>
<head>
  <title>PHP Error</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    h1 { color: #dc2626; }
    pre { background: #f1f5f9; padding: 12px; border-radius: 3px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>PHP Execution Error</h1>
  <pre>${error instanceof Error ? error.message : String(error)}</pre>
</body>
</html>`
        }
      }

      if (filePath.endsWith(".html") || filePath.endsWith(".htm")) {
        let processedContent = content

        // Find all image src attributes and replace with data URLs if available
        const imgRegex = /src=["']([^"']+\.(png|jpg|jpeg|gif|bmp|webp|svg|ico))["']/gi
        const matches = content.matchAll(imgRegex)

        for (const match of matches) {
          const imgPath = match[1]
          // Try to find image in /home/user/data/
          let imageContent = fileSystem.readFile(`/home/user/data/${imgPath}`)
          if (!imageContent) {
            // Try with just the filename
            const filename = imgPath.split("/").pop()
            imageContent = fileSystem.readFile(`/home/user/data/${filename}`)
          }
          if (!imageContent) {
            // Try in /var/www/html/
            imageContent = fileSystem.readFile(`/var/www/html/${imgPath}`)
          }

          if (imageContent && imageContent.startsWith("data:image/")) {
            processedContent = processedContent.replace(match[0], `src="${imageContent}"`)
          }
        }

        return processedContent
      }

      return content
    }

    const filename = filePath.split("/").pop()
    if (filename && /\.(png|jpg|jpeg|gif|bmp|webp|svg|ico)$/i.test(filename)) {
      const dataContent = fileSystem.readFile(`/home/user/data/${filename}`)
      if (dataContent && dataContent.startsWith("data:image/")) {
        return dataContent
      }
    }

    // 404 Not Found
    return `
<!DOCTYPE html>
<html>
<head>
  <title>404 Not Found</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    h1 { color: #dc2626; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>404 Not Found</h1>
  <p>The requested file <code>${filePath}</code> was not found on this server.</p>
  <p>Available files are located in <code>/var/www/html</code></p>
</body>
</html>`
  }

  return (
    <WebServerContext.Provider
      value={{
        isRunning,
        start,
        stop,
        restart,
        status,
        serveFile,
      }}
    >
      {children}
    </WebServerContext.Provider>
  )
}

export function useWebServer() {
  const context = useContext(WebServerContext)
  if (context === undefined) {
    throw new Error("useWebServer must be used within a WebServerProvider")
  }
  return context
}
