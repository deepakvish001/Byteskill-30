"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type UserProfile = {
  id: string
  username: string
  full_name?: string
  role: string
  created_at: string
}

const columns: ColumnDef<UserProfile>[] = [
  { accessorKey: "username", header: "Username" },
  { accessorKey: "full_name", header: "Full Name", cell: ({ row }) => row.original.full_name ?? "—" },
  { accessorKey: "role", header: "Role" },
  {
    accessorKey: "created_at",
    header: "Joined",
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
]

export default function UserList() {
  const [users, setUsers] = useState<UserProfile[] | null>(null)
  const table = useReactTable({
    data: users || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/users")
        const data = await res.json()
        setUsers(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Failed to fetch users:", err)
        setUsers([])
      }
    }
    fetchUsers()
  }, [])

  if (users === null) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading users…</span>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
