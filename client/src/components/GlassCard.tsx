import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.ComponentProps<typeof Card> {
  header?: React.ReactNode;
  contentClassName?: string;
}

export function GlassCard({ className, children, header, contentClassName, ...props }: GlassCardProps) {
  return (
    <Card
      className={cn(
        "backdrop-blur-md bg-white/70 dark:bg-zinc-900/40 border border-white/30 dark:border-white/10 shadow-xl",
        "rounded-xl",
        className
      )}
      {...props}
    >
      {header}
      <CardContent className={cn("p-4 md:p-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

export function GlassCardHeader({
  title,
  description,
  icon,
}: { title?: React.ReactNode; description?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <CardHeader className="bg-gradient-to-r from-orange-50/70 to-red-50/60 dark:from-orange-900/10 dark:to-red-900/10 rounded-t-xl">
      <CardTitle className="flex items-center gap-2 font-kanit text-orange-700">
        {icon}
        {title}
      </CardTitle>
      {description ? <CardDescription className="font-sarabun">{description}</CardDescription> : null}
    </CardHeader>
  );
}
