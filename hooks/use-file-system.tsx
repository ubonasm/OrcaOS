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
    let fullPath = path
    if (!path.startsWith("/")) {
      fullPath = `${currentPath}/${path}`
    }

    const parts = fullPath.split("/").filter(Boolean)
    if (parts.length === 0) {
      return false
    }

    const filename = parts.pop()!

    setRoot((currentRoot) => {
      const newRoot = deepClone(currentRoot)
      let current: FileNode = newRoot

      for (const part of parts) {
        if (current.type === "directory" && current.children && current.children[part]) {
          current = current.children[part]
        } else {
          return currentRoot
        }
      }

      if (current.type === "directory" && current.children) {
        current.children[filename] = {
          type: "file",
          content: content,
        }

        return newRoot
      }

      return currentRoot
    })

    return true
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
        const dir = getDirectory(currentPath)
        if (dir?.type === "directory" && dir.children?.[src]) {
          const srcFile = dir.children[src]
          if (srcFile.type === "file") {
            createFile(`${currentPath}/${dst}`, srcFile.content || "")
            return ""
          }
          return `cp: ${src}: Is a directory`
        }
        return `cp: ${src}: No such file`
      }

      case "mv": {
        if (args.length < 2) {
          return "mv: usage: mv <source> <destination>"
        }
        const src = args[0]
        const dst = args[1]
        const newRoot = deepClone(root)
        const dir = getDirectory(currentPath)
        if (dir?.type === "directory" && dir.children?.[src]) {
          const parts = currentPath.split("/").filter(Boolean)
          let current: FileNode = newRoot
          for (const part of parts) {
            if (current.children && current.children[part]) {
              current = current.children[part]
            }
          }
          if (current.type === "directory" && current.children) {
            const srcNode = current.children[src]
            current.children[dst] = srcNode
            delete current.children[src]
            setFileSystem(newRoot)
            return ""
          }
        }
        return `mv: ${src}: No such file or directory`
      }

      case "history":
        return "Use arrow keys (↑/↓) to navigate command history"

      default:
        return `${command}: command not found`
    }
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
