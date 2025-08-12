import { Moon, Sun, Star, Clock, Monitor, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/ThemeProvider"

export function ThemeToggle() {
  const { theme, setTheme, specialDay, isAutoMode } = useTheme()

  const getIcon = () => {
    if (specialDay && theme === "thai-special") return <Star className="h-[1.2rem] w-[1.2rem]" />
    if (isAutoMode) return <Clock className="h-[1.2rem] w-[1.2rem]" />
    if (theme === "system") return <Monitor className="h-[1.2rem] w-[1.2rem]" />
    return (
      <>
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          {getIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
          <Sun className="mr-2 h-4 w-4" />
          โหมดสว่าง
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
          <Moon className="mr-2 h-4 w-4" />
          โหมดมืด
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("auto")} className="cursor-pointer">
          <Clock className="mr-2 h-4 w-4" />
          อัตโนมัติ (ตามเวลา)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
          <Monitor className="mr-2 h-4 w-4" />
          ตามระบบ
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("mint")} className="cursor-pointer">
          <Palette className="mr-2 h-4 w-4" />
          ธีมมินท์
        </DropdownMenuItem>
        {specialDay && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme("thai-special")} className="cursor-pointer">
              <Star className="mr-2 h-4 w-4" />
              🇹🇭 {specialDay.name}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}