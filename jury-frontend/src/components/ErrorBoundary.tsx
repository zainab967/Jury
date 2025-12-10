import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * ErrorBoundary component that catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the whole app.
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: ReturnType<typeof setTimeout> | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details to console for debugging
    console.error("ErrorBoundary caught an error:", error)
    console.error("Error Info:", errorInfo)
    console.error("Component Stack:", errorInfo.componentStack)

    // Store error info in state
    this.setState({
      error,
      errorInfo,
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // TODO: In production, send error to monitoring service (e.g., Sentry, LogRocket)
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     contexts: {
    //       react: {
    //         componentStack: errorInfo.componentStack,
    //       },
    //     },
    //   })
    // }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    // Reset error boundary when resetKeys change
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      )

      if (hasResetKeyChanged) {
        this.resetErrorBoundary()
      }
    }

    // Reset error boundary when any prop changes (if enabled)
    if (hasError && resetOnPropsChange) {
      const hasPropsChanged = Object.keys(this.props).some(
        (key) => key !== "children" && this.props[key as keyof Props] !== prevProps[key as keyof Props]
      )

      if (hasPropsChanged) {
        this.resetErrorBoundary()
      }
    }
  }

  componentWillUnmount() {
    // Clear any pending reset timeout
    if (this.resetTimeoutId !== null) {
      window.clearTimeout(this.resetTimeoutId)
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId !== null) {
      window.clearTimeout(this.resetTimeoutId)
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleRetry = () => {
    this.resetErrorBoundary()
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = "/"
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-destructive/10 p-2">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle>Something went wrong</CardTitle>
                  <CardDescription>
                    An unexpected error occurred. Don't worry, your data is safe.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {this.state.error?.message || "An unexpected error occurred"}
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
                <Button onClick={this.handleReload} variant="outline" className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>
              </div>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4 p-4 bg-muted rounded-lg">
                  <summary className="cursor-pointer text-sm font-medium mb-2">
                    Error Details (Development Only)
                  </summary>
                  <pre className="text-xs overflow-auto max-h-64 p-2 bg-background rounded border">
                    <div className="font-semibold mb-2">Error Message:</div>
                    <div className="mb-4">{this.state.error.message}</div>
                    {this.state.error.stack && (
                      <>
                        <div className="font-semibold mb-2">Stack Trace:</div>
                        <div className="mb-4 whitespace-pre-wrap">{this.state.error.stack}</div>
                      </>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <>
                        <div className="font-semibold mb-2">Component Stack:</div>
                        <div className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</div>
                      </>
                    )}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook to manually trigger an error boundary (useful for testing)
 * WARNING: Only use this for testing error boundaries!
 */
export const useErrorHandler = () => {
  return (error: Error) => {
    throw error
  }
}

