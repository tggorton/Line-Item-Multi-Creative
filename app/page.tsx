"use client"

import { ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import { theme } from "@/lib/theme"
import KervDashboard from "@/components/kerv-dashboard"

export default function Home() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <KervDashboard />
    </ThemeProvider>
  )
}

