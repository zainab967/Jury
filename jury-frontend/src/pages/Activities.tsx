import { useState, useEffect } from "react"
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
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Plus, Calendar as CalendarLucide, Trash2, Loader2, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { activitiesApi } from "@/api"
import type { Activity, CreateActivityPayload } from "@/api"

export default function Activities() {
  const [date, setDate] = useState<Date>()
  const [activityName, setActivityName] = useState("")
  const [activityDescription, setActivityDescription] = useState("")
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const activitiesQuery = useQuery<Activity[]>({
    queryKey: ["activities"],
    queryFn: () => activitiesApi.getAll(1, 100),
  })

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

  const createActivityMutation = useMutation({
    mutationFn: (payload: CreateActivityPayload) => activitiesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] })
      setActivityName("")
      setActivityDescription("")
      setDate(undefined)
      toast({
        title: "Activity created",
        description: "The activity has been successfully added.",
      })
    },
    onError: (error: any) => {
      console.error("Create activity error:", error)
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to create activity. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    },
  })

  const deleteActivityMutation = useMutation({
    mutationFn: (id: string) => activitiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] })
      toast({
        title: "Activity deleted",
        description: "The activity has been successfully removed.",
      })
    },
    onError: (error: any) => {
      console.error("Delete activity error:", error)
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete activity. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    },
  })

  const handleAddActivity = () => {
    if (!activityName.trim()) {
      toast({
        title: "Activity name required",
        description: "Please enter an activity name.",
        variant: "destructive",
      })
      return
    }

    if (!date) {
      toast({
        title: "Date required",
        description: "Please select a date for the activity.",
        variant: "destructive",
      })
      return
    }

    createActivityMutation.mutate({
      name: activityName.trim(),
      description: activityDescription.trim() || undefined,
      date: format(date, "yyyy-MM-dd"), // Date is now required
    })
  }

  const handleDelete = (id: string) => {
    deleteActivityMutation.mutate(id)
  }

  const activityList = activitiesQuery.data ?? []
  return (
    <div className="space-y-6">
      <div className="mb-6 p-4 rounded-md bg-muted text-muted-foreground text-sm flex items-start justify-between gap-3">
        <span>Plan, view, and edit your team's scheduled activities. <a href="https://example.com/why-activities" className="underline underline-offset-2 text-primary hover:text-primary/80" target="_blank" rel="noopener noreferrer">Why manage activities?</a></span>
      </div>
		<div className="flex items-center justify-between">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">Activity Management</h1>
			</div>
		</div>

      {/* Activities moved below cards */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Activity Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="activity-name">Activity Name</Label>
              <Input 
                id="activity-name" 
                placeholder="Enter activity name"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                disabled={createActivityMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity-description">Description</Label>
              <Textarea 
                id="activity-description" 
                placeholder="Describe the activity..." 
                rows={3}
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                disabled={createActivityMutation.isPending}
              />
            </div>
            
			<div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
			</div>
            
            <Button 
              className="w-full" 
              onClick={handleAddActivity}
              disabled={createActivityMutation.isPending || !activityName.trim() || !date}
            >
              {createActivityMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Activity
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Activity Calendar Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarLucide className="h-5 w-5" />
              Activity Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border p-3 pointer-events-auto"
            />
			{/* Legend removed as requested */}
          </CardContent>
        </Card>
      </div>

		{/* Activities List - Latest First */}
		<Card>
			<CardHeader>
				<CardTitle>Scheduled Activities</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Activity Name</TableHead>
							<TableHead>Employee</TableHead>
							<TableHead>Description</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{activitiesQuery.isLoading ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-8">
									<Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
								</TableCell>
							</TableRow>
						) : activitiesQuery.isError ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-8">
									<AlertTriangle className="h-6 w-6 mx-auto text-destructive mb-2" />
									<p className="text-sm text-muted-foreground">Failed to load activities</p>
								</TableCell>
							</TableRow>
						) : activityList.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
									No activities scheduled
								</TableCell>
							</TableRow>
						) : (
							activityList.map((activity) => (
								<TableRow key={activity.id}>
									<TableCell className="font-medium">{activity.name}</TableCell>
									<TableCell>{activity.employeeName || "N/A"}</TableCell>
									<TableCell>{activity.description || "—"}</TableCell>
									<TableCell>{activity.date}</TableCell>
									<TableCell>
										<Button 
											size="icon" 
											variant="destructive" 
											aria-label="Delete activity" 
											onClick={() => handleDelete(activity.id)}
											disabled={deleteActivityMutation.isPending}
										>
											{deleteActivityMutation.isPending ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<Trash2 className="h-4 w-4" />
											)}
										</Button>
									</TableCell>
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