"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Save, BarChart2, Eye } from "lucide-react"
import { Button } from "./ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

interface DataScienceIDEProps {
  language?: "python" | "r"
}

interface Variable {
  name: string
  type: string
  value: string
}

declare global {
  interface Window {
    loadPyodide: any
    WebR: any
  }
}

export function DataScienceIDE({ language = "python" }: DataScienceIDEProps) {
  const [code, setCode] = useState(
    language === "python"
      ? `# Python Data Science IDE
import numpy as np
import pandas as pd

# Create sample data
data = np.array([1, 2, 3, 4, 5])
print("Array:", data)
print("Mean:", data.mean())
`
      : `# R Data Science IDE
# Create sample data
data <- c(1, 2, 3, 4, 5)
print(paste("Data:", toString(data)))
print(paste("Mean:", mean(data)))
`,
  )
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [variables, setVariables] = useState<Variable[]>([])
  const [interpreter, setInterpreter] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const consoleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadInterpreter = async () => {
      try {
        if (language === "python") {
          // @ts-ignore
          const pyodideModule = await window.loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
          })
          setInterpreter(pyodideModule)
          setConsoleOutput(["Python 3.11.0 (Pyodide)", "Ready to execute code", ""])
        } else {
          if (!window.WebR) {
            const script = document.createElement("script")
            script.type = "module"
            script.innerHTML = `
              import { WebR } from 'https://webr.r-wasm.org/latest/webr.mjs';
              window.WebR = WebR;
            `
            document.head.appendChild(script)

            await new Promise((resolve) => {
              const checkWebR = setInterval(() => {
                if (window.WebR) {
                  clearInterval(checkWebR)
                  resolve(true)
                }
              }, 100)

              setTimeout(() => {
                clearInterval(checkWebR)
                resolve(false)
              }, 10000)
            })
          }

          if (!window.WebR) {
            throw new Error("WebR failed to load")
          }

          const webRInstance = new window.WebR()
          await webRInstance.init()
          setInterpreter(webRInstance)
          setConsoleOutput(["R version 4.3.0 (WebR)", "Ready to execute code", ""])
        }
      } catch (error) {
        setConsoleOutput([`Failed to load ${language} interpreter: ${error}`])
      } finally {
        setIsLoading(false)
      }
    }

    if (!document.getElementById("pyodide-script") && language === "python") {
      const script = document.createElement("script")
      script.id = "pyodide-script"
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js"
      script.async = true
      script.onload = () => loadInterpreter()
      document.head.appendChild(script)
    } else {
      loadInterpreter()
    }
  }, [language])

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [consoleOutput])

  const formatROutput = (result: any): string => {
    if (!result || typeof result !== "object") {
      return String(result)
    }

    if (result.values && Array.isArray(result.values)) {
      const values = result.values

      if (values.length === 0) return "NULL"

      // For single values
      if (values.length === 1) {
        return `[1] ${values[0]}`
      }

      // For arrays, show in R style with index markers
      let output = ""
      for (let i = 0; i < values.length; i += 5) {
        output += `[${i + 1}] `
        const chunk = values.slice(i, i + 5)
        output += chunk.join(" ")
        if (i + 5 < values.length) output += "\n"
      }
      return output
    }

    return JSON.stringify(result, null, 2)
  }

  const runCode = async () => {
    if (!interpreter || isRunning) return

    setIsRunning(true)
    setConsoleOutput((prev) => [...prev, ">>> Running script...", ""])

    try {
      if (language === "python") {
        const packageMap: { [key: string]: string } = {
          numpy: "numpy",
          np: "numpy",
          pandas: "pandas",
          pd: "pandas",
          matplotlib: "matplotlib",
          sklearn: "scikit-learn",
          scipy: "scipy",
        }

        // Extract import statements
        const importRegex = /import\s+(\w+)|from\s+(\w+)\s+import|import\s+\w+\s+as\s+(\w+)/g
        const imports = new Set<string>()
        let match

        while ((match = importRegex.exec(code)) !== null) {
          const importName = match[1] || match[2] || match[3]
          if (importName && packageMap[importName]) {
            imports.add(packageMap[importName])
          }
        }

        // Load packages
        if (imports.size > 0) {
          setConsoleOutput((prev) => [...prev, `Loading packages: ${Array.from(imports).join(", ")}...`, ""])
          for (const pkg of imports) {
            try {
              await interpreter.loadPackage(pkg)
            } catch (error) {
              setConsoleOutput((prev) => [...prev, `Warning: Failed to load ${pkg}`, ""])
            }
          }
        }

        await interpreter.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
`)

        const result = await interpreter.runPythonAsync(code)
        const stdout = await interpreter.runPythonAsync("sys.stdout.getvalue()")
        const stderr = await interpreter.runPythonAsync("sys.stderr.getvalue()")

        await interpreter.runPythonAsync(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`)

        if (stderr) {
          setConsoleOutput((prev) => [...prev, `Error: ${stderr}`, ""])
        } else {
          const output = stdout || (result !== undefined && result !== null ? String(result) : "Execution completed")
          setConsoleOutput((prev) => [...prev, output, ""])
        }

        // Get variables
        const varsCode = `
import json
vars_dict = {}
for name, value in globals().items():
    if not name.startswith('_'):
        try:
            vars_dict[name] = {
                'type': type(value).__name__,
                'value': str(value)[:100]
            }
        except:
            pass
json.dumps(vars_dict)
`
        const varsJson = await interpreter.runPythonAsync(varsCode)
        const varsObj = JSON.parse(varsJson)
        const varsList: Variable[] = Object.entries(varsObj).map(([name, info]: [string, any]) => ({
          name,
          type: info.type,
          value: info.value,
        }))
        setVariables(varsList)
      } else {
        const result = await interpreter.evalR(code)
        const output = await result.toJs()
        const outputStr = formatROutput(output)
        setConsoleOutput((prev) => [...prev, outputStr, ""])
      }
    } catch (error: any) {
      setConsoleOutput((prev) => [...prev, `Error: ${error.message || String(error)}`, ""])
    } finally {
      setIsRunning(false)
    }
  }

  const saveScript = () => {
    const blob = new Blob([code], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = language === "python" ? "script.py" : "script.R"
    a.click()
    URL.revokeObjectURL(url)
    setConsoleOutput((prev) => [...prev, `Script saved as ${language === "python" ? "script.py" : "script.R"}`, ""])
  }

  return (
    <div className="h-full bg-background flex">
      {/* Left side - Editor */}
      <div className="flex-1 flex flex-col border-r border-border">
        <div className="border-b border-border p-2 flex items-center gap-2 bg-secondary/50">
          <Button size="sm" onClick={runCode} disabled={isLoading || isRunning} className="gap-2">
            <Play className="h-4 w-4" />
            Run
          </Button>
          <Button size="sm" variant="outline" onClick={saveScript} className="gap-2 bg-transparent">
            <Save className="h-4 w-4" />
            Save
          </Button>
          <div className="ml-auto text-sm text-muted-foreground">
            {isLoading ? "Loading..." : isRunning ? "Running..." : `${language === "python" ? "Python" : "R"} IDE`}
          </div>
        </div>

        <div className="flex-1 p-4 overflow-auto">
          <textarea
            className="w-full h-full bg-transparent outline-none resize-none font-mono text-sm"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Write your code here..."
            spellCheck={false}
          />
        </div>
      </div>

      {/* Right side - Console, Variables, Plots */}
      <div className="w-96 flex flex-col">
        <Tabs defaultValue="console" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="console">Console</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="plots">Plots</TabsTrigger>
          </TabsList>

          <TabsContent value="console" className="flex-1 overflow-hidden">
            <div ref={consoleRef} className="h-full overflow-y-auto p-4 font-mono text-sm space-y-1 bg-background/50">
              {consoleOutput.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="variables" className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {variables.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No variables in workspace
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {variables.map((variable, i) => (
                    <div key={i} className="p-2 border border-border rounded bg-card text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-primary">{variable.name}</span>
                        <span className="text-xs text-muted-foreground">({variable.type})</span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{variable.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="plots" className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-4 text-center text-sm text-muted-foreground">
              <BarChart2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Plots will appear here</p>
              <p className="text-xs mt-2">Run code with visualization to see plots</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
