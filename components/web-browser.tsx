"use client"

import { useState } from "react"
import { Home, RotateCw, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWebServer } from "@/contexts/web-server-context"
import { usePHP } from "@/contexts/php-context"

interface WebBrowserProps {
  onClose: () => void
}

export function WebBrowser({ onClose }: WebBrowserProps) {
  const [url, setUrl] = useState("http://localhost")
  const [currentUrl, setCurrentUrl] = useState("http://localhost")
  const [history, setHistory] = useState<string[]>(["http://localhost"])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [content, setContent] = useState("")
  const [refreshKey, setRefreshKey] = useState(0)
  const webServer = useWebServer()
  const php = usePHP()

  const loadContent = async (targetUrl: string) => {
    const phpExecutor = php.isReady ? php.execute : undefined
    const htmlContent = await webServer.serveFile(targetUrl, phpExecutor)
    setContent(htmlContent)
    setRefreshKey((prev) => prev + 1)
  }

  const handleNavigate = () => {
    if (url !== currentUrl) {
      const newHistory = [...history.slice(0, historyIndex + 1), url]
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
      setCurrentUrl(url)
      loadContent(url)
    }
  }

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      const newUrl = history[newIndex]
      setUrl(newUrl)
      setCurrentUrl(newUrl)
      loadContent(newUrl)
    }
  }

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      const newUrl = history[newIndex]
      setUrl(newUrl)
      setCurrentUrl(newUrl)
      loadContent(newUrl)
    }
  }

  const handleRefresh = () => {
    loadContent(currentUrl)
  }

  const handleHome = () => {
    const homeUrl = "http://localhost"
    setUrl(homeUrl)
    setCurrentUrl(homeUrl)
    const newHistory = [...history.slice(0, historyIndex + 1), homeUrl]
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    loadContent(homeUrl)
  }

  useState(() => {
    loadContent(currentUrl)
  })

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Browser toolbar */}
      <div className="flex items-center gap-2 p-2 border-b">
        <Button variant="ghost" size="icon" onClick={handleBack} disabled={historyIndex <= 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleForward} disabled={historyIndex >= history.length - 1}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleRefresh}>
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleHome}>
          <Home className="h-4 w-4" />
        </Button>
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleNavigate()
              }
            }}
            placeholder="Enter URL..."
            className="flex-1"
          />
          <Button onClick={handleNavigate} size="sm">
            Go
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="flex-1 bg-white overflow-hidden">
        <iframe
          key={refreshKey}
          srcDoc={content}
          className="w-full h-full border-0"
          sandbox="allow-same-origin allow-scripts"
          title="Browser Content"
        />
      </div>
    </div>
  )
}
