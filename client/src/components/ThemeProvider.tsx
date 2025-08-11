import { createContext, useContext, useEffect, useState } from "react"
import { getCurrentThaiSpecialDay, getThaiSpecialDayTheme } from "@/lib/thai-special-days"

type Theme = "dark" | "light" | "system" | "thai-special" | "auto"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  specialDay: any
  isAutoMode: boolean
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  specialDay: null,
  isAutoMode: false,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const specialDay = getCurrentThaiSpecialDay()
    if (specialDay) return "thai-special"
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme
  })

  const [specialDay, setSpecialDay] = useState(getCurrentThaiSpecialDay())
  const [isAutoMode, setIsAutoMode] = useState(theme === "auto")

  // Auto dark mode based on time (6 PM - 6 AM = dark mode)
  const getAutoTheme = () => {
    const hour = new Date().getHours()
    return (hour >= 18 || hour < 6) ? "dark" : "light"
  }

  useEffect(() => {
    if (theme === "auto") {
      const autoTheme = getAutoTheme()
      const root = window.document.documentElement
      root.classList.remove("light", "dark", "thai-special")
      root.classList.add(autoTheme)
      
      // Check every hour for auto theme changes
      const autoInterval = setInterval(() => {
        const newAutoTheme = getAutoTheme()
        const currentClasses = root.classList
        if ((newAutoTheme === "dark" && !currentClasses.contains("dark")) ||
            (newAutoTheme === "light" && !currentClasses.contains("light"))) {
          root.classList.remove("light", "dark")
          root.classList.add(newAutoTheme)
        }
      }, 60 * 60 * 1000) // Check every hour
      
      return () => clearInterval(autoInterval)
    }
  }, [theme])

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark", "thai-special")
    
    // Remove any existing Thai special day classes
    root.classList.remove(
      "royal-yellow", "mothers-blue", "fathers-yellow", 
      "national-tricolor", "constitution-gold", "buddhist-saffron", "songkran-blue"
    )

    if (theme === "thai-special") {
      const currentSpecialDay = getCurrentThaiSpecialDay()
      if (currentSpecialDay) {
        root.classList.add("thai-special", currentSpecialDay.theme)
        // Apply special day colors to CSS variables
        const style = root.style
        style.setProperty('--primary', currentSpecialDay.colors.primary)
        style.setProperty('--secondary', currentSpecialDay.colors.secondary)
        style.setProperty('--accent', currentSpecialDay.colors.accent)
      }
      return
    }

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    if (theme === "auto") {
      // Auto theme is handled in separate useEffect
      return
    }

    root.classList.add(theme)
  }, [theme])

  // Check for Thai special days every hour
  useEffect(() => {
    const checkSpecialDay = () => {
      const currentSpecialDay = getCurrentThaiSpecialDay()
      setSpecialDay(currentSpecialDay)
      
      // Auto-switch to special theme if it's a special day and user hasn't manually set theme
      if (currentSpecialDay && theme !== "thai-special") {
        const userTheme = localStorage.getItem(storageKey)
        if (!userTheme || userTheme === "system") {
          setTheme("thai-special")
        }
      }
    }

    checkSpecialDay()
    const interval = setInterval(checkSpecialDay, 60 * 60 * 1000) // Check every hour
    
    return () => clearInterval(interval)
  }, [theme, storageKey])

  const value = {
    theme,
    specialDay,
    isAutoMode: theme === "auto",
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme)
      setTheme(newTheme)
      setIsAutoMode(newTheme === "auto")
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}