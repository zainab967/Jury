import { useState, useMemo, useEffect } from "react"
import { useUser } from "@/contexts/UserContext"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { DollarSign, Plus, Loader2, AlertTriangle, Trash2, Download, FileSpreadsheet, FileText } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { usersApi, expensesApi, activitiesApi, exportApi } from "@/api"
import type { User } from "@/types"
import type { Expense, CreateExpensePayload } from "@/api"

export default function Expenses() {
  const { isJury } = useUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedActivity, setSelectedActivity] = useState<string>("none")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [totalCollectionInput, setTotalCollectionInput] = useState<string>("")
  const [billInput, setBillInput] = useState<string>("")
  const [notes, setNotes] = useState("")

  const usersQuery = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => usersApi.getAll(),
    retry: 1,
  })

  const expensesQuery = useQuery<Expense[]>({
    queryKey: ["expenses"],
    queryFn: () => expensesApi.getAll(1, 100),
    retry: 1,
  })

  const activitiesQuery = useQuery({
    queryKey: ["activities"],
    queryFn: () => activitiesApi.getAll(1, 100),
    retry: 1,
  })

  useEffect(() => {
    if (usersQuery.isError) {
      const error = usersQuery.error as any
      console.error("Failed to load users:", error)
      toast({
        title: "Error loading users",
        description: error?.response?.data?.message || error?.message || "Failed to load users",
        variant: "destructive",
      })
    }
  }, [usersQuery.isError, usersQuery.error, toast])

  useEffect(() => {
    if (expensesQuery.isError) {
      const error = expensesQuery.error as any
      console.error("Failed to load expenses:", error)
      toast({
        title: "Error loading expenses",
        description: error?.response?.data?.message || error?.message || "Failed to load expenses",
        variant: "destructive",
      })
    }
  }, [expensesQuery.isError, expensesQuery.error, toast])

  useEffect(() => {
    if (activitiesQuery.isError) {
      const error = activitiesQuery.error as any
      console.error("Failed to load activities:", error)
      toast({
        title: "Error loading activities",
        description: error?.response?.data?.message || error?.message || "Failed to load activities",
        variant: "destructive",
      })
    }
  }, [activitiesQuery.isError, activitiesQuery.error, toast])

  const activities = (activitiesQuery.data && Array.isArray(activitiesQuery.data)) ? activitiesQuery.data : []

  const createExpenseMutation = useMutation({
    mutationFn: (payload: CreateExpensePayload) => expensesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
      setSelectedActivity("none")
      setSelectedMembers([])
      setSelectAll(false)
      setTotalCollectionInput("")
      setBillInput("")
      setNotes("")
      toast({
        title: "Expense created",
        description: "The expense record has been successfully added.",
      })
    },
    onError: (error: any) => {
      console.error("Create expense error:", error)
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create expense. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    },
  })

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
      toast({
        title: "Expense deleted",
        description: "The expense record has been successfully removed.",
      })
    },
    onError: (error: any) => {
      console.error("Delete expense error:", error)
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete expense. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    },
  })

  const users = (usersQuery.data && Array.isArray(usersQuery.data)) ? usersQuery.data : []
  const expensesList = (expensesQuery.data && Array.isArray(expensesQuery.data)) ? expensesQuery.data : []

  const totalCollection = useMemo(() => {
    if (!Array.isArray(expensesList) || expensesList.length === 0) return 0
    return expensesList.reduce((sum, exp) => sum + (exp.totalCollection || 0), 0)
  }, [expensesList])
  
  const totalBills = useMemo(() => {
    if (!Array.isArray(expensesList) || expensesList.length === 0) return 0
    return expensesList.reduce((sum, exp) => sum + (exp.bill || 0), 0)
  }, [expensesList])
  
  const totalArrears = useMemo(() => {
    if (!Array.isArray(expensesList) || expensesList.length === 0) return 0
    return expensesList.reduce((sum, exp) => sum + (exp.arrears || 0), 0)
  }, [expensesList])

  const handleAddExpense = () => {
    if (selectedMembers.length === 0) {
      toast({
        title: "Selection required",
        description: "Please select at least one payer.",
        variant: "destructive",
      })
      return
    }

    const tc = Number(totalCollectionInput) || 0
    const bill = Number(billInput) || 0

    if (tc <= 0 || bill <= 0) {
      toast({
        title: "Invalid amounts",
        description: "Please enter valid amounts for collection and bill.",
        variant: "destructive",
      })
      return
    }

    const arrears = tc - bill
    const status: "completed" | "pending" | "deficit" = 
      arrears === 0 ? "completed" : (arrears > 0 ? "pending" : "deficit")

    const expenseNotes = notes || ""

    // Create expense for each selected user
    Promise.all(
      selectedMembers.map(userId =>
        createExpenseMutation.mutateAsync({
          userId,
          activityId: selectedActivity && selectedActivity !== "none" ? selectedActivity : undefined,
          totalCollection: tc,
          bill,
          arrears,
          status,
          notes: expenseNotes,
          date: new Date().toISOString().split('T')[0],
        })
      )
    ).then(() => {
      toast({
        title: "Expenses created",
        description: `Created expenses for ${selectedMembers.length} user(s).`,
      })
    }).catch(() => {
      // Error handling is done in mutation
    })
  }

  const handleDeleteExpense = (id: string) => {
    deleteExpenseMutation.mutate(id)
  }

  // Debug: Log expenses data and errors
  useEffect(() => {
    console.log("🔍 Expenses Page State:", {
      expensesLoading: expensesQuery.isLoading,
      expensesError: expensesQuery.isError,
      expensesData: expensesQuery.data,
      usersLoading: usersQuery.isLoading,
      usersError: usersQuery.isError,
      activitiesLoading: activitiesQuery.isLoading,
      activitiesError: activitiesQuery.isError,
    })
    
    if (expensesQuery.data) {
      console.log("✅ Expenses data loaded:", expensesQuery.data)
      console.log("✅ Expenses data type:", typeof expensesQuery.data)
      console.log("✅ Is array:", Array.isArray(expensesQuery.data))
      if (Array.isArray(expensesQuery.data) && expensesQuery.data.length > 0) {
        console.log("✅ First expense:", expensesQuery.data[0])
      }
    }
    if (expensesQuery.isError) {
      console.error("❌ Expenses query error:", expensesQuery.error)
      console.error("❌ Error details:", {
        message: (expensesQuery.error as any)?.message,
        response: (expensesQuery.error as any)?.response?.data,
        status: (expensesQuery.error as any)?.response?.status,
      })
    }
    if (usersQuery.isError) {
      console.error("❌ Users query error:", usersQuery.error)
    }
    if (activitiesQuery.isError) {
      console.error("❌ Activities query error:", activitiesQuery.error)
    }
  }, [expensesQuery.data, expensesQuery.isLoading, expensesQuery.isError, expensesQuery.error, usersQuery.isLoading, usersQuery.isError, usersQuery.error, activitiesQuery.isLoading, activitiesQuery.isError, activitiesQuery.error])

  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: "csv" | "excel" | "word") => {
    setIsExporting(true)
    try {
      let blob: Blob
      let filename: string
      
      if (format === "csv") {
        blob = await exportApi.exportExpensesToCsv()
        filename = `expenses_export_${new Date().toISOString().split("T")[0]}.csv`
      } else if (format === "excel") {
        blob = await exportApi.exportExpensesToExcel()
        filename = `expenses_export_${new Date().toISOString().split("T")[0]}.xlsx`
      } else {
        // Word export - placeholder for future implementation
        blob = await exportApi.exportExpensesToWord()
        filename = `expenses_export_${new Date().toISOString().split("T")[0]}.docx`
      }
      
      exportApi.downloadBlob(blob, filename)
      toast({
        title: "Export successful",
        description: `Expenses exported to ${format.toUpperCase()}`,
      })
    } catch (error: any) {
      console.error("Export error:", error)
      toast({
        title: "Export failed",
        description: error?.response?.data?.message || "Failed to export expenses",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Always render something - don't block on errors
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Tracker</h1>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background">
              <DropdownMenuItem onClick={() => handleExport("csv")} disabled={isExporting}>
                <FileText className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")} disabled={isExporting}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("word")} disabled={isExporting}>
                <FileText className="mr-2 h-4 w-4" />
                Export as Word
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {(expensesQuery.isError || usersQuery.isError || activitiesQuery.isError) && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                expensesQuery.refetch()
                usersQuery.refetch()
                activitiesQuery.refetch()
              }}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 p-4 rounded-md bg-muted text-muted-foreground text-sm flex items-start justify-between gap-3">
        <span>Submit and review expense bills and reimbursements. <a href="https://example.com/why-expenses" className="underline underline-offset-2 text-primary hover:text-primary/80" target="_blank" rel="noopener noreferrer">Why review expenses?</a></span>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collection</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {expensesQuery.isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">PKR {totalCollection.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {expensesQuery.isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">PKR {totalBills.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {expensesQuery.isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className={`text-2xl font-bold ${totalArrears >= 0 ? 'text-jury-success' : 'text-destructive'}`}>
                PKR {totalArrears.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Expense Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Expense Record
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Link to existing activity */}
            <div className="space-y-2">
              <Label htmlFor="activity">Activity (Optional)</Label>
              <Select
                value={selectedActivity}
                onValueChange={setSelectedActivity}
                disabled={createExpenseMutation.isPending || activitiesQuery.isLoading}
              >
                <SelectTrigger id="activity">
                  <SelectValue placeholder="Select an activity (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {activitiesQuery.isLoading ? (
                    <>
                      <SelectItem value="loading" disabled>Loading activities...</SelectItem>
                      {[...Array(3)].map((_, i) => (
                        <SelectItem key={i} value={`skeleton-${i}`} disabled>
                          <Skeleton className="h-4 w-24" />
                        </SelectItem>
                      ))}
                    </>
                  ) : (
                    <>
                      <SelectItem value="none">None</SelectItem>
                      {activities.map((activity) => (
                        <SelectItem key={activity.id} value={activity.id}>
                          {activity.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Select payers like penalties: choose all or specific members */}
            <div className="space-y-2">
              <Label>Select Payers</Label>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                <div className="flex items-center space-x-2 mb-3 pb-2 border-b">
                  <input
                    type="checkbox"
                    id="payers-select-all"
                    checked={selectAll}
                    onChange={() => {
                      if (selectAll) { 
                        setSelectedMembers([]); 
                      } else { 
                        setSelectedMembers(users.map(u => u.id)); 
                      }
                      setSelectAll(!selectAll)
                    }}
                    className="rounded"
                    disabled={createExpenseMutation.isPending || usersQuery.isLoading}
                  />
                  <Label htmlFor="payers-select-all" className="font-medium">Select All Members</Label>
                </div>
                <div className="space-y-2">
                  {usersQuery.isLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      ))}
                    </div>
                  ) : users.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No users available</p>
                  ) : (
                    users.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`payer-${user.id}`}
                          checked={selectedMembers.includes(user.id)}
                          onChange={() => {
                            setSelectedMembers(prev => 
                              prev.includes(user.id) 
                                ? prev.filter(id => id !== user.id) 
                                : [...prev, user.id]
                            )
                          }}
                          className="rounded"
                          disabled={createExpenseMutation.isPending}
                        />
                        <Label htmlFor={`payer-${user.id}`}>{user.name}</Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              {selectedMembers.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedMembers.join(", ")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
              <Label htmlFor="total-collection">Total Collection</Label>
                <Input 
                  id="total-collection" 
                type="number" 
                placeholder="0" 
                min="0"
                value={totalCollectionInput}
                onChange={(e) => setTotalCollectionInput(e.target.value)}
                disabled={createExpenseMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bill">Bill Amount</Label>
                <Input 
                  id="bill" 
                  type="number" 
                  placeholder="0" 
                  min="0"
                  value={billInput}
                  onChange={(e) => setBillInput(e.target.value)}
                  disabled={createExpenseMutation.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Additional notes about the expense..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={createExpenseMutation.isPending}
              />
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleAddExpense} 
              disabled={createExpenseMutation.isPending || selectedMembers.length === 0}
            >
              {createExpenseMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense Record
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Expense Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expensesQuery.isLoading || usersQuery.isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : expensesList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No expenses recorded
                </div>
              ) : (
                expensesList.slice(0, 5).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{expense.user?.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{expense.notes}</p>
                    <div className="flex gap-2 text-xs">
                      <span>Collection: PKR {expense.totalCollection}</span>
                      <span>•</span>
                      <span>Bill: PKR {expense.bill}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        expense.status === 'completed' ? 'default' :
                        expense.status === 'pending' ? 'secondary' :
                        'destructive'
                      }
                    >
                      {expense.status}
                    </Badge>
                    <p className={`text-sm font-medium ${
                      expense.arrears >= 0 ? 'text-jury-success' : 'text-destructive'
                    }`}>
                      {expense.arrears >= 0 ? '+' : ''}PKR {expense.arrears}
                    </p>
                  </div>
                </div>
              ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Expenses Table - Latest First */}
      <Card>
        <CardHeader>
          <CardTitle>All Expense Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee Name</TableHead>
                <TableHead>Total Collection</TableHead>
                <TableHead>Bill Amount</TableHead>
                <TableHead>Arrears/Surplus</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                {isJury && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {expensesQuery.isLoading || usersQuery.isLoading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      {isJury && <TableCell><Skeleton className="h-8 w-8" /></TableCell>}
                    </TableRow>
                  ))}
                </>
              ) : expensesQuery.isError ? (
                <TableRow>
                  <TableCell colSpan={isJury ? 7 : 6} className="text-center py-8">
                    <AlertTriangle className="h-6 w-6 mx-auto text-destructive mb-2" />
                    <p className="text-sm text-muted-foreground">Failed to load expenses</p>
                  </TableCell>
                </TableRow>
              ) : expensesList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isJury ? 7 : 6} className="text-center py-8 text-muted-foreground">
                    No expenses recorded
                  </TableCell>
                </TableRow>
              ) : (
                expensesList.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.user?.name || "N/A"}</TableCell>
                    <TableCell>PKR {expense.totalCollection.toLocaleString()}</TableCell>
                    <TableCell>PKR {expense.bill.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={expense.arrears >= 0 ? 'text-jury-success' : 'text-destructive'}>
                        {expense.arrears >= 0 ? '+' : ''}PKR {expense.arrears.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          expense.status === 'completed' ? 'default' :
                          expense.status === 'pending' ? 'secondary' :
                          'destructive'
                        }
                      >
                        {expense.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-48 truncate">{expense.notes || "—"}</TableCell>
                    {isJury && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteExpense(expense.id)}
                            disabled={deleteExpenseMutation.isPending}
                          >
                            {deleteExpenseMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}