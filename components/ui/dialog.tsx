import * as React from "react"

export interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={() => onOpenChange?.(false)}
    >
      {children}
    </div>
  )
}

export interface DialogContentProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function DialogContent({ children, className, style }: DialogContentProps) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: "hsl(var(--background))",
        borderRadius: "var(--radius)",
        maxWidth: "75rem",
        width: "100%",
        maxHeight: "95vh",
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "1.5rem", borderBottom: "1px solid hsl(var(--border))" }}>
      {children}
    </div>
  )
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "1.5rem", fontWeight: "700" }}>
      {children}
    </h2>
  )
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ marginTop: "0.5rem", color: "hsl(var(--muted-foreground))" }}>
      {children}
    </p>
  )
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "1.5rem", borderTop: "1px solid hsl(var(--border))", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
      {children}
    </div>
  )
}
