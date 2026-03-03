"use client"

import * as React from "react"

type ThemeConfig = {
  activeTheme: string
  setActiveTheme: (theme: string) => void
}

const ThemeConfigContext = React.createContext<ThemeConfig | undefined>(
  undefined
)

export function ThemeConfigProvider({
  children,
  defaultTheme = "default",
}: {
  children: React.ReactNode
  defaultTheme?: string
}) {
  const [activeTheme, setActiveTheme] = React.useState(defaultTheme)

  React.useEffect(() => {
    const root = document.documentElement
    
    // Remove all theme classes
    root.classList.forEach((className) => {
      if (className.startsWith("theme-")) {
        root.classList.remove(className)
      }
    })
    
    // Add new theme class
    root.classList.add(`theme-${activeTheme}`)
  }, [activeTheme])

  return (
    <ThemeConfigContext.Provider value={{ activeTheme, setActiveTheme }}>
      <div className="theme-container">
        {children}
      </div>
    </ThemeConfigContext.Provider>
  )
}

export function useThemeConfig() {
  const context = React.useContext(ThemeConfigContext)
  if (!context) {
    throw new Error("useThemeConfig must be used within ThemeConfigProvider")
  }
  return context
}
