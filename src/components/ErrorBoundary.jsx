import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;
      const { fallback } = this.props;

      // If a custom fallback is provided, use it
      if (fallback) {
        return typeof fallback === 'function'
          ? fallback(error, this.handleReset)
          : fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6" dir="rtl">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">אופס! משהו השתבש</h1>
                  <p className="text-red-100 mt-1">
                    התרחשה שגיאה בלתי צפויה ביישום
                  </p>
                </div>
              </div>
            </div>

            {/* Error Details */}
            <div className="p-8 space-y-6">
              <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded">
                <h3 className="font-semibold text-red-800 mb-2">פרטי השגיאה:</h3>
                <p className="text-red-700 text-sm font-mono">
                  {error && error.toString()}
                </p>
              </div>

              {/* Show stack trace in development mode */}
              {process.env.NODE_ENV === 'development' && errorInfo && (
                <details className="bg-gray-50 p-4 rounded border border-gray-200">
                  <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                    מידע טכני מפורט (למפתחים)
                  </summary>
                  <pre className="text-xs overflow-auto max-h-64 text-gray-600 font-mono mt-2">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Error count warning */}
              {errorCount > 1 && (
                <div className="bg-yellow-50 border-r-4 border-yellow-500 p-4 rounded">
                  <p className="text-yellow-800 text-sm">
                    <strong>שים לב:</strong> שגיאה זו התרחשה {errorCount} פעמים.
                    {errorCount > 3 && " אנא פנה לתמיכה טכנית."}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={this.handleReset}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  נסה שוב
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  רענן את הדף
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 ml-2" />
                  חזור לדף הבית
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-gray-600 text-sm">
                  אם הבעיה נמשכת, אנא צור קשר עם התמיכה הטכנית
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  קוד שגיאה: {error && error.name} | זמן: {new Date().toLocaleString('he-IL')}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
