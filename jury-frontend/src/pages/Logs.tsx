import { useState, useEffect } from "react"
import { useUser } from "@/contexts/UserContext"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Filter, 
  FileText, 
  Calendar,
  User,
  AlertTriangle,
  Plus,
  Minus,
  Loader2
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { logsApi } from "@/api"
import type { Log } from "@/api"

// Mock log data (fallback structure - will be replaced by API)
const mockLogs = [
  {
    id: 1,
    name: "John Doe",
    category: "Lunch",
    reason: "Late to office",
    count: 2,
    action: "added",
    date: "2024-01-15",
    day: "Monday",
    time: "10:30 AM",
    updatedBy: "Jury 1",
    description: "Repeated tardiness"
  },
  {
    id: 2,
    name: "Jane Smith",
    category: "Cake",
    reason: "Missed meeting",
    count: 1,
    action: "removed",
    date: "2024-01-15",
    day: "Monday", 
    time: "02:15 PM",
    updatedBy: "Jury 2",
    description: "Meeting was rescheduled"
  },
  {
    id: 3,
    name: "Mike Johnson",
    category: "Samosa",
    reason: "Dress code violation",
    count: 3,
    action: "added",
    date: "2024-01-14",
    day: "Sunday",
    time: "09:45 AM",
    updatedBy: "Jury 1",
    description: "Multiple violations this week"
  },
  {
    id: 4,
    name: "Sarah Wilson",
    category: "Lunch",
    reason: "Unauthorized leave",
    count: 1,
    action: "added",
    date: "2024-01-14",
    day: "Sunday",
    time: "03:20 PM",
    updatedBy: "Jury 2",
    description: "Did not inform in advance"
  },
  {
    id: 5,
    name: "Tom Brown",
    category: "Cake",
    reason: "Good performance",
    count: 2,
    action: "removed",
    date: "2024-01-13",
    day: "Saturday",
    time: "11:00 AM",
    updatedBy: "Jury 1",
    description: "Reward for excellent work"
  },
]

export default function Logs() {
  const { user } = useUser()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterAction, setFilterAction] = useState("all")
  const [filterDate, setFilterDate] = useState("all")

  // For jury/admin, show all logs. For employees, show only their logs
  const logsQuery = useQuery<Log[]>({
    queryKey: ["logs", user?.id, user?.role],
    queryFn: () => logsApi.getAll(1, 100, user?.role === "jury" ? undefined : user?.id),
  })

  useEffect(() => {
    if (logsQuery.isError) {
      const error = logsQuery.error as any
      console.error("Failed to load logs:", error)
      toast({
        title: "Error loading logs",
        description: error?.response?.data?.message || error?.message || "Failed to load logs",
        variant: "destructive",
      })
    }
  }, [logsQuery.isError, logsQuery.error, toast])

  const logs = logsQuery.data ?? []

  const filteredLogs = logs.filter(log => {
    // Filter by employee if user is employee
    const matchesUser = !user || user.role === 'jury' || log.userId === user.id
    
    const logResult = log.result || ""
    const logAction = log.action || ""
    const userName = log.user?.name || ""
    
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         logResult.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         logAction.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Extract category from result if available (backend doesn't have separate category field)
    const category = "" // Logs don't have category in backend
    const matchesCategory = filterCategory === "all" || category.toLowerCase() === filterCategory
    
    const matchesAction = filterAction === "all" || logAction.toLowerCase() === filterAction
    
    let matchesDate = true
    if (filterDate !== "all") {
      const today = new Date()
      const logDate = new Date(log.createdAt)
      if (filterDate === "today") {
        matchesDate = logDate.toDateString() === today.toDateString()
      } else if (filterDate === "week") {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        matchesDate = logDate >= weekAgo
      } else if (filterDate === "month") {
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        matchesDate = logDate >= monthAgo
      }
    }
    
    return matchesUser && matchesSearch && matchesCategory && matchesAction && matchesDate
  })

  const getActionBadge = (action: string) => {
    if (action === "added") {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <Plus className="h-3 w-3" />
        Added
      </Badge>
    } else {
      return <Badge variant="default" className="flex items-center gap-1">
        <Minus className="h-3 w-3" />
        Removed
      </Badge>
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "lunch": return "bg-red-500"
      case "cake": return "bg-pink-500"
      case "samosa": return "bg-orange-500"
      default: return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Fine Logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Name, reason, or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-filter">Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="cake">Cake</SelectItem>
                  <SelectItem value="samosa">Samosa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action-filter">Action</Label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="added">Added</SelectItem>
                  <SelectItem value="removed">Removed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-filter">Time Range</Label>
              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Updated By</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : logsQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <AlertTriangle className="h-6 w-6 mx-auto text-destructive mb-2" />
                    <p className="text-sm text-muted-foreground">Failed to load logs</p>
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const logDate = new Date(log.createdAt)
                  const dateStr = logDate.toLocaleDateString()
                  const timeStr = logDate.toLocaleTimeString()
                  const dayStr = logDate.toLocaleDateString('en-US', { weekday: 'long' })
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.user?.name || "Unknown"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getCategoryColor("")}`}></div>
                          N/A
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>{log.result || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">1</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{dateStr}</span>
                          <span className="text-sm text-muted-foreground">{timeStr}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{dayStr}</Badge>
                      </TableCell>
                      <TableCell>{log.user?.name || "System"}</TableCell>
                      <TableCell className="max-w-48">
                        <div className="truncate" title={log.result}>
                          {log.result || "—"}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No logs found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}