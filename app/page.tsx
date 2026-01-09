"use client"

import { Desktop } from "@/components/desktop"
import { FileSystemProvider } from "@/contexts/file-system-context"
import { WebServerProvider } from "@/contexts/web-server-context"
import { PHPProvider } from "@/contexts/php-context"
import { MySQLProvider } from "@/contexts/mysql-context"
import { useFileSystemContext } from "@/contexts/file-system-context"

function DesktopWithServers() {
  const fileSystem = useFileSystemContext()

  return (
    <MySQLProvider>
      <PHPProvider>
        <WebServerProvider fileSystem={fileSystem}>
          <Desktop />
        </WebServerProvider>
      </PHPProvider>
    </MySQLProvider>
  )
}

export default function Page() {
  return (
    <FileSystemProvider>
      <DesktopWithServers />
    </FileSystemProvider>
  )
}
