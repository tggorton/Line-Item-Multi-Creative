"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import DialogActions from "@mui/material/DialogActions"
import Button from "@mui/material/Button"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Switch from "@mui/material/Switch"
import IconButton from "@mui/material/IconButton"
import AddIcon from "@mui/icons-material/Add"
import RemoveIcon from "@mui/icons-material/Remove"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import ClickAwayListener from "@mui/material/ClickAwayListener"
import Paper from "@mui/material/Paper"
import Popper from "@mui/material/Popper"
import MenuList from "@mui/material/MenuList"
import MenuItem from "@mui/material/MenuItem"
import Tooltip from "@mui/material/Tooltip"

// Time slot interface
interface TimeSlot {
  from: string
  to: string
}

// Day schedule interface
interface DaySchedule {
  enabled: boolean
  timeSlots: TimeSlot[]
}

// Dayparting schedule interface
export interface DaypartingSchedule {
  timezone: string
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

// Props interface
interface DaypartingDialogProps {
  open: boolean
  onClose: () => void
  onSave: (schedule: DaypartingSchedule) => void
  initialSchedule?: DaypartingSchedule
  existingSchedules?: DaypartingSchedule[]
  currentCreativeId?: number
  defaultTimezone?: string
}

// Default time slot
const defaultTimeSlot: TimeSlot = { from: "12:00 AM", to: "11:59 PM" }

// Evening time slot (for automatic conflict resolution)
const eveningTimeSlot: TimeSlot = { from: "6:00 PM", to: "11:00 PM" }

// Default day schedule
const defaultDaySchedule: DaySchedule = {
  enabled: false,
  timeSlots: [{ ...defaultTimeSlot }],
}

// Create default schedule with specified timezone
const createDefaultSchedule = (timezone = "CST"): DaypartingSchedule => ({
  timezone,
  monday: { ...defaultDaySchedule },
  tuesday: { ...defaultDaySchedule },
  wednesday: { ...defaultDaySchedule },
  thursday: { ...defaultDaySchedule },
  friday: { ...defaultDaySchedule },
  saturday: { ...defaultDaySchedule },
  sunday: { ...defaultDaySchedule },
})

// Time options for select
const timeOptions = [
  "12:00 AM",
  "12:01 AM",
  "12:30 AM",
  "1:00 AM",
  "1:30 AM",
  "2:00 AM",
  "2:30 AM",
  "3:00 AM",
  "3:30 AM",
  "4:00 AM",
  "4:30 AM",
  "5:00 AM",
  "5:30 AM",
  "6:00 AM",
  "6:30 AM",
  "7:00 AM",
  "7:30 AM",
  "8:00 AM",
  "8:01 AM",
  "8:30 AM",
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:01 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
  "5:01 PM",
  "5:30 PM",
  "6:00 PM",
  "6:30 PM",
  "7:00 PM",
  "7:30 PM",
  "8:00 PM",
  "8:01 PM",
  "8:30 PM",
  "9:00 PM",
  "9:01 PM",
  "9:30 PM",
  "10:00 PM",
  "10:30 PM",
  "11:00 PM",
  "11:30 PM",
  "11:59 PM",
]

// Timezone options
const timezoneOptions = ["EST", "CST", "MST", "PST"]

// Helper function to check if a time is before another
const isTimeBefore = (time1: string, time2: string): boolean => {
  const [hour1, minute1, period1] = time1.match(/(\d+):(\d+) ([AP]M)/)?.slice(1) || []
  const [hour2, minute2, period2] = time2.match(/(\d+):(\d+) ([AP]M)/)?.slice(1) || []

  if (!hour1 || !hour2) return false

  let h1 = Number.parseInt(hour1)
  let h2 = Number.parseInt(hour2)

  // Convert to 24-hour format
  if (period1 === "PM" && h1 < 12) h1 += 12
  if (period1 === "AM" && h1 === 12) h1 = 0
  if (period2 === "PM" && h2 < 12) h2 += 12
  if (period2 === "AM" && h2 === 12) h2 = 0

  if (h1 < h2) return true
  if (h1 > h2) return false

  // Hours are equal, check minutes
  return Number.parseInt(minute1) < Number.parseInt(minute2)
}

// Helper function to check if time slots overlap
const doTimeSlotsOverlap = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
  // Convert times to minutes for precise comparison
  const slot1FromMinutes = convertTimeToMinutes(slot1.from)
  const slot1ToMinutes = convertTimeToMinutes(slot1.to)
  const slot2FromMinutes = convertTimeToMinutes(slot2.from)
  const slot2ToMinutes = convertTimeToMinutes(slot2.to)

  // Check if slots overlap
  // For exact boundaries (e.g., 5:00 PM and 5:01 PM), we don't consider it an overlap
  return (
    slot1FromMinutes < slot2ToMinutes &&
    slot2FromMinutes < slot1ToMinutes &&
    !(slot1ToMinutes === slot2FromMinutes || slot2ToMinutes === slot1FromMinutes)
  )
}

// Helper function to check if a time slot is valid (from is before to)
const isTimeSlotValid = (slot: TimeSlot): boolean => {
  return isTimeBefore(slot.from, slot.to)
}

// Add a new function to check for overlaps within the same day's time slots
const hasInternalConflict = (
  day: keyof DaypartingSchedule,
  timeSlot: TimeSlot,
  slotIndex: number,
  schedule: DaypartingSchedule,
): boolean => {
  const daySchedule = schedule[day] as DaySchedule

  return daySchedule.timeSlots.some((existingSlot, index) => {
    // Skip comparing with itself
    if (index === slotIndex) return false

    return doTimeSlotsOverlap(timeSlot, existingSlot)
  })
}

// Update the hasConflict function to only consider actual time slot overlaps
const hasConflict = (
  day: string,
  timeSlot: TimeSlot,
  existingSchedules: DaypartingSchedule[],
  currentCreativeId?: number,
): boolean => {
  if (!existingSchedules || existingSchedules.length === 0) return false

  return existingSchedules.some((schedule, index) => {
    // Skip checking against the current creative's schedule
    if (index === currentCreativeId) return false

    const daySchedule = schedule[day as keyof DaypartingSchedule] as DaySchedule
    if (!daySchedule?.enabled) return false

    // Check if any time slot overlaps
    return daySchedule.timeSlots.some((existingSlot) => doTimeSlotsOverlap(timeSlot, existingSlot))
  })
}

// Get all time slots for a specific day across all schedules
const getAllTimeSlotsForDay = (
  day: keyof DaypartingSchedule,
  existingSchedules: DaypartingSchedule[],
  currentCreativeId?: number,
): TimeSlot[] => {
  const allTimeSlots: TimeSlot[] = []

  existingSchedules.forEach((schedule, index) => {
    // Skip the current creative's schedule
    if (index === currentCreativeId) return

    const daySchedule = schedule[day] as DaySchedule
    if (daySchedule?.enabled) {
      allTimeSlots.push(...daySchedule.timeSlots)
    }
  })

  return allTimeSlots
}

// Add a helper function to convert time string to minutes
const convertTimeToMinutes = (timeStr: string): number => {
  const [hour, minute, period] = timeStr.match(/(\d+):(\d+) ([AP]M)/)?.slice(1) || []

  if (!hour || !minute || !period) return 0

  let h = Number.parseInt(hour)
  const m = Number.parseInt(minute)

  // Convert to 24-hour format
  if (period === "PM" && h < 12) h += 12
  if (period === "AM" && h === 12) h = 0

  return h * 60 + m
}

// Add a function to get the next minute time slot
const getNextMinuteTimeSlot = (endTime: string): string => {
  const endMinutes = convertTimeToMinutes(endTime)
  const nextMinutes = endMinutes + 1

  // Convert back to time string
  const nextHour = Math.floor(nextMinutes / 60) % 24
  const nextMinute = nextMinutes % 60

  let period = "AM"
  let displayHour = nextHour

  if (nextHour >= 12) {
    period = "PM"
    if (nextHour > 12) {
      displayHour = nextHour - 12
    }
  }

  if (displayHour === 0) {
    displayHour = 12
  }

  return `${displayHour}:${nextMinute.toString().padStart(2, "0")} ${period}`
}

// Find a non-overlapping time slot for a specific day
const findNonOverlappingTimeSlot = (
  day: keyof DaypartingSchedule,
  existingSchedules: DaypartingSchedule[],
  currentCreativeId?: number,
): TimeSlot => {
  // Get all existing time slots for this day
  const existingTimeSlots = getAllTimeSlotsForDay(day, existingSchedules, currentCreativeId)

  // If no existing time slots, return default time slot (24 hours)
  if (existingTimeSlots.length === 0) {
    return { ...defaultTimeSlot }
  }

  // Sort existing slots by start time
  const sortedSlots = [...existingTimeSlots].sort((a, b) => convertTimeToMinutes(a.from) - convertTimeToMinutes(b.from))

  // Find gaps between existing slots
  for (let i = 0; i < sortedSlots.length; i++) {
    const currentSlot = sortedSlots[i]
    const nextSlot = sortedSlots[i + 1]

    // If this is the first slot, check if there's a gap before it
    if (i === 0 && convertTimeToMinutes(currentSlot.from) > convertTimeToMinutes("12:00 AM")) {
      return {
        from: "12:00 AM",
        to: getNextMinuteTimeSlot(timeOptions[timeOptions.indexOf(currentSlot.from) - 1] || "11:59 PM"),
      }
    }

    // If this is the last slot, check if there's a gap after it
    if (!nextSlot && convertTimeToMinutes(currentSlot.to) < convertTimeToMinutes("11:59 PM")) {
      return {
        from: getNextMinuteTimeSlot(currentSlot.to),
        to: "11:59 PM",
      }
    }

    // Check for gap between current and next slot
    if (nextSlot && convertTimeToMinutes(currentSlot.to) < convertTimeToMinutes(nextSlot.from) - 1) {
      return {
        from: getNextMinuteTimeSlot(currentSlot.to),
        to: timeOptions[timeOptions.indexOf(nextSlot.from) - 1] || "11:59 PM",
      }
    }
  }

  // If we couldn't find a gap, try evening time slot (6 PM - 11:59 PM)
  const eveningSlot = { from: "6:00 PM", to: "11:59 PM" }
  const hasEveningConflict = existingTimeSlots.some((slot) => doTimeSlotsOverlap(eveningSlot, slot))

  if (!hasEveningConflict) {
    return eveningSlot
  }

  // If evening slot has conflict, try morning time slot (12:00 AM - 8:00 AM)
  const morningSlot = { from: "12:00 AM", to: "8:00 AM" }
  const hasMorningConflict = existingTimeSlots.some((slot) => doTimeSlotsOverlap(morningSlot, slot))

  if (!hasMorningConflict) {
    return morningSlot
  }

  // If we still couldn't find a non-overlapping slot, return a late night slot
  return { from: "11:30 PM", to: "11:59 PM" }
}

// Custom dropdown component
function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Select",
  error = false,
}: {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: boolean
}) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen)
  }

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return
    }
    setOpen(false)
  }

  const handleMenuItemClick = (option: string) => {
    onChange(option)
    setOpen(false)
  }

  return (
    <div>
      <Box
        ref={anchorRef}
        onClick={handleToggle}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          border: `1px solid ${error ? "#f44336" : "rgba(255, 255, 255, 0.3)"}`,
          borderRadius: "4px",
          padding: "8px 14px",
          cursor: "pointer",
          minHeight: "38px",
          "&:hover": {
            borderColor: error ? "#f44336" : "rgba(255, 255, 255, 0.5)",
          },
        }}
      >
        <Typography
          sx={{
            color: value ? "white" : "rgba(255, 255, 255, 0.5)",
            fontSize: "0.875rem",
          }}
        >
          {value || placeholder}
        </Typography>
        <ExpandMoreIcon sx={{ color: "white", fontSize: "1.25rem" }} />
      </Box>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        placement="bottom-start"
        style={{ zIndex: 1300, width: anchorRef.current?.clientWidth }}
      >
        <Paper sx={{ bgcolor: "#333333", maxHeight: "300px", overflow: "auto" }}>
          <ClickAwayListener onClickAway={handleClose}>
            <MenuList autoFocusItem>
              {options.map((option) => (
                <MenuItem
                  key={option}
                  selected={option === value}
                  onClick={() => handleMenuItemClick(option)}
                  sx={{
                    color: "white",
                    "&:hover": {
                      bgcolor: "rgba(239, 0, 120, 0.1)",
                    },
                    "&.Mui-selected": {
                      bgcolor: "rgba(239, 0, 120, 0.2)",
                      "&:hover": {
                        bgcolor: "rgba(239, 0, 120, 0.3)",
                      },
                    },
                  }}
                >
                  {option}
                </MenuItem>
              ))}
            </MenuList>
          </ClickAwayListener>
        </Paper>
      </Popper>
    </div>
  )
}

export function DaypartingDialog({
  open,
  onClose,
  onSave,
  initialSchedule,
  existingSchedules = [],
  currentCreativeId,
  defaultTimezone = "CST",
}: DaypartingDialogProps) {
  const [schedule, setSchedule] = useState<DaypartingSchedule>(
    initialSchedule ? { ...initialSchedule } : createDefaultSchedule(defaultTimezone),
  )

  // Reset schedule when dialog opens with initialSchedule
  useEffect(() => {
    if (open) {
      if (initialSchedule) {
        setSchedule({ ...initialSchedule })
      } else {
        setSchedule(createDefaultSchedule(defaultTimezone))
      }
    }
  }, [open, initialSchedule, defaultTimezone])

  // Handle timezone change
  const handleTimezoneChange = (value: string) => {
    setSchedule((prev) => ({ ...prev, timezone: value }))
  }

  // Handle day toggle
  const handleDayToggle = (day: keyof DaypartingSchedule) => {
    setSchedule((prev) => {
      // If enabling the day, check for conflicts and set appropriate time slot
      if (!(prev[day] as DaySchedule).enabled) {
        // Get all existing time slots for this day from other creatives
        const existingTimeSlots = getAllTimeSlotsForDay(day, existingSchedules, currentCreativeId)

        // If no existing time slots, use default 24-hour time slot
        if (existingTimeSlots.length === 0) {
          return {
            ...prev,
            [day]: {
              enabled: true,
              timeSlots: [{ ...defaultTimeSlot }],
            },
          }
        }

        // Find a non-overlapping time slot
        const nonOverlappingSlot = findNonOverlappingTimeSlot(day, existingSchedules, currentCreativeId)

        return {
          ...prev,
          [day]: {
            enabled: true,
            timeSlots: [nonOverlappingSlot],
          },
        }
      } else {
        // If disabling, just toggle the enabled state
        return {
          ...prev,
          [day]: {
            ...prev[day],
            enabled: false,
          },
        }
      }
    })
  }

  // Handle time slot change
  const handleTimeSlotChange = (
    day: keyof DaypartingSchedule,
    slotIndex: number,
    field: keyof TimeSlot,
    value: string,
  ) => {
    setSchedule((prev) => {
      const daySchedule = { ...prev[day] } as DaySchedule
      const newTimeSlots = [...daySchedule.timeSlots]
      const currentSlot = { ...newTimeSlots[slotIndex] }

      // Create the updated time slot
      const updatedSlot = {
        ...currentSlot,
        [field]: value,
      }

      // Check if the updated slot is valid (from is before to)
      if (!isTimeSlotValid(updatedSlot)) {
        return prev // Return unchanged if invalid
      }

      // Check for conflicts within the same day's time slots
      const internalConflict = hasInternalConflict(day, updatedSlot, slotIndex, prev)

      // Check for conflicts with other creatives
      const externalConflict = hasConflict(day, updatedSlot, existingSchedules, currentCreativeId)

      // If there's no conflict, use the updated slot
      if (!externalConflict && !internalConflict) {
        newTimeSlots[slotIndex] = updatedSlot
        return {
          ...prev,
          [day]: {
            ...daySchedule,
            timeSlots: newTimeSlots,
          },
        }
      }

      // If there's a conflict, try to find a non-conflicting time slot
      // Get all existing time slots for this day
      const existingTimeSlots = getAllTimeSlotsForDay(day, existingSchedules, currentCreativeId)

      let earlierSlots: TimeSlot[] = []
      // If changing the start time
      if (field === "from") {
        // Find all slots that end before our desired start time
        earlierSlots = existingTimeSlots
          .filter((slot) => convertTimeToMinutes(slot.to) <= convertTimeToMinutes(updatedSlot.from))
          .sort((a, b) => convertTimeToMinutes(b.to) - convertTimeToMinutes(a.to))

        // Find all slots that start after our desired end time
        const laterSlots = existingTimeSlots
          .filter((slot) => convertTimeToMinutes(slot.from) >= convertTimeToMinutes(updatedSlot.to))
          .sort((a, b) => convertTimeToMinutes(a.from) - convertTimeToMinutes(b.from))

        // If there are earlier slots, try to fit after the latest one
        if (earlierSlots.length > 0) {
          const latestEarlierSlot = earlierSlots[0]
          const newFrom = getNextMinuteTimeSlot(latestEarlierSlot.to)

          // Make sure our end time is still after the new start time
          if (isTimeBefore(newFrom, updatedSlot.to)) {
            updatedSlot.from = newFrom

            // Check if this resolves the conflict
            const stillHasConflict =
              hasConflict(day, updatedSlot, existingSchedules, currentCreativeId) ||
              hasInternalConflict(day, updatedSlot, slotIndex, prev)

            if (!stillHasConflict) {
              newTimeSlots[slotIndex] = updatedSlot
              return {
                ...prev,
                [day]: {
                  ...daySchedule,
                  timeSlots: newTimeSlots,
                },
              }
            }
          }
        }

        // If there are later slots, try to fit before the earliest one
        if (laterSlots.length > 0) {
          const earliestLaterSlot = laterSlots[0]
          const newTo = timeOptions[Math.max(0, timeOptions.indexOf(earliestLaterSlot.from) - 1)]

          // Make sure our start time is still before the new end time
          if (isTimeBefore(updatedSlot.from, newTo)) {
            updatedSlot.to = newTo

            // Check if this resolves the conflict
            const stillHasConflict =
              hasConflict(day, updatedSlot, existingSchedules, currentCreativeId) ||
              hasInternalConflict(day, updatedSlot, slotIndex, prev)

            if (!stillHasConflict) {
              newTimeSlots[slotIndex] = updatedSlot
              return {
                ...prev,
                [day]: {
                  ...daySchedule,
                  timeSlots: newTimeSlots,
                },
              }
            }
          }
        }
      }
      // If changing the end time
      else if (field === "to") {
        // Find all slots that start after our desired end time
        const laterSlots = existingTimeSlots
          .filter((slot) => convertTimeToMinutes(slot.from) >= convertTimeToMinutes(updatedSlot.to))
          .sort((a, b) => convertTimeToMinutes(a.from) - convertTimeToMinutes(b.from))

        // Find all slots that end before our desired start time
        earlierSlots = existingTimeSlots
          .filter((slot) => convertTimeToMinutes(slot.to) <= convertTimeToMinutes(updatedSlot.from))
          .sort((a, b) => convertTimeToMinutes(b.to) - convertTimeToMinutes(a.to))

        // If there are later slots, try to fit before the earliest one
        if (laterSlots.length > 0) {
          const earliestLaterSlot = laterSlots[0]
          const newTo = timeOptions[Math.max(0, timeOptions.indexOf(earliestLaterSlot.from) - 1)]

          // Make sure our start time is still before the new end time
          if (isTimeBefore(updatedSlot.from, newTo)) {
            updatedSlot.to = newTo

            // Check if this resolves the conflict
            const stillHasConflict =
              hasConflict(day, updatedSlot, existingSchedules, currentCreativeId) ||
              hasInternalConflict(day, updatedSlot, slotIndex, prev)

            if (!stillHasConflict) {
              newTimeSlots[slotIndex] = updatedSlot
              return {
                ...prev,
                [day]: {
                  ...daySchedule,
                  timeSlots: newTimeSlots,
                },
              }
            }
          }
        }
      }

      // If there are earlier slots, try to fit after the latest one
      if (earlierSlots.length > 0) {
        const latestEarlierSlot = earlierSlots[0]
        const newFrom = getNextMinuteTimeSlot(latestEarlierSlot.to)

        // Make sure our end time is still after the new start time
        if (isTimeBefore(newFrom, updatedSlot.to)) {
          updatedSlot.from = newFrom

          // Check if this resolves the conflict
          const stillHasConflict =
            hasConflict(day, updatedSlot, existingSchedules, currentCreativeId) ||
            hasInternalConflict(day, updatedSlot, slotIndex, prev)

          if (!stillHasConflict) {
            newTimeSlots[slotIndex] = updatedSlot
            return {
              ...prev,
              [day]: {
                ...daySchedule,
                timeSlots: newTimeSlots,
              },
            }
          }
        }
      }

      // If we couldn't resolve the conflict by adjusting, try to find a completely new non-overlapping slot
      const nonOverlappingSlot = findNonOverlappingTimeSlot(day, existingSchedules, currentCreativeId)

      newTimeSlots[slotIndex] = nonOverlappingSlot
      return {
        ...prev,
        [day]: {
          ...daySchedule,
          timeSlots: newTimeSlots,
        },
      }
    })
  }

  // Add time slot
  const addTimeSlot = (day: keyof DaypartingSchedule) => {
    setSchedule((prev) => {
      const daySchedule = { ...prev[day] } as DaySchedule

      // Get all existing time slots for this day (both from other creatives and current creative)
      const existingTimeSlots = [
        ...getAllTimeSlotsForDay(day, existingSchedules, currentCreativeId),
        ...daySchedule.timeSlots,
      ]

      // Sort existing slots by start time
      const sortedSlots = [...existingTimeSlots].sort(
        (a, b) => convertTimeToMinutes(a.from) - convertTimeToMinutes(b.from),
      )

      // Find gaps between existing slots
      for (let i = 0; i < sortedSlots.length; i++) {
        const currentSlot = sortedSlots[i]
        const nextSlot = sortedSlots[i + 1]

        // If this is the first slot, check if there's a gap before it
        if (i === 0 && convertTimeToMinutes(currentSlot.from) > convertTimeToMinutes("12:00 AM")) {
          return {
            ...prev,
            [day]: {
              ...daySchedule,
              timeSlots: [
                ...daySchedule.timeSlots,
                {
                  from: "12:00 AM",
                  to: timeOptions[Math.max(0, timeOptions.indexOf(currentSlot.from) - 1)],
                },
              ],
            },
          }
        }

        // If this is the last slot, check if there's a gap after it
        if (!nextSlot && convertTimeToMinutes(currentSlot.to) < convertTimeToMinutes("11:59 PM")) {
          return {
            ...prev,
            [day]: {
              ...daySchedule,
              timeSlots: [
                ...daySchedule.timeSlots,
                {
                  from: getNextMinuteTimeSlot(currentSlot.to),
                  to: "11:59 PM",
                },
              ],
            },
          }
        }

        // Check for gap between current and next slot
        if (nextSlot && convertTimeToMinutes(currentSlot.to) < convertTimeToMinutes(nextSlot.from) - 1) {
          return {
            ...prev,
            [day]: {
              ...daySchedule,
              timeSlots: [
                ...daySchedule.timeSlots,
                {
                  from: getNextMinuteTimeSlot(currentSlot.to),
                  to: timeOptions[Math.max(0, timeOptions.indexOf(nextSlot.from) - 1)],
                },
              ],
            },
          }
        }
      }

      // If no existing slots, use default 24-hour slot
      if (sortedSlots.length === 0) {
        return {
          ...prev,
          [day]: {
            ...daySchedule,
            timeSlots: [...daySchedule.timeSlots, { ...defaultTimeSlot }],
          },
        }
      }

      // If we couldn't find a gap, try evening time slot (6 PM - 11:59 PM)
      const eveningSlot = { from: "6:00 PM", to: "11:59 PM" }
      const hasEveningConflict = existingTimeSlots.some((slot) => doTimeSlotsOverlap(eveningSlot, slot))

      if (!hasEveningConflict) {
        return {
          ...prev,
          [day]: {
            ...daySchedule,
            timeSlots: [...daySchedule.timeSlots, eveningSlot],
          },
        }
      }

      // If evening slot has conflict, try morning time slot (12:00 AM - 8:00 AM)
      const morningSlot = { from: "12:00 AM", to: "8:00 AM" }
      const hasMorningConflict = existingTimeSlots.some((slot) => doTimeSlotsOverlap(morningSlot, slot))

      if (!hasMorningConflict) {
        return {
          ...prev,
          [day]: {
            ...daySchedule,
            timeSlots: [...daySchedule.timeSlots, morningSlot],
          },
        }
      }

      // If we still couldn't find a non-overlapping slot, use a late night slot
      return {
        ...prev,
        [day]: {
          ...daySchedule,
          timeSlots: [...daySchedule.timeSlots, { from: "11:30 PM", to: "11:59 PM" }],
        },
      }
    })
  }

  // Remove time slot
  const removeTimeSlot = (day: keyof DaypartingSchedule, slotIndex: number) => {
    setSchedule((prev) => {
      const daySchedule = { ...prev[day] } as DaySchedule
      const newTimeSlots = [...daySchedule.timeSlots]
      newTimeSlots.splice(slotIndex, 1)

      return {
        ...prev,
        [day]: {
          ...daySchedule,
          timeSlots: newTimeSlots,
        },
      }
    })
  }

  // Handle save
  const handleSave = () => {
    // We'll still check for invalid time slots (where "from" is after "to")
    let hasInvalidTimeSlot = false

    // Check each day's time slots for invalid time slots
    const days: (keyof DaypartingSchedule)[] = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]

    for (const day of days) {
      const daySchedule = schedule[day] as DaySchedule
      if (!daySchedule.enabled) continue

      // Check each time slot
      for (let i = 0; i < daySchedule.timeSlots.length; i++) {
        const slot = daySchedule.timeSlots[i]

        // Check if slot is valid
        if (!isTimeSlotValid(slot)) {
          hasInvalidTimeSlot = true
          break
        }
      }

      if (hasInvalidTimeSlot) break
    }

    if (!hasInvalidTimeSlot) {
      onSave(schedule)
      onClose()
    } else {
      // Show an error message for invalid time slots
      alert("Please fix all invalid time slots before saving. Start time must be before end time.")
    }
  }

  // Update the day abbreviations
  const dayAbbreviations = {
    monday: "M",
    tuesday: "T",
    wednesday: "W",
    thursday: "Th",
    friday: "F",
    saturday: "Sa",
    sunday: "Su",
  }

  // Render day row
  const renderDayRow = (day: keyof DaypartingSchedule, label: string) => {
    const daySchedule = schedule[day] as DaySchedule

    return (
      <>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Tooltip title={daySchedule.enabled ? "Disable this day" : "Enable this day"}>
            <Switch
              checked={daySchedule.enabled}
              onChange={() => handleDayToggle(day)}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#ef0078",
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#ef0078",
                },
              }}
            />
          </Tooltip>
          <Typography
            variant="body1"
            sx={{
              ml: 1,
              color: daySchedule.enabled ? "white" : "rgba(255, 255, 255, 0.5)",
            }}
          >
            {label}
          </Typography>
        </Box>

        {daySchedule.enabled &&
          daySchedule.timeSlots.map((timeSlot, slotIndex) => {
            const hasTimeConflict = hasConflict(day, timeSlot, existingSchedules, currentCreativeId)
            const hasTimeInternalConflict = hasInternalConflict(day, timeSlot, slotIndex, schedule)
            const isSlotValid = isTimeSlotValid(timeSlot)
            const isError = hasTimeConflict || !isSlotValid || hasTimeInternalConflict

            return (
              <Box
                key={slotIndex}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                  ml: 7,
                }}
              >
                <Box sx={{ width: "100%", display: "flex", gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                      From
                    </Typography>
                    <Tooltip title="Select start time">
                      <div>
                        <CustomDropdown
                          options={timeOptions}
                          value={timeSlot.from}
                          onChange={(value) => handleTimeSlotChange(day, slotIndex, "from", value)}
                          error={isError}
                        />
                      </div>
                    </Tooltip>
                    {isError && (
                      <Typography variant="caption" sx={{ color: "#f44336", mt: 0.5, display: "block" }}>
                        {!isSlotValid
                          ? "Start time must be before end time"
                          : hasTimeConflict
                            ? "This time slot conflicts with another creative. If one creative ends at 5:00 PM, the next should start at 5:01 PM."
                            : hasTimeInternalConflict
                              ? "This time slot conflicts with another time slot for this day. Time slots cannot overlap."
                              : ""}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                      To
                    </Typography>
                    <Tooltip title="Select end time">
                      <div>
                        <CustomDropdown
                          options={timeOptions}
                          value={timeSlot.to}
                          onChange={(value) => handleTimeSlotChange(day, slotIndex, "to", value)}
                          error={isError}
                        />
                      </div>
                    </Tooltip>
                  </Box>

                  {slotIndex === 0 ? (
                    <Tooltip title="Add another time slot">
                      <IconButton
                        onClick={() => addTimeSlot(day)}
                        sx={{
                          color: "white",
                          bgcolor: "#ef0078",
                          width: 36,
                          height: 36,
                          alignSelf: "flex-end",
                          "&:hover": {
                            bgcolor: "#d82388",
                          },
                        }}
                      >
                        <AddIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Remove this time slot">
                      <IconButton
                        onClick={() => removeTimeSlot(day, slotIndex)}
                        sx={{
                          color: "white",
                          bgcolor: "#5d5d5d",
                          width: 36,
                          height: 36,
                          alignSelf: "flex-end",
                          "&:hover": {
                            bgcolor: "#4d4d4d",
                          },
                        }}
                      >
                        <RemoveIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            )
          })}
      </>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target.tagName !== "INPUT" && e.target.tagName !== "BUTTON") {
          e.preventDefault()
          handleSave()
        }
      }}
      PaperProps={{
        sx: {
          bgcolor: "#333333",
          color: "white",
          width: "500px",
          maxWidth: "90vw",
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>Dayparting</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
            Time zone
          </Typography>
          <Tooltip title="Select the timezone for this schedule">
            <div>
              <CustomDropdown options={timezoneOptions} value={schedule.timezone} onChange={handleTimezoneChange} />
            </div>
          </Tooltip>

          <Typography variant="body1" sx={{ mt: 3, mb: 2 }}>
            Weekly hours
          </Typography>

          {renderDayRow("monday", "Monday")}
          {renderDayRow("tuesday", "Tuesday")}
          {renderDayRow("wednesday", "Wednesday")}
          {renderDayRow("thursday", "Thursday")}
          {renderDayRow("friday", "Friday")}
          {renderDayRow("saturday", "Saturday")}
          {renderDayRow("sunday", "Sunday")}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Tooltip title="Cancel changes and close">
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
        </Tooltip>
        <Tooltip title="Save dayparting schedule">
          <Button
            onClick={handleSave}
            sx={{
              color: "#ef0078",
              "&:hover": {
                backgroundColor: "rgba(239, 0, 120, 0.1)",
              },
            }}
          >
            ADD
          </Button>
        </Tooltip>
      </DialogActions>
    </Dialog>
  )
}

