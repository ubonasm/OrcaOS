"use client"

import { useState } from "react"

export interface FileNode {
  type: "file" | "directory"
  content?: string
  children?: Record<string, FileNode>
}

export interface FileSystem {
  root: FileNode
  currentPath: string
  executeCommand: (command: string, args: string[]) => string
  getDirectory: (path: string) => FileNode | null
  createFile: (path: string, content: string) => boolean
  createDirectory: (path: string) => boolean
  deleteNode: (path: string) => boolean
  writeFile: (path: string, content: string) => boolean
  readFile: (path: string) => string | null
}

const initialFileSystem: FileNode = {
  type: "directory",
  children: {
    home: {
      type: "directory",
      children: {
        user: {
          type: "directory",
          children: {
            "welcome.txt": {
              type: "file",
              content: "Welcome to OrcaOS!\nA lightweight web-based OS simulator.",
            },
            documents: {
              type: "directory",
              children: {
                "readme.md": {
                  type: "file",
                  content:
                    "# OrcaOS\n\nA modern, lightweight operating system simulator.\nPowered by ocean intelligence.",
                },
              },
            },
          },
        },
      },
    },
    etc: {
      type: "directory",
      children: {
        "config.conf": {
          type: "file",
          content: "system=orcaos\nversion=1.0.0",
        },
      },
    },
    var: {
      type: "directory",
      children: {
        log: {
          type: "directory",
          children: {},
        },
        www: {
          type: "directory",
          children: {
            html: {
              type: "directory",
              children: {
                "index.html": {
                  type: "file",
                  content: `<!DOCTYPE html>
<html>
<head>
  <title>Welcome to OrcaOS Web Server</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    h1 { color: #2563eb; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>Welcome to OrcaOS Web Server!</h1>
  <p>If you can see this page, the OrcaOS web server is working correctly.</p>
  <h2>Quick Start</h2>
  <ol>
    <li>Create HTML files in <code>/var/www/html</code></li>
    <li>Edit files using: <code>vi /var/www/html/yourfile.html</code></li>
    <li>Refresh this browser to see changes</li>
  </ol>
  <p><strong>Server Status:</strong> Apache HTTP Server is running</p>
</body>
</html>`,
                },
              },
            },
          },
        },
      },
    },
  },
}

export function useFileSystem(): FileSystem {
  const [root, setRoot] = useState<FileNode>(() => JSON.parse(JSON.stringify(initialFileSystem)))
  const [currentPath, setCurrentPath] = useState("/home/user")

  const setFileSystem = (newRoot: FileNode) => {
    setRoot(() => newRoot)
  }

  const getDirectory = (path: string): FileNode | null => {
    if (path === "/") return root

    const parts = path.split("/").filter(Boolean)
    let current: FileNode | null = root

    for (const part of parts) {
      if (current?.type === "directory" && current.children?.[part]) {
        current = current.children[part]
      } else {
        return null
      }
    }

    return current
  }

  const getParentAndName = (path: string): { parent: FileNode | null; name: string } | null => {
    const parts = path.split("/").filter(Boolean)
    if (parts.length === 0) return null

    const name = parts.pop()!
    const parentPath = parts.length > 0 ? `/${parts.join("/")}` : "/"
    const parent = getDirectory(parentPath)

    return { parent, name }
  }

  const deepClone = (node: FileNode): FileNode => {
    if (node.type === "file") {
      return {
        type: "file",
        content: node.content,
      }
    } else {
      return {
        type: "directory",
        children: node.children
          ? Object.fromEntries(Object.entries(node.children).map(([key, value]) => [key, deepClone(value)]))
          : {},
      }
    }
  }

  const createFile = (path: string, content = ""): boolean => {
    const newRoot = deepClone(root)
    const result = getParentAndName(path)
    if (!result) return false

    const { name } = result
    const parts = path.split("/").filter(Boolean)
    parts.pop()

    let current: FileNode = newRoot
    for (const part of parts) {
      if (current.children && current.children[part]) {
        current = current.children[part]
      } else {
        return false
      }
    }

    if (current.type === "directory" && current.children) {
      if (current.children[name]) {
        return false
      }
      current.children[name] = {
        type: "file",
        content,
      }
      setFileSystem(newRoot)
      return true
    }
    return false
  }

  const createDirectory = (path: string): boolean => {
    const newRoot = deepClone(root)
    const result = getParentAndName(path)
    if (!result) return false

    const { name } = result
    const parts = path.split("/").filter(Boolean)
    parts.pop()

    let current: FileNode = newRoot
    for (const part of parts) {
      if (current.children && current.children[part]) {
        current = current.children[part]
      } else {
        return false
      }
    }

    if (current.type === "directory" && current.children) {
      if (current.children[name]) {
        return false
      }
      current.children[name] = {
        type: "directory",
        children: {},
      }
      setFileSystem(newRoot)
      return true
    }
    return false
  }

  const deleteNode = (path: string): boolean => {
    const newRoot = deepClone(root)
    const result = getParentAndName(path)
    if (!result) return false

    const { name } = result
    const parts = path.split("/").filter(Boolean)
    parts.pop()

    let current: FileNode = newRoot
    for (const part of parts) {
      if (current.children && current.children[part]) {
        current = current.children[part]
      } else {
        return false
      }
    }

    if (current.type === "directory" && current.children?.[name]) {
      delete current.children[name]
      setFileSystem(newRoot)
      return true
    }
    return false
  }

  const writeFile = (path: string, content: string): boolean => {
    console.log("[v0] writeFile called with path:", path)
    let fullPath = path
    if (!path.startsWith("/")) {
      fullPath = `${currentPath}/${path}`
    }
    console.log("[v0] writeFile fullPath:", fullPath)

    const parts = fullPath.split("/").filter(Boolean)
    if (parts.length === 0) {
      console.log("[v0] writeFile failed: no parts")
      return false
    }

    const filename = parts.pop()!
    console.log("[v0] writeFile filename:", filename, "parts:", parts)

    const newRoot = deepClone(root)
    let current: FileNode = newRoot

    for (const part of parts) {
      if (current.type === "directory" && current.children && current.children[part]) {
        current = current.children[part]
      } else {
        console.log("[v0] writeFile failed: path not found at part", part)
        return false
      }
    }

    if (current.type === "directory" && current.children) {
      current.children[filename] = {
        type: "file",
        content: content,
      }
      setFileSystem(newRoot)
      console.log("[v0] writeFile success, file created")
      return true
    }

    console.log("[v0] writeFile failed: current is not a directory")
    return false
  }

  const readFile = (path: string): string | null => {
    let fullPath = path
    if (!path.startsWith("/")) {
      fullPath = `${currentPath}/${path}`
    }

    const parts = fullPath.split("/").filter(Boolean)
    if (parts.length === 0) {
      return null
    }

    const filename = parts.pop()!
    let current: FileNode = root

    for (const part of parts) {
      if (current.type === "directory" && current.children && current.children[part]) {
        current = current.children[part]
      } else {
        return null
      }
    }

    if (current.type === "directory" && current.children && current.children[filename]) {
      const file = current.children[filename]
      if (file.type === "file") {
        return file.content || ""
      }
    }

    return null
  }

  const executeCommand = (command: string, args: string[]): string => {
    switch (command) {
      case "help":
        return `Available commands:
  File Operations:
    ls [dir]     - List directory contents
    cd <dir>     - Change directory
    pwd          - Print working directory
    cat <file>   - Display file contents
    mkdir <dir>  - Create directory
    touch <file> - Create empty file
    rm <file>    - Remove file or directory
    cp <src> <dst> - Copy file (basic)
    mv <src> <dst> - Move/rename file (basic)
    find <name>  - Find files by name
    grep <text> <file> - Search text in file
    
  Text Editors:
    vi <file>    - Open file in vi editor
    nano <file>  - Open file in nano editor
    echo <text> [> file] - Display text or write to file
    
  System Info:
    clear        - Clear terminal
    date         - Show current date and time
    uname        - Show system information
    whoami       - Show current user
    uptime       - Show system uptime
    df           - Show disk space
    ps           - Show running processes
    env          - Show environment variables
    
  Other:
    help         - Show this help message
    history      - Show command history (use arrow keys)`

      case "ls": {
        const targetPath = args[0] ? (args[0].startsWith("/") ? args[0] : `${currentPath}/${args[0]}`) : currentPath
        const dir = getDirectory(targetPath)
        if (dir?.type === "directory" && dir.children) {
          return Object.entries(dir.children)
            .map(([name, node]) => {
              const prefix = node.type === "directory" ? "📁" : "📄"
              return `${prefix} ${name}`
            })
            .join("\n")
        }
        return "Not a directory"
      }

      case "pwd":
        return currentPath

      case "cd": {
        if (args.length === 0) {
          setCurrentPath("/home/user")
          return ""
        }
        const target = args[0]
        let newPath: string

        if (target === "/") {
          newPath = "/"
        } else if (target === "..") {
          const parts = currentPath.split("/").filter(Boolean)
          parts.pop()
          newPath = parts.length > 0 ? `/${parts.join("/")}` : "/"
        } else if (target.startsWith("/")) {
          newPath = target
        } else {
          newPath = currentPath === "/" ? `/${target}` : `${currentPath}/${target}`
        }

        const dir = getDirectory(newPath)
        if (dir && dir.type === "directory") {
          setCurrentPath(newPath)
          return ""
        }
        return `cd: ${target}: No such directory`
      }

      case "cat": {
        if (args.length === 0) {
          return "cat: missing file operand"
        }
        const filename = args[0]
        const dir = getDirectory(currentPath)
        if (dir?.type === "directory" && dir.children?.[filename]) {
          const file = dir.children[filename]
          if (file.type === "file") {
            return file.content || ""
          }
          return `cat: ${filename}: Is a directory`
        }
        return `cat: ${filename}: No such file`
      }

      case "mkdir": {
        if (args.length === 0) {
          return "mkdir: missing operand"
        }
        const dirname = args[0]
        if (createDirectory(`${currentPath}/${dirname}`)) {
          return ""
        }
        return `mkdir: cannot create directory '${dirname}': File exists or invalid path`
      }

      case "touch": {
        if (args.length === 0) {
          return "touch: missing file operand"
        }
        const filename = args[0]
        if (createFile(`${currentPath}/${filename}`, "")) {
          return ""
        }
        return `touch: cannot create file '${filename}': File exists or invalid path`
      }

      case "rm": {
        if (args.length === 0) {
          return "rm: missing operand"
        }
        const name = args[0]
        if (deleteNode(`${currentPath}/${name}`)) {
          return ""
        }
        return `rm: cannot remove '${name}': No such file or directory`
      }

      case "find": {
        if (args.length === 0) {
          return "find: missing search term"
        }
        const searchTerm = args[0].toLowerCase()
        const results: string[] = []

        const search = (node: FileNode, path: string) => {
          if (node.type === "directory" && node.children) {
            for (const [name, child] of Object.entries(node.children)) {
              const fullPath = `${path}/${name}`
              if (name.toLowerCase().includes(searchTerm)) {
                results.push(fullPath)
              }
              if (child.type === "directory") {
                search(child, fullPath)
              }
            }
          }
        }

        search(root, "")
        return results.length > 0 ? results.join("\n") : `find: no matches found for '${searchTerm}'`
      }

      case "grep": {
        if (args.length < 2) {
          return "grep: usage: grep <pattern> <file>"
        }
        const pattern = args[0].toLowerCase()
        const filename = args[1]
        const dir = getDirectory(currentPath)
        if (dir?.type === "directory" && dir.children?.[filename]) {
          const file = dir.children[filename]
          if (file.type === "file" && file.content) {
            const lines = file.content.split("\n")
            const matches = lines.filter((line) => line.toLowerCase().includes(pattern))
            return matches.length > 0 ? matches.join("\n") : `grep: no matches found`
          }
          return `grep: ${filename}: Is a directory`
        }
        return `grep: ${filename}: No such file`
      }

      case "vi":
      case "nano": {
        return ""
      }

      case "clear":
        return "\x1Bc"

      case "echo": {
        const text = args.join(" ")
        const redirectMatch = text.match(/^(.+?)\s*>\s*(.+)$/)
        if (redirectMatch) {
          const content = redirectMatch[1].trim().replace(/^["']|["']$/g, "")
          const filename = redirectMatch[2].trim()
          writeFile(filename, content)
          return ""
        }
        return text
      }

      case "date":
        return new Date().toString()

      case "uname":
        return "OrcaOS 1.0.0 x86_64 GNU/Linux"

      case "whoami":
        return "user"

      case "uptime":
        return `System uptime: ${Math.floor(performance.now() / 1000)}s`

      case "df":
        return `Filesystem     Size  Used Avail Use% Mounted on
/dev/sda1       50G   15G   35G  30% /
tmpfs          8.0G  1.2G  6.8G  15% /tmp`

      case "ps":
        return `PID  TTY      TIME CMD
 1   tty1   00:00:00 init
 42  tty1   00:00:00 orcaos-desktop
 103 tty1   00:00:00 terminal
 104 tty1   00:00:00 bash`

      case "env":
        return `HOME=/home/user
USER=user
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin
OS=OrcaOS
VERSION=1.0.0`

      case "cp": {
        if (args.length < 2) {
          return "cp: usage: cp <source> <destination>"
        }
        const src = args[0]
        const dst = args[1]

        let srcPath = src
        if (!src.startsWith("/")) {
          srcPath = `${currentPath}/${src}`
        }

        // Read source file content
        const content = readFile(srcPath)
        if (content === null) {
          return `cp: ${src}: No such file`
        }

        let dstPath = dst
        if (!dst.startsWith("/")) {
          dstPath = `${currentPath}/${dst}`
        }

        const dstParts = dstPath.split("/").filter(Boolean)
        const dstFilename = dstParts.pop()
        const dstDir = dstParts.length > 0 ? `/${dstParts.join("/")}` : "/"

        if (!getDirectory(dstDir)) {
          return `cp: cannot create '${dst}': No such file or directory`
        }

        if (writeFile(dstPath, content)) {
          return ""
        }
        return `cp: cannot create '${dst}': Invalid path`
      }

      case "mv": {
        if (args.length < 2) {
          return "mv: usage: mv <source> <destination>"
        }
        const src = args[0]
        const dst = args[1]

        console.log("[v0] mv command: src=", src, "dst=", dst)

        let srcPath = src
        if (!src.startsWith("/")) {
          srcPath = `${currentPath}/${src}`
        }
        console.log("[v0] mv srcPath:", srcPath)

        const srcParts = srcPath.split("/").filter(Boolean)
        const srcFilename = srcParts[srcParts.length - 1]

        // Read source file
        const content = readFile(srcPath)
        if (content === null) {
          return `mv: ${src}: No such file or directory`
        }
        console.log("[v0] mv source file read successfully, content length:", content.length)

        let dstPath = dst
        if (!dst.startsWith("/")) {
          dstPath = `${currentPath}/${dst}`
        }
        console.log("[v0] mv initial dstPath:", dstPath)

        if (dstPath.endsWith("/") || getDirectory(dstPath)?.type === "directory") {
          // Destination is a directory, append source filename
          const cleanDstPath = dstPath.replace(/\/$/, "")
          dstPath = `${cleanDstPath}/${srcFilename}`
          console.log("[v0] mv adjusted dstPath for directory:", dstPath)
        }

        const dstParts = dstPath.split("/").filter(Boolean)
        const dstFilename = dstParts.pop()
        const dstDir = dstParts.length > 0 ? `/${dstParts.join("/")}` : "/"
        console.log("[v0] mv dstDir:", dstDir, "dstFilename:", dstFilename)

        if (!dstFilename) {
          return `mv: cannot move '${src}' to '${dst}': Invalid destination`
        }

        // Perform move in a single transaction
        const newRoot = deepClone(root)

        // Navigate to destination directory and create file
        let dstCurrent: FileNode = newRoot
        for (const part of dstParts) {
          if (dstCurrent.type === "directory" && dstCurrent.children && dstCurrent.children[part]) {
            dstCurrent = dstCurrent.children[part]
          } else {
            return `mv: cannot move '${src}' to '${dst}': No such file or directory`
          }
        }

        if (dstCurrent.type !== "directory" || !dstCurrent.children) {
          return `mv: cannot move '${src}' to '${dst}': Destination is not a directory`
        }

        // Create file at destination
        dstCurrent.children[dstFilename] = {
          type: "file",
          content: content,
        }
        console.log("[v0] mv file created at destination")

        // Navigate to source directory and delete file
        const srcPartsForDelete = srcPath.split("/").filter(Boolean)
        const srcFilenameForDelete = srcPartsForDelete.pop()!

        let srcCurrent: FileNode = newRoot
        for (const part of srcPartsForDelete) {
          if (srcCurrent.type === "directory" && srcCurrent.children && srcCurrent.children[part]) {
            srcCurrent = srcCurrent.children[part]
          } else {
            // This shouldn't happen since we already read the file, but handle it anyway
            return `mv: warning: file copied to '${dst}' but source could not be removed`
          }
        }

        if (srcCurrent.type === "directory" && srcCurrent.children && srcCurrent.children[srcFilenameForDelete]) {
          delete srcCurrent.children[srcFilenameForDelete]
          console.log("[v0] mv source file deleted")
        }

        // Update filesystem with both changes
        setFileSystem(newRoot)
        console.log("[v0] mv operation complete")
        return ""
      }

      case "awk": {
        if (args.length < 2) {
          return "awk: usage: awk '<pattern>' <file>"
        }

        const pattern = args[0].replace(/^['"]|['"]$/g, "")
        const filename = args[1]
        const content = readFile(filename)

        if (content === null) {
          return `awk: ${filename}: No such file`
        }

        const lines = content.split("\n")
        const results: string[] = []

        // Match print statements with either curly braces or parentheses
        const printMatch = pattern.match(/[{(]print\s+\$(\d+)[})]/)
        if (printMatch) {
          const fieldNum = Number.parseInt(printMatch[1])
          lines.forEach((line) => {
            if (fieldNum === 0) {
              // $0 means print the entire line
              results.push(line)
            } else {
              // $1, $2, etc. means print specific fields
              const fields = line.split(/\s+/)
              if (fields[fieldNum - 1]) {
                results.push(fields[fieldNum - 1])
              }
            }
          })
          return results.join("\n")
        }

        // Support pattern matching with /pattern/ {print} or /pattern/ (print)
        const patternMatch = pattern.match(/\/(.+?)\/\s*[{(]print[})]/)
        if (patternMatch) {
          const searchPattern = patternMatch[1].toLowerCase()
          lines.forEach((line) => {
            if (line.toLowerCase().includes(searchPattern)) {
              results.push(line)
            }
          })
          return results.length > 0 ? results.join("\n") : ""
        }

        return `awk: invalid pattern '${pattern}'`
      }

      case "history":
        return "Use arrow keys (↑/↓) to navigate command history"

      default:
        return `${command}: command not found`
    }
  }

  const moveNode = (srcPath: string, dstPath: string): boolean => {
    console.log("[v0] moveNode: srcPath=", srcPath, "dstPath=", dstPath)

    // Get source file
    const srcParts = srcPath.split("/").filter(Boolean)
    if (srcParts.length === 0) return false
    const srcFilename = srcParts[srcParts.length - 1]

    // Read source content
    let srcCurrent: FileNode = root
    for (let i = 0; i < srcParts.length - 1; i++) {
      const part = srcParts[i]
      if (srcCurrent.type === "directory" && srcCurrent.children && srcCurrent.children[part]) {
        srcCurrent = srcCurrent.children[part]
      } else {
        console.log("[v0] moveNode: source path not found")
        return false
      }
    }

    if (srcCurrent.type !== "directory" || !srcCurrent.children || !srcCurrent.children[srcFilename]) {
      console.log("[v0] moveNode: source file not found")
      return false
    }

    const sourceFile = srcCurrent.children[srcFilename]
    if (sourceFile.type !== "file") {
      console.log("[v0] moveNode: source is not a file")
      return false
    }

    const content = sourceFile.content || ""
    console.log("[v0] moveNode: source content length:", content.length)

    // Create new root with both operations
    const newRoot = deepClone(root)

    // Navigate to destination and create file
    const dstParts = dstPath.split("/").filter(Boolean)
    if (dstParts.length === 0) return false
    const dstFilename = dstParts.pop()!

    let dstCurrent: FileNode = newRoot
    for (const part of dstParts) {
      if (dstCurrent.type === "directory" && dstCurrent.children && dstCurrent.children[part]) {
        dstCurrent = dstCurrent.children[part]
      } else {
        console.log("[v0] moveNode: destination path not found at part:", part)
        return false
      }
    }

    if (dstCurrent.type !== "directory" || !dstCurrent.children) {
      console.log("[v0] moveNode: destination is not a directory")
      return false
    }

    // Create file at destination
    dstCurrent.children[dstFilename] = {
      type: "file",
      content: content,
    }
    console.log("[v0] moveNode: file created at destination")

    // Remove file from source
    const srcParentParts = srcPath.split("/").filter(Boolean)
    srcParentParts.pop()

    let srcParent: FileNode = newRoot
    for (const part of srcParentParts) {
      if (srcParent.type === "directory" && srcParent.children && srcParent.children[part]) {
        srcParent = srcParent.children[part]
      }
    }

    if (srcParent.type === "directory" && srcParent.children && srcParent.children[srcFilename]) {
      delete srcParent.children[srcFilename]
      console.log("[v0] moveNode: source file deleted")
    }

    setFileSystem(newRoot)
    console.log("[v0] moveNode: operation complete")
    return true
  }

  return {
    root,
    currentPath,
    executeCommand,
    getDirectory,
    createFile,
    createDirectory,
    deleteNode,
    writeFile,
    readFile,
  }
}
