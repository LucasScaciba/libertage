"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { IconGripVertical } from "@tabler/icons-react"
import { flexRender, type Row } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"

import { type Payment } from "@/components/data-table"

export function DraggableRow({ row }: { row: Row<Payment> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
    position: "relative" as const,
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-state={row.getIsSelected() && "selected"}
    >
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-grab active:cursor-grabbing"
        >
          <IconGripVertical className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Drag to reorder</span>
        </Button>
      </TableCell>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}
