import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Bug } from "lucide-react"
import { ErrorBoundary } from "./ErrorBoundary"

/**
 * Component that intentionally throws an error for testing error boundaries.
 * This component should be wrapped in an ErrorBoundary to prevent app crashes.
 */
function ErrorThrower() {
  const [shouldThrow, setShouldThrow] = useState(false)

  if (shouldThrow) {
    // This will be caught by the ErrorBoundary
    throw new Error("Test error: This is a simulated error to test the error boundary!")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-destructive" />
          Error Boundary Test
        </CardTitle>
        <CardDescription>
          Click the button below to trigger an error and test the error boundary.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            This component is for testing purposes only. Clicking the button will cause
            this component to throw an error, which should be caught by the ErrorBoundary.
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => setShouldThrow(true)}
          variant="destructive"
          className="w-full"
        >
          Trigger Error
        </Button>
      </CardContent>
    </Card>
  )
}

/**
 * Test component wrapped in ErrorBoundary to demonstrate error boundary functionality.
 * This can be added to any page temporarily to test error boundaries.
 */
export function ErrorBoundaryTest() {
  return (
    <ErrorBoundary>
      <ErrorThrower />
    </ErrorBoundary>
  )
}

/**
 * Component that throws an error during render (for testing)
 */
export function AlwaysThrowsError() {
  throw new Error("This component always throws an error!")
}

/**
 * Component that throws an error after a delay (simulates async error)
 * Note: Error boundaries don't catch async errors, but this can be used
 * to test error handling in event handlers.
 */
export function DelayedError() {
  const [error, setError] = useState<Error | null>(null)

  const triggerError = () => {
    setTimeout(() => {
      try {
        throw new Error("Delayed error - this won't be caught by ErrorBoundary!")
      } catch (err) {
        // Error boundaries don't catch errors in event handlers
        // This needs to be handled with try/catch
        setError(err as Error)
      }
    }, 1000)
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error in Event Handler</AlertTitle>
        <AlertDescription>
          {error.message}
          <br />
          <small className="text-xs mt-2 block">
            Note: This error was caught with try/catch, not ErrorBoundary.
            Error boundaries only catch errors during rendering and lifecycle methods.
          </small>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delayed Error Test</CardTitle>
        <CardDescription>
          This demonstrates that async errors need try/catch, not ErrorBoundary.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={triggerError} variant="outline">
          Trigger Delayed Error
        </Button>
      </CardContent>
    </Card>
  )
}

