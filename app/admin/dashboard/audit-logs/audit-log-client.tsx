"use client"

import { useState, useEffect, useMemo } from "react"
import { adminGetAuditLogs } from "../actions"
import type { AuditLogWithActor } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PaginationControls } from "@/components/pagination-controls"
import { useDebounce } from "@/hooks/use-debounce"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription as UIDescription, AlertTitle as UITitle } from "@/components/ui/alert" // Renamed to avoid conflict

const ITEMS_PER_PAGE = 15

export default function AuditLogClient() {
  const [logs, setLogs] = useState<AuditLogWithActor[]>([])
  const [totalLogs, setTotalLogs] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterAction, setFilterAction] = useState("all")
  const [filterTargetType, setFilterTargetType] = useState("all")

  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map((log) => log.action))
    return Array.from(actions).sort()
  }, [logs])

  const uniqueTargetTypes = useMemo(() => {
    const types = new Set(logs.map((log) => log.target_type).filter(Boolean) as string[])
    return Array.from(types).sort()
  }, [logs])

  useEffect(() => {
    async function fetchLogs() {
      setIsLoading(true)
      setError(null)
      try {
        const result = await adminGetAuditLogs({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          action: filterAction === "all" ? undefined : filterAction,
          targetType: filterTargetType === "all" ? undefined : filterTargetType,
          targetId: debouncedSearchTerm || undefined, // Using targetId for general search for simplicity
        })
        if (result.success) {
          setLogs(result.logs)
          setTotalLogs(result.count || 0)
        } else {
          setError(result.message || "Failed to fetch audit logs.")
        }
      } catch (e: any) {
        setError("An unexpected error occurred: " + e.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchLogs()
  }, [currentPage, debouncedSearchTerm, filterAction, filterTargetType])

  const totalPages = Math.ceil(totalLogs / ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Log Entries</CardTitle>
        <CardDescription>Review administrative actions performed on the site.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Input
            placeholder="Search by Target ID or Actor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:col-span-1"
          />
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {uniqueActions.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTargetType} onValueChange={setFilterTargetType}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Target Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Target Types</SelectItem>
              {uniqueTargetTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading audit logs...</p>
          </div>
        )}
        {error && !isLoading && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <UITitle>Error</UITitle>
            <UIDescription>{error}</UIDescription>
          </Alert>
        )}
        {!isLoading && !error && logs.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">No audit logs found matching your criteria.</div>
        )}

        {!isLoading && !error && logs.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target Type</TableHead>
                    <TableHead>Target ID</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={log.actor?.avatar_url || undefined} alt={log.actor?.username || "User"} />
                            <AvatarFallback>{log.actor?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{log.actor?.username || "System"}</p>
                            {log.actor?.full_name && (
                              <p className="text-xs text-muted-foreground">{log.actor.full_name}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm bg-muted px-1 py-0.5 rounded">{log.action}</span>
                      </TableCell>
                      <TableCell>{log.target_type || "N/A"}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{log.target_id || "N/A"}</TableCell>
                      <TableCell className="max-w-[300px]">
                        {log.details && (
                          <details className="text-xs">
                            <summary className="cursor-pointer hover:underline">View Details</summary>
                            <pre className="mt-1 whitespace-pre-wrap break-all bg-muted p-2 rounded-md">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(log.created_at), "MMM d, yyyy, h:mm a")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
