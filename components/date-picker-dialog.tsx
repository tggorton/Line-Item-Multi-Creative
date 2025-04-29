"use client"

import { useState, useEffect } from "react"
import Popover from "@mui/material/Popover"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"

interface DatePickerDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (date: Date) => void
  initialDate?: Date | null
  minDate?: Date | null
  title?: string
  anchorEl: HTMLElement | null // Add anchorEl prop for positioning
}

export function DatePickerDialog({
  open,
  onClose,
  onSelect,
  initialDate = null,
  minDate = null,
  title = "Select Date",
  anchorEl, // Add anchorEl parameter
}: DatePickerDialogProps) {
  // Initialize with today's date if no initialDate is provided
  const today = new Date()

  const [currentDate, setCurrentDate] = useState<Date>(initialDate ? new Date(initialDate) : new Date(today))
  const [viewDate, setViewDate] = useState<Date>(initialDate ? new Date(initialDate) : new Date(today))

  // Reset dates when dialog opens
  useEffect(() => {
    if (open) {
      const initDate = initialDate ? new Date(initialDate) : new Date(today)
      setCurrentDate(initDate)
      setViewDate(initDate)
    }
  }, [open, initialDate])

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get day of week for first day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const handlePrevMonth = () => {
    setViewDate((prevDate) => {
      const newDate = new Date(prevDate)
      newDate.setMonth(prevDate.getMonth() - 1)
      return newDate
    })
  }

  const handleNextMonth = () => {
    setViewDate((prevDate) => {
      const newDate = new Date(prevDate)
      newDate.setMonth(prevDate.getMonth() + 1)
      return newDate
    })
  }

  const handleDateClick = (day: number) => {
    // Create a new date with the selected day
    const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)

    // Important: Add one day to compensate for timezone issues
    selectedDate.setDate(selectedDate.getDate() + 1)

    setCurrentDate(selectedDate)
    onSelect(selectedDate)
  }

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDayOfMonth = getFirstDayOfMonth(year, month)

    // Create blank spaces for days before the first day of month
    const blanks = Array(firstDayOfMonth).fill(null)

    // Create days of the month
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    return [...blanks, ...days]
  }

  const isDateDisabled = (day: number | null) => {
    if (day === null) return true
    if (!minDate) return false

    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
    const min = new Date(minDate)

    return date < min
  }

  const isCurrentDay = (day: number | null) => {
    if (day === null) return false
    if (!currentDate) return false

    return (
      day === currentDate.getDate() &&
      viewDate.getMonth() === currentDate.getMonth() &&
      viewDate.getFullYear() === currentDate.getFullYear()
    )
  }

  const isTodayDate = (day: number | null) => {
    if (day === null) return false

    const now = new Date()
    return (
      day === now.getDate() && viewDate.getMonth() === now.getMonth() && viewDate.getFullYear() === now.getFullYear()
    )
  }

  const calendarDays = generateCalendarDays()

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left",
      }}
      PaperProps={{
        sx: {
          bgcolor: "#333333",
          color: "white",
          width: "320px",
          maxWidth: "90vw",
          mt: 1, // Add margin top for spacing from the anchor
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Month and year navigation */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              mb: 2,
            }}
          >
            <IconButton onClick={handlePrevMonth} sx={{ color: "white" }}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h6">
              {viewDate.toLocaleString("default", { month: "long", year: "numeric" })}
            </Typography>
            <IconButton onClick={handleNextMonth} sx={{ color: "white" }}>
              <ChevronRightIcon />
            </IconButton>
          </Box>

          {/* Days of week header */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              width: "100%",
              mb: 1,
            }}
          >
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <Typography key={i} variant="caption" sx={{ textAlign: "center", color: "#cdcdcd" }}>
                {day}
              </Typography>
            ))}
          </Box>

          {/* Calendar grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 1,
              width: "100%",
            }}
          >
            {calendarDays.map((day, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {day !== null ? (
                  <Button
                    disabled={isDateDisabled(day)}
                    onClick={() => handleDateClick(day)}
                    sx={{
                      minWidth: 0,
                      width: 30,
                      height: 30,
                      p: 0,
                      borderRadius: "50%",
                      color: "white",
                      backgroundColor: isCurrentDay(day)
                        ? "#ef0078"
                        : isTodayDate(day)
                          ? "rgba(239, 0, 120, 0.2)"
                          : "transparent",
                      "&:hover": {
                        backgroundColor: isCurrentDay(day) ? "#d82388" : "rgba(255, 255, 255, 0.1)",
                      },
                      "&.Mui-disabled": {
                        color: "rgba(255, 255, 255, 0.3)",
                      },
                    }}
                  >
                    {day}
                  </Button>
                ) : (
                  <Box sx={{ width: 30, height: 30 }} />
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Footer buttons */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, gap: 1 }}>
          <Button
            onClick={onClose}
            sx={{
              color: "#ef0078",
              "&:hover": {
                backgroundColor: "rgba(239, 0, 120, 0.1)",
              },
            }}
          >
            CANCEL
          </Button>
          <Button
            onClick={() => {
              if (currentDate) {
                // Create a new date to avoid reference issues
                const selectedDate = new Date(currentDate)

                // Important: Add one day to compensate for timezone issues
                selectedDate.setDate(selectedDate.getDate() + 1)

                onSelect(selectedDate)
              }
            }}
            sx={{
              color: "white",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            SELECT
          </Button>
        </Box>
      </Box>
    </Popover>
  )
}

