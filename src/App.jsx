import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "sonner"
import ErrorBoundary from "@/components/ErrorBoundary"

function App() {
  return (
    <ErrorBoundary>
      <Pages />
      <Toaster />
      <Sonner position="top-center" richColors dir="rtl" />
    </ErrorBoundary>
  )
}

export default App 