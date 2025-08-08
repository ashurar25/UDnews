import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useTheme } from "@/components/ThemeProvider"
import { formatThaiDate } from "@/lib/thai-special-days"

export function ThaiSpecialDayBanner() {
  const { specialDay, theme } = useTheme()

  if (!specialDay || theme !== "thai-special") {
    return null
  }

  return (
    <Card className="mx-4 mb-4 border-primary bg-gradient-primary">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🇹🇭</div>
            <div>
              <h3 className="text-lg font-bold text-primary-foreground font-kanit">
                {specialDay.name}
              </h3>
              <p className="text-sm text-primary-foreground/80 font-sarabun">
                {specialDay.description}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="font-sarabun">
            {formatThaiDate(new Date())}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}