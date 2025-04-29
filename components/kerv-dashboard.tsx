import React, { useState, useEffect, useCallback, useRef } from "react"
import type React from "react"

import Box from "@mui/material/Box"
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import Paper from "@mui/material/Paper"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import IconButton from "@mui/material/IconButton"
import Stack from "@mui/material/Stack"
import Checkbox from "@mui/material/Checkbox"
import Tooltip from "@mui/material/Tooltip"
import TextField from "@mui/material/TextField"
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogActions from "@mui/material/DialogActions"
import Chip from "@mui/material/Chip"

// MUI Icons
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import MoreHorizIcon from "@mui/icons-material/MoreHoriz"
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth"
import AccessTimeIcon from "@mui/icons-material/AccessTime"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import AutorenewIcon from "@mui/icons-material/Autorenew"

import Sidebar from "./sidebar"
import { AddCreativeDialog } from "./add-creative-dialog"
import { DatePickerDialog } from "./date-picker-dialog"
import { DaypartingDialog, type DaypartingSchedule } from "./dayparting-dialog"
import { ChangeDefaultCreativeDialog } from "./change-default-creative-dialog"
import { LineItemDetails } from "./line-item-details"

// First, import the CreativeWeighting component
import { CreativeWeighting } from "./creative-weighting"

// Mock data for creatives
const creativeOptions = Array.from({ length: 15 }, (_, i) => ({
  id: 10290 + i,
  label: `Creative ${i + 1}`,
}))

interface Creative {
  id: number
  name: string
  playbackMode: string
  status: boolean
  startDate: string
  endDate: string
  weighting: number
  dayparting: string
  daypartingSchedule?: DaypartingSchedule
  hasCustomWeight?: boolean // New property to track custom weights
  isDefault?: boolean // Changed from isHero to isDefault
  originalWeight?: number // Add this property to track original weights
  thumbnailUrl?: string // Add thumbnail URL property
}

// Helper function to format date as YYYY-MM-DD
const formatDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Helper function to display date in local format
const displayDate = (dateStr: string): string => {
  if (!dateStr) return "SELECT"

  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString()
  } catch (e) {
    return "SELECT"
  }
}

// Helper function to summarize dayparting schedule
const summarizeDayparting = (schedule?: DaypartingSchedule): string => {
  if (!schedule) return "NONE"

  const dayAbbreviations = {
    monday: "M",
    tuesday: "T",
    wednesday: "W",
    thursday: "Th",
    friday: "F",
    saturday: "Sa",
    sunday: "Su",
  }

  const enabledDays = [
    schedule.monday.enabled ? dayAbbreviations.monday : null,
    schedule.tuesday.enabled ? dayAbbreviations.tuesday : null,
    schedule.wednesday.enabled ? dayAbbreviations.wednesday : null,
    schedule.thursday.enabled ? dayAbbreviations.thursday : null,
    schedule.friday.enabled ? dayAbbreviations.friday : null,
    schedule.saturday.enabled ? dayAbbreviations.saturday : null,
    schedule.sunday.enabled ? dayAbbreviations.sunday : null,
  ].filter(Boolean)

  if (enabledDays.length === 0) return "NONE"

  if (enabledDays.length <= 3) {
    return enabledDays.join(", ")
  }

  return `${enabledDays.length} days`
}

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
const doTimeSlotsOverlap = (slot1: { from: string; to: string }, slot2: { from: string; to: string }): boolean => {
  // Check if slot1 starts before slot2 ends and slot1 ends after slot2 starts
  return (
    (isTimeBefore(slot1.from, slot2.to) && isTimeBefore(slot2.from, slot1.to)) ||
    slot1.from === slot2.from ||
    slot1.to === slot2.to
  )
}

// Find the redistributeWeights function and replace it with this improved version:

const redistributeWeights = (updatedCreatives: Creative[]) => {
  // Get active creatives
  const activeCreatives = updatedCreatives.filter((c) => c.status)

  // If no active creatives, return as is
  if (activeCreatives.length === 0) return updatedCreatives

  // If only one active creative, set its weight to 100%
  if (activeCreatives.length === 1) {
    return updatedCreatives.map((creative) => (creative.status ? { ...creative, weighting: 100 } : creative))
  }

  // Get creatives with custom weights
  const customWeightedCreatives = activeCreatives.filter((c) => c.hasCustomWeight)
  const nonCustomCreatives = activeCreatives.filter((c) => !c.hasCustomWeight)

  // If no custom weights, distribute evenly with improved logic
  if (customWeightedCreatives.length === 0) {
    // Find the default creative
    const defaultCreative = activeCreatives.find((c) => c.isDefault)

    // Calculate base weight and remainder
    const baseWeight = Math.floor(100 / activeCreatives.length)
    const remainder = 100 - baseWeight * activeCreatives.length

    // If there's no remainder, distribute evenly
    if (remainder === 0) {
      return updatedCreatives.map((creative) => {
        if (!creative.status) return creative
        return { ...creative, weighting: baseWeight }
      })
    }

    // If there's a remainder, distribute it more evenly
    // Sort creatives to prioritize default first, then by ID for consistency
    const sortedCreatives = [...nonCustomCreatives].sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1
      if (!a.isDefault && b.isDefault) return 1
      return a.id - b.id
    })

    // Create a map to track which creatives get extra weight
    const extraWeightMap = new Map<number, boolean>()

    // Distribute the remainder among the first 'remainder' creatives
    for (let i = 0; i < remainder; i++) {
      extraWeightMap.set(sortedCreatives[i % sortedCreatives.length].id, true)
    }

    return updatedCreatives.map((creative) => {
      if (!creative.status) return creative

      // Give an extra 1% to creatives in the extraWeightMap
      const extraWeight = extraWeightMap.get(creative.id) ? 1 : 0
      return { ...creative, weighting: baseWeight + extraWeight }
    })
  }

  // Calculate total custom weight
  const totalCustomWeight = customWeightedCreatives.reduce((sum, c) => sum + c.weighting, 0)

  // If custom weights exceed 100%, scale them down proportionally
  if (totalCustomWeight > 100) {
    const scaleFactor = 100 / totalCustomWeight

    return updatedCreatives.map((creative) => {
      if (!creative.status) return creative

      if (creative.hasCustomWeight) {
        // Store original weight before scaling
        const originalWeight = creative.originalWeight || creative.weighting
        return {
          ...creative,
          weighting: Math.round(creative.weighting * scaleFactor),
          originalWeight: originalWeight,
        }
      }

      // Non-custom creatives get 0%
      return { ...creative, weighting: 0 }
    })
  }
  // If there are non-custom creatives, distribute remaining weight
  else if (nonCustomCreatives.length > 0) {
    // Distribute remaining weight evenly among non-custom creatives
    const remainingWeight = 100 - totalCustomWeight

    if (remainingWeight > 0) {
      // Find the default creative among non-custom creatives
      const defaultCreative = nonCustomCreatives.find((c) => c.isDefault)

      // Calculate base weight and remainder
      const baseWeight = Math.floor(remainingWeight / nonCustomCreatives.length)
      const remainder = remainingWeight - baseWeight * nonCustomCreatives.length

      // If there's no remainder, distribute evenly
      if (remainder === 0) {
        return updatedCreatives.map((creative) => {
          if (!creative.status) return creative
          if (creative.hasCustomWeight) return creative
          return { ...creative, weighting: baseWeight }
        })
      }

      // If there's a remainder, distribute it more evenly
      // Sort non-custom creatives to prioritize default first, then by ID
      const sortedNonCustom = [...nonCustomCreatives].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1
        if (!a.isDefault && b.isDefault) return 1
        return a.id - b.id
      })

      // Create a map to track which creatives get extra weight
      const extraWeightMap = new Map<number, boolean>()

      // Distribute the remainder among the first 'remainder' creatives
      for (let i = 0; i < remainder; i++) {
        extraWeightMap.set(sortedNonCustom[i % sortedNonCustom.length].id, true)
      }

      return updatedCreatives.map((creative) => {
        if (!creative.status) return creative
        if (creative.hasCustomWeight) return creative

        // Give an extra 1% to creatives in the extraWeightMap
        const extraWeight = extraWeightMap.get(creative.id) ? 1 : 0
        return { ...creative, weighting: baseWeight + extraWeight }
      })
    } else {
      // No weight left for non-custom creatives
      return updatedCreatives.map((creative) => {
        if (!creative.status) return creative

        if (creative.hasCustomWeight) {
          return creative
        }

        return { ...creative, weighting: 0 }
      })
    }
  }
  // If all creatives have custom weights but they don't add up to 100%,
  // scale them proportionally to reach 100%
  else if (totalCustomWeight < 100) {
    const scaleFactor = 100 / totalCustomWeight

    return updatedCreatives.map((creative) => {
      if (!creative.status) return creative

      // Store original weight before scaling
      const originalWeight = creative.originalWeight || creative.weighting
      return {
        ...creative,
        weighting: Math.round(creative.weighting * scaleFactor),
        originalWeight: originalWeight,
      }
    })
  }

  // If everything is balanced, return as is
  return updatedCreatives
}

export default function KervDashboard() {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [creatives, setCreatives] = useState<Creative[]>([])

  // Date picker state
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [selectedCreativeId, setSelectedCreativeId] = useState<number | null>(null)
  const [datePickerType, setDatePickerType] = useState<"start" | "end">("start")
  const [datePickerAnchorEl, setDatePickerAnchorEl] = useState<HTMLElement | null>(null)

  // Add state for dayparting dialog
  const [daypartingDialogOpen, setDaypartingDialogOpen] = useState(false)
  const [daypartingCreativeId, setDaypartingCreativeId] = useState<number | null>(null)

  // Add state to track the last selected timezone
  const [lastSelectedTimezone, setLastSelectedTimezone] = useState<string>("CST")

  // Use a ref to track if we're in the middle of a weight update
  const isUpdatingWeights = useRef(false)
  // Use a ref to track the previous length of creatives
  const prevCreativesLength = useRef(0)

  // Add a new state to track which creative is being edited
  const [editingWeightId, setEditingWeightId] = useState<number | null>(null)

  // Add new state for line item title editing
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [lineItemTitle, setLineItemTitle] = useState("RedBull_Vid_Stratos_Awareness_Q1_2019")
  const [editedTitle, setEditedTitle] = useState("")
  const [hasNotifications, setHasNotifications] = useState(false) // Demo state for notifications

  const [changeDefaultDialogOpen, setChangeDefaultDialogOpen] = useState(false)
  const [newDefaultCreativeId, setNewDefaultCreativeId] = useState<number | null>(null)

  // Add state for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [creativeToDelete, setCreativeToDelete] = useState<number | null>(null)
  const [deleteAfterChangeDefault, setDeleteAfterChangeDefault] = useState(false)

  // Add new state for line item dates
  // Update line item dates to match the requested dates
  const [lineItemStartDate, setLineItemStartDate] = useState("2025/03/01") // March 1, 2025
  const [lineItemEndDate, setLineItemEndDate] = useState("2025/05/31") // May 31, 2025
  const [lineItemDatePickerOpen, setLineItemDatePickerOpen] = useState(false)
  const [lineItemDatePickerType, setLineItemDatePickerType] = useState<"lineItemStart" | "lineItemEnd">("lineItemStart")
  const [lineItemDatePickerAnchorEl, setLineItemDatePickerAnchorEl] = useState<HTMLElement | null>(null)

  // Handler for line item date picker
  const handleLineItemDateSelect = (type: "lineItemStart" | "lineItemEnd", date: Date) => {
    const formattedDate = formatDateString(date)
    if (type === "lineItemStart") {
      setLineItemStartDate(formattedDate)
      // If start date is after end date, update end date too
      if (lineItemEndDate && formattedDate > lineItemEndDate) {
        setLineItemEndDate(formattedDate)
      }
    } else {
      // Don't allow end date to be before start date
      if (lineItemStartDate && formattedDate < lineItemStartDate) {
        return
      }
      setLineItemEndDate(formattedDate)
    }
    setLineItemDatePickerOpen(false)
    setLineItemDatePickerAnchorEl(null)
  }

  // Update the handleChangeDefault function to explicitly update the default creative
  const handleChangeDefault = (id: number) => {
    // Update the creatives array to change which one is marked as default
    setCreatives((prevCreatives) => {
      // First, update which creative is the default
      let updatedCreatives = prevCreatives.map((creative) => ({
        ...creative,
        isDefault: creative.id === id,
      }))

      // If we were changing default because we're deactivating a creative,
      // also update its status
      if (newDefaultCreativeId !== null) {
        updatedCreatives = updatedCreatives.map((creative) =>
          creative.id === newDefaultCreativeId ? { ...creative, status: false } : creative,
        )
      }

      // The default creative info in the details box will automatically update
      // since getDefaultCreativeInfo() is called during render
      return updatedCreatives
    })

    setChangeDefaultDialogOpen(false)

    // If we're in the delete flow, open the delete confirmation dialog
    if (deleteAfterChangeDefault && creativeToDelete !== null) {
      setDeleteDialogOpen(true)
      setDeleteAfterChangeDefault(false)
    } else {
      setNewDefaultCreativeId(null)
    }
  }

  // Add a comment to the getDefaultCreativeInfo function to clarify its purpose
  // Get the default creative info for the LineItemDetails component
  // This is called during render, so it will update whenever the default creative changes
  const getDefaultCreativeInfo = () => {
    const defaultCreative = creatives.find((c) => c.isDefault)
    return defaultCreative
      ? {
          name: defaultCreative.name,
          thumbnailUrl: defaultCreative.thumbnailUrl || null,
        }
      : { name: null, thumbnailUrl: null }
  }

  const handleEditTitle = () => {
    setEditedTitle(lineItemTitle)
    setIsEditingTitle(true)
  }

  const handleSaveTitle = () => {
    if (editedTitle.trim()) {
      setLineItemTitle(editedTitle.trim())
    }
    setIsEditingTitle(false)
  }

  // Handle opening delete dialog
  const handleOpenDeleteDialog = (id: number) => {
    // Check if this is the default creative
    const isDefault = creatives.find((c) => c.id === id)?.isDefault

    if (isDefault) {
      // If this is the default and there are no other active creatives, show an error
      if (creatives.filter((c) => c.status && !c.isDefault).length === 0) {
        alert("Cannot delete the default creative when there are no other active creatives.")
        return
      }

      // If it's the default creative, we need to change the default first
      setNewDefaultCreativeId(null) // Not deactivating, just changing default
      setCreativeToDelete(id)
      setDeleteAfterChangeDefault(true)
      setChangeDefaultDialogOpen(true)
      return
    }

    // For non-default creatives, proceed directly to delete confirmation
    setCreativeToDelete(id)
    setDeleteDialogOpen(true)
  }

  // Handle delete creative
  const handleDeleteCreative = () => {
    if (creativeToDelete === null) return

    // Check if we're deleting the default creative
    const isDefault = creatives.find((c) => c.id === creativeToDelete)?.isDefault

    if (isDefault) {
      // If deleting the default creative, we need to set a new default
      const newDefault = creatives.find((c) => c.status && c.id !== creativeToDelete)

      if (newDefault) {
        // Set the new default
        setCreatives((prevCreatives) =>
          prevCreatives
            .filter((c) => c.id !== creativeToDelete)
            .map((c) => (c.id === newDefault.id ? { ...c, isDefault: true } : c)),
        )
      } else {
        // This shouldn't happen due to our earlier check, but just in case
        setDeleteDialogOpen(false)
        setCreativeToDelete(null)
        return
      }
    } else {
      // If not deleting the default, just remove the creative
      setCreatives((prevCreatives) => prevCreatives.filter((c) => c.id !== creativeToDelete))
    }

    // Close the dialog
    setDeleteDialogOpen(false)
    setCreativeToDelete(null)
  }

  // Recalculate weights when creatives change
  useEffect(() => {
    // Skip if we're already updating weights
    if (isUpdatingWeights.current) {
      prevCreativesLength.current = creatives.length
      return
    }

    const updatedCreatives = redistributeWeights([...creatives])

    // Only update if there's a change
    if (JSON.stringify(updatedCreatives) !== JSON.stringify(creatives)) {
      setCreatives(updatedCreatives)
    }

    prevCreativesLength.current = creatives.length
  }, [creatives])

  const handleAddCreative = (selectedCreatives: any[]) => {
    // Check if this is the first creative being added
    const isFirstCreative = creatives.length === 0

    // Create new creatives with default weights
    const newCreatives = selectedCreatives.map((creative, index) => ({
      id: creative.id,
      name: creative.label,
      playbackMode: "CTV",
      status: true,
      startDate: "", // Remove default date
      endDate: "", // Remove default date
      weighting: 0, // Will be calculated in redistributeWeights
      dayparting: "NONE",
      hasCustomWeight: false, // Initialize with no custom weight
      isDefault: isFirstCreative && index === 0, // First creative becomes default if no creatives exist
      thumbnailUrl: `/placeholder.svg?height=34&width=60&text=${encodeURIComponent(creative.label)}`,
    }))

    // Add new creatives and redistribute weights
    const updatedCreatives = redistributeWeights([...creatives, ...newCreatives])

    // If this was the first creative, update associatedCreative state
    if (isFirstCreative && newCreatives.length > 0) {
    }

    setCreatives(updatedCreatives)
    setAddDialogOpen(false)
  }

  // Add a helper function to check for dayparting conflicts
  const checkDaypartingConflicts = (schedule: DaypartingSchedule, otherSchedules: DaypartingSchedule[]): boolean => {
    if (!schedule || otherSchedules.length === 0) return false

    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const

    for (const day of days) {
      const daySchedule = schedule[day]
      if (!daySchedule.enabled) continue

      for (const otherSchedule of otherSchedules) {
        const otherDaySchedule = otherSchedule[day]
        if (!otherDaySchedule.enabled) continue

        // Check each time slot for conflicts
        for (const slot of daySchedule.timeSlots) {
          for (const otherSlot of otherDaySchedule.timeSlots) {
            if (doTimeSlotsOverlap(slot, otherSlot)) {
              return true
            }
          }
        }
      }
    }

    return false
  }

  const handleStatusChange = (id: number, checked: boolean) => {
    // If trying to deactivate the default creative, show the change default dialog instead
    if (!checked) {
      const targetCreative = creatives.find((c) => c.id === id)
      if (targetCreative && targetCreative.isDefault) {
        // Set the creative ID that's being deactivated so we can exclude it from options
        setNewDefaultCreativeId(id)
        setChangeDefaultDialogOpen(true)
        return // Exit early - don't change status yet
      }
    }

    // Update the status of the creative
    let updatedCreatives = creatives.map((creative) => {
      if (creative.id === id) {
        // If being set to active and has dayparting, check for conflicts
        if (checked && creative.daypartingSchedule) {
          // Get all active creatives' dayparting schedules
          const activeSchedules = creatives
            .filter((c) => c.id !== id && c.status && c.daypartingSchedule)
            .map((c) => c.daypartingSchedule as DaypartingSchedule)

          // Check if this creative's schedule conflicts with any active creative
          const hasConflict = checkDaypartingConflicts(creative.daypartingSchedule, activeSchedules)

          // If there's a conflict, reset the dayparting schedule
          if (hasConflict) {
            return {
              ...creative,
              status: checked,
              dayparting: "NONE",
              daypartingSchedule: undefined,
            }
          }
        }

        return { ...creative, status: checked }
      }
      return creative
    })

    // DEACTIVATION LOGIC
    if (!checked) {
      // Get all active creatives after the status change
      const activeCreatives = updatedCreatives.filter((c) => c.status)

      // Get creatives with custom weights
      const customWeightedCreatives = activeCreatives.filter((c) => c.hasCustomWeight)

      // Get non-custom creatives
      const nonCustomCreatives = activeCreatives.filter((c) => !c.hasCustomWeight)

      // If there are active creatives left
      if (activeCreatives.length > 0) {
        // If only one creative remains active, it gets 100%
        if (activeCreatives.length === 1) {
          updatedCreatives = updatedCreatives.map((c) => (c.status ? { ...c, weighting: 100 } : c))
        }
        // If there are custom weighted creatives
        else if (customWeightedCreatives.length > 0) {
          // Calculate total custom weight
          const totalCustomWeight = customWeightedCreatives.reduce((sum, c) => sum + c.weighting, 0)

          // If there are also non-custom creatives
          if (nonCustomCreatives.length > 0) {
            // Keep custom weights as they are and distribute remaining weight to non-custom
            const remainingWeight = 100 - totalCustomWeight

            if (remainingWeight > 0) {
              const evenWeight = Math.floor(remainingWeight / nonCustomCreatives.length)
              const remainder = remainingWeight - evenWeight * nonCustomCreatives.length

              updatedCreatives = updatedCreatives.map((creative) => {
                if (!creative.status) return creative

                // Keep custom weights exactly as they are
                if (creative.hasCustomWeight) {
                  return creative
                }

                // First non-custom creative gets any remainder
                if (creative.id === nonCustomCreatives[0].id) {
                  return { ...creative, weighting: evenWeight + remainder }
                }

                return { ...creative, weighting: evenWeight }
              })
            } else {
              // No weight left for non-custom creatives
              updatedCreatives = updatedCreatives.map((creative) => {
                if (!creative.status || creative.hasCustomWeight) return creative
                return { ...creative, weighting: 0 }
              })
            }
          }
          // If all remaining creatives have custom weights, scale them proportionally
          else if (totalCustomWeight < 100) {
            const scaleFactor = 100 / totalCustomWeight

            updatedCreatives = updatedCreatives.map((creative) => {
              if (!creative.status) return creative

              if (creative.hasCustomWeight) {
                // Store original weight before scaling
                const originalWeight = creative.originalWeight || creative.weighting
                return {
                  ...creative,
                  weighting: Math.round(creative.weighting * scaleFactor),
                  originalWeight: originalWeight,
                }
              }

              return creative
            })
          }
        }
        // If no custom weights, distribute evenly
        else {
          const evenWeight = Math.floor(100 / activeCreatives.length)
          const remainder = 100 - evenWeight * activeCreatives.length

          updatedCreatives = updatedCreatives.map((creative, index) => {
            if (!creative.status) return creative

            // First active creative gets any remainder
            if (index === 0) {
              return { ...creative, weighting: evenWeight + remainder }
            }

            return { ...creative, weighting: evenWeight }
          })
        }
      }
    }
    // ACTIVATION LOGIC
    else {
      // If being set to active, reset dayparting
      if (checked) {
        updatedCreatives = updatedCreatives.map((creative) => {
          if (creative.id === id) {
            return {
              ...creative,
              status: true,
              dayparting: "NONE",
              daypartingSchedule: undefined,
            }
          }
          return creative
        })
      }

      // Store the current distribution before making changes
      const currentDistribution = updatedCreatives
        .filter((c) => c.status)
        .map((c) => ({
          id: c.id,
          weight: c.weighting,
          hasCustomWeight: c.hasCustomWeight,
        }))

      // Get the creative being activated
      const activatingCreative = updatedCreatives.find((c) => c.id === id)

      // Check if this creative had a previous weight before deactivation
      const hadPreviousDistribution = updatedCreatives.some((c) => c.originalWeight !== undefined)

      // If we're restoring a previous distribution
      if (hadPreviousDistribution) {
        // Restore original weights for all creatives
        updatedCreatives = updatedCreatives.map((creative) => {
          if (!creative.status && creative.id !== id) return creative

          // For the creative being activated
          if (creative.id === id) {
            // If it has an original weight, restore it
            if (creative.originalWeight !== undefined) {
              return {
                ...creative,
                status: true,
                weighting: creative.originalWeight,
                // Dayparting is already reset above
              }
            }
            // Otherwise, it was never custom weighted, so it gets the default distribution
            else {
              return {
                ...creative,
                status: true,
                weighting: 0, // Will be calculated below
                // Dayparting is already reset above
              }
            }
          }

          // For already active creatives with original weights
          if (creative.originalWeight !== undefined) {
            return {
              ...creative,
              weighting: creative.originalWeight,
            }
          }

          return creative
        })

        // Now redistribute weights to ensure they sum to 100%
        updatedCreatives = redistributeWeights(updatedCreatives)
      }
      // If no previous distribution to restore, just activate and redistribute
      else {
        // Just set the status to true and let redistributeWeights handle the rest
        // (Dayparting is already reset above)
        updatedCreatives = redistributeWeights(updatedCreatives)
      }
    }

    setCreatives(updatedCreatives)
  }

  // Make sure to keep the handleWeightChange function in the KervDashboard component
  // since it manages the state for all creatives
  const handleWeightChange = (id: number, value: string) => {
    // Skip if we're already updating weights
    if (isUpdatingWeights.current) return

    isUpdatingWeights.current = true

    try {
      // Parse the input value
      let newWeight = Number.parseInt(value, 10)

      // Ensure it's a valid number between 0 and 100
      if (isNaN(newWeight)) newWeight = 0
      if (newWeight < 0) newWeight = 0
      if (newWeight > 100) newWeight = 100

      // First update the creative with the new weight and mark it as custom
      let updatedCreatives = creatives.map((creative) => {
        if (creative.id === id) {
          return {
            ...creative,
            weighting: newWeight,
            hasCustomWeight: true,
            originalWeight: newWeight, // Store the original weight
          }
        }
        return creative
      })

      // Get active creatives
      const activeCreatives = updatedCreatives.filter((c) => c.status)

      // If there's only one active creative, it gets 100%
      if (activeCreatives.length === 1) {
        updatedCreatives = updatedCreatives.map((c) => (c.status ? { ...c, weighting: 100 } : c))
        setCreatives(updatedCreatives)
        isUpdatingWeights.current = false
        return
      }

      // Get all custom weighted creatives
      const customWeightedCreatives = activeCreatives.filter((c) => c.hasCustomWeight)

      // Get non-custom creatives
      const nonCustomCreatives = activeCreatives.filter((c) => !c.hasCustomWeight)

      // Calculate total custom weight
      const totalCustomWeight = customWeightedCreatives.reduce((sum, c) => sum + c.weighting, 0)

      // If custom weights exceed 100%, scale them down proportionally
      if (totalCustomWeight > 100) {
        // We want to preserve the newly set weight if possible
        const otherCustomCreatives = customWeightedCreatives.filter((c) => c.id !== id)
        const otherCustomTotal = otherCustomCreatives.reduce((sum, c) => sum + c.weighting, 0)

        if (otherCustomTotal >= 100 - newWeight) {
          // Scale other custom weights to fit in (100 - newWeight)%
          const scaleFactor = (100 - newWeight) / otherCustomTotal

          updatedCreatives = updatedCreatives.map((creative) => {
            if (!creative.status) return creative

            // Keep the edited creative's weight as is
            if (creative.id === id) {
              return creative
            }

            // Scale down other custom weights
            if (creative.hasCustomWeight) {
              // Store original weight before scaling
              const originalWeight = creative.originalWeight || creative.weighting
              return {
                ...creative,
                weighting: Math.round(creative.weighting * scaleFactor),
                originalWeight: originalWeight,
              }
            }

            // Non-custom creatives get 0%
            return { ...creative, weighting: 0 }
          })
        } else {
          // Keep the edited weight and other custom weights as they are, set non-custom to 0
          updatedCreatives = updatedCreatives.map((creative) => {
            if (!creative.status) return creative

            if (creative.hasCustomWeight) {
              return creative
            }

            return { ...creative, weighting: 0 }
          })
        }
      } else if (nonCustomCreatives.length > 0) {
        // Distribute remaining weight evenly among non-custom creatives
        const remainingWeight = 100 - totalCustomWeight

        if (remainingWeight > 0) {
          const evenWeight = Math.floor(remainingWeight / nonCustomCreatives.length)
          const remainder = remainingWeight - evenWeight * nonCustomCreatives.length

          updatedCreatives = updatedCreatives.map((creative) => {
            if (!creative.status || creative.hasCustomWeight) return creative

            // First non-custom creative gets any remainder
            if (creative.id === nonCustomCreatives[0].id) {
              return { ...creative, weighting: evenWeight + remainder }
            }

            return { ...creative, weighting: evenWeight }
          })
        } else {
          // No weight left for non-custom creatives
          updatedCreatives = updatedCreatives.map((creative) => {
            if (!creative.status || creative.hasCustomWeight) return creative
            return { ...creative, weighting: 0 }
          })
        }
      }

      // Set the updated creatives
      setCreatives(updatedCreatives)
    } finally {
      isUpdatingWeights.current = false
    }
  }

  const handleOpenDatePicker = (id: number, type: "start" | "end", event: React.MouseEvent<HTMLElement>) => {
    setSelectedCreativeId(id)
    setDatePickerType(type)
    setDatePickerOpen(true)
    setDatePickerAnchorEl(event.currentTarget)
  }

  const handleCloseDatePicker = () => {
    setDatePickerOpen(false)
    setSelectedCreativeId(null)
    setDatePickerAnchorEl(null)
  }

  const handleDateSelect = (date: Date) => {
    if (selectedCreativeId === null) return

    // Format the date as YYYY-MM-DD
    const formattedDate = formatDateString(date)

    setCreatives(
      creatives.map((creative) => {
        if (creative.id === selectedCreativeId) {
          if (datePickerType === "start") {
            // If start date is after end date, update end date too
            if (creative.endDate && formattedDate > creative.endDate) {
              return { ...creative, startDate: formattedDate, endDate: formattedDate }
            }
            return { ...creative, startDate: formattedDate }
          } else {
            // Don't allow end date to be before start date
            if (creative.startDate && formattedDate < creative.startDate) {
              return creative
            }
            return { ...creative, endDate: formattedDate }
          }
        }
        return creative
      }),
    )

    handleCloseDatePicker()
  }

  // Add handler for opening dayparting dialog
  const handleOpenDaypartingDialog = (id: number) => {
    setDaypartingCreativeId(id)
    setDaypartingDialogOpen(true)
  }

  // Add handler for saving dayparting schedule
  const handleSaveDayparting = (schedule: DaypartingSchedule) => {
    if (daypartingCreativeId === null) return

    // Store the selected timezone for future use
    setLastSelectedTimezone(schedule.timezone)

    setCreatives(
      creatives.map((creative) => {
        if (creative.id === daypartingCreativeId) {
          return {
            ...creative,
            daypartingSchedule: schedule,
            dayparting: summarizeDayparting(schedule),
          }
        }
        return creative
      }),
    )

    setDaypartingDialogOpen(false)
    setDaypartingCreativeId(null)
  }

  // Custom button styles for outlined buttons
  const outlinedButtonStyle = {
    color: "#EF0078",
    borderColor: "#EF0078",
    "&:hover": {
      borderColor: "#EF0078",
      backgroundColor: "rgba(239, 0, 120, 0.1)",
    },
    "&.Mui-disabled": {
      borderColor: "#5D5D5D",
      color: "#5D5D5D",
    },
  }

  // Get min date for end date picker based on start date
  const getMinDate = (creativeId: number) => {
    const creative = creatives.find((c) => c.id === creativeId)
    return creative?.startDate ? new Date(creative.startDate) : null
  }

  // Get dayparting schedules for all creatives except the current one
  const getOtherDaypartingSchedules = (currentId: number) => {
    return creatives
      .filter((c) => c.id !== currentId && c.status && c.daypartingSchedule)
      .map((c) => c.daypartingSchedule as DaypartingSchedule)
  }

  const resetAllCustomWeights = () => {
    // Remove custom weight flags and original weights
    const updatedCreatives = creatives.map((creative) => ({
      ...creative,
      hasCustomWeight: false,
      originalWeight: undefined,
    }))

    // Redistribute weights evenly
    const redistributedCreatives = redistributeWeights(updatedCreatives)
    setCreatives(redistributedCreatives)
  }

  return (
    <div style={{ 
      display: "flex", 
      height: "100vh", 
      backgroundColor: "#000000", // Renamed bgcolor to backgroundColor
      overflow: "hidden", // Prevent overall overflow
    }}>
      <Sidebar />
      <Box sx={{ 
        flexGrow: 1, 
        display: "flex", 
        flexDirection: "column", 
        overflow: "visible",
        minWidth: 0, // Allow content to shrink below its minimum content size
      }}>
        {/* Header */}
        <AppBar
          position="static"
          sx={{
            boxShadow: "none",
            bgcolor: "#000000",
            zIndex: 1100,
          }}
        >
          <Toolbar
            sx={{
              minHeight: 144,
              bgcolor: "#000000",
              pr: 10,
              display: "flex",
              flexDirection: "column",  // Explicitly set column layout
              alignItems: "flex-end",  // Align items to the right side
              position: "relative",
            }}
          >
            {/* Notification icon in its own row */}
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "flex-end",
                mt: 2,
                mb: 3  // Add more bottom margin to create separation
              }}
            >
              <Tooltip title={hasNotifications ? "You have notifications" : "No notifications"}>
                <IconButton
                  color="inherit"
                  onClick={() => setHasNotifications(!hasNotifications)}
                  sx={{
                    color: hasNotifications ? "#EF0078" : "white",
                  }}
                >
                  <NotificationsOutlinedIcon
                    sx={{
                      color: hasNotifications ? "#EF0078" : "white",
                      ...(hasNotifications && { fontWeight: "bold" }),
                    }}
                  />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Line item title in its own row */}
            <Box
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                mb: 2,  // Add bottom margin
              }}
            >
              <Box
                sx={{
                  bgcolor: "#1e1e1e",
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mr: 1,
                }}
              >
                <KeyboardArrowDownIcon fontSize="small" />
              </Box>
              <ChevronRightIcon fontSize="small" sx={{ mx: 1 }} />
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {lineItemTitle}
              </Typography>
              <Tooltip title="Edit line item title">
                <IconButton
                  onClick={handleEditTitle}
                  size="small"
                  sx={{
                    ml: 1,
                    color: "white",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Edit Title Dialog */}
        <Dialog
          open={isEditingTitle}
          onClose={() => setIsEditingTitle(false)}
          PaperProps={{
            sx: {
              bgcolor: "#333333",
              color: "white",
              width: "500px",
              maxWidth: "90vw",
            },
          }}
        >
          <DialogTitle>Edit Line Item Title</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleSaveTitle()
                }
              }}
              sx={{
                mt: 2,
                "& .MuiOutlinedInput-root": {
                  color: "white",
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.5)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#EF0078",
                  },
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setIsEditingTitle(false)}
              sx={{
                color: "#EF0078",
                "&:hover": {
                  backgroundColor: "rgba(239, 0, 120, 0.1)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTitle}
              sx={{
                color: "white",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Main content */}
        <Box sx={{ flexGrow: 1, overflow: "auto", p: 3, pr: 10, pt: 4, maxHeight: "calc(100vh - 144px)", bgcolor: "#000000" }}>
          {/* Changed pt from default 3 (12px) to 16 (64px) to add 50px more space */}
          {/* Added 40px (pr: 10) to the right padding */}
          {/* Action buttons */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3, gap: 2 }}>
            <Tooltip title="Clone this line item to create a duplicate">
              <span style={{ display: "inline-block" }}>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#EF0078",
                    color: "black",
                    "&:hover": {
                      backgroundColor: "#ED005E",
                    },
                  }}
                >
                  Clone This Line Item
                </Button>
              </span>
            </Tooltip>
          </Box>
          {/* Line Item Details */}
          <Paper sx={{ mb: 4, bgcolor: "#121212" }}>
            <LineItemDetails
              id="18"
              defaultCreativeInfo={getDefaultCreativeInfo()}
              onDateSelect={handleLineItemDateSelect}
              onOpenDatePicker={(type, event) => {
                setLineItemDatePickerType(type)
                setLineItemDatePickerOpen(true)
                setLineItemDatePickerAnchorEl(event.currentTarget)
              }}
              startDate={lineItemStartDate}
              endDate={lineItemEndDate}
            />
          </Paper>
          {/* Creatives Section */}
          <Box sx={{ mb: 16 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Creatives
              </Typography>
              <Tooltip title="Add one or more creatives to this line item">
                <span style={{ display: "inline-block" }}>
                  <Button variant="outlined" onClick={() => setAddDialogOpen(true)} sx={outlinedButtonStyle}>
                    Add Creative
                  </Button>
                </span>
              </Tooltip>
            </Box>
            <TableContainer
              component={Paper}
              sx={{
                bgcolor: "transparent",
                background: "transparent",
                boxShadow: "none",
                border: "none",
                "& .MuiTable-root": {
                  borderCollapse: "collapse",
                  "& .MuiTableCell-root": {
                    borderBottom: "1px solid rgba(93, 93, 93, 0.3)",
                    padding: "12px 16px",
                  },
                  "& .MuiTableHead-root": {
                    "& .MuiTableCell-root": {
                      borderBottom: "1px solid #5d5d5d",
                      color: "#cdcdcd",
                    },
                  },
                  "& .MuiTableBody-root": {
                    "& .MuiTableRow-root:last-child .MuiTableCell-root": {
                      borderBottom: "none",
                    },
                  },
                },
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Creative ID</TableCell>
                    <TableCell>Playback Mode</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Start date</TableCell>
                    <TableCell>End date</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        Weighting
                        <Tooltip title="Reset all custom weights and distribute evenly">
                          <IconButton
                            size="small"
                            onClick={resetAllCustomWeights}
                            sx={{
                              color: "rgba(255, 255, 255, 0.7)",
                              "&:hover": {
                                color: "#EF0078",
                                backgroundColor: "rgba(239, 0, 120, 0.1)",
                              },
                            }}
                          >
                            <AutorenewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>Dayparting</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {creatives.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No creatives associated
                      </TableCell>
                    </TableRow>
                  ) : (
                    creatives.map((creative) => (
                      <TableRow key={creative.id}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Tooltip title="Delete creative">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDeleteDialog(creative.id)}
                                sx={{
                                  color: "rgba(255, 255, 255, 0.5)",
                                  "&:hover": {
                                    color: "#EF0078",
                                  },
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {creative.name}
                            {creative.isDefault && (
                              <Chip
                                label="Default"
                                size="small"
                                onClick={() => {
                                  // When clicking the Default chip, we're not deactivating any creative
                                  setNewDefaultCreativeId(null)
                                  setChangeDefaultDialogOpen(true)
                                }}
                                sx={{
                                  bgcolor: "#464646",
                                  color: "white",
                                  fontSize: "0.75rem",
                                  height: "24px",
                                  borderRadius: "16px",
                                  cursor: "pointer",
                                  "&:hover": {
                                    bgcolor: "#555555",
                                  },
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View creative details">
                            <Box
                              component="span"
                              sx={{
                                color: "#EF0078",
                                cursor: "pointer",
                                textDecoration: "none",
                                "&:hover": {
                                  textDecoration: "underline",
                                },
                              }}
                              onClick={() => {
                                // In a real system, this would navigate to the creative details page
                                console.log(`Navigate to creative ${creative.id} details`)
                              }}
                            >
                              {creative.id}
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{creative.playbackMode}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Tooltip title={creative.status ? "Set creative to inactive" : "Set creative to active"}>
                              <Checkbox
                                checked={creative.status}
                                onChange={(e) => handleStatusChange(creative.id, e.target.checked)}
                                sx={{
                                  color: "#EF0078",
                                  "&.Mui-checked": {
                                    color: "#EF0078",
                                  },
                                }}
                              />
                            </Tooltip>
                            Active
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Select start date for this creative">
                            <Button
                              variant="text"
                              size="small"
                              onClick={(event) => handleOpenDatePicker(creative.id, "start", event)}
                              sx={{
                                color: "white",
                                minWidth: "80px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 1,
                                padding: "4px 8px",
                                "&:hover": {
                                  backgroundColor: "rgba(239, 0, 120, 0.1)",
                                },
                              }}
                            >
                              {displayDate(creative.startDate)}
                              <CalendarMonthIcon sx={{ color: "#EF0078", fontSize: 18 }} />
                            </Button>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Select end date for this creative">
                            <Button
                              variant="text"
                              size="small"
                              onClick={(event) => handleOpenDatePicker(creative.id, "end", event)}
                              sx={{
                                color: "white",
                                minWidth: "80px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 1,
                                padding: "4px 8px",
                                "&:hover": {
                                  backgroundColor: "rgba(239, 0, 120, 0.1)",
                                },
                              }}
                            >
                              {displayDate(creative.endDate)}
                              <CalendarMonthIcon sx={{ color: "#EF0078", fontSize: 18 }} />
                            </Button>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <CreativeWeighting
                            id={creative.id}
                            weighting={creative.weighting}
                            status={creative.status}
                            isOnlyActive={creatives.filter((c) => c.status).length === 1}
                            hasCustomWeight={creative.hasCustomWeight || false}
                            onWeightChange={handleWeightChange}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Configure dayparting schedule for this creative">
                            <Button
                              variant="text"
                              size="small"
                              onClick={() => handleOpenDaypartingDialog(creative.id)}
                              sx={{
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                padding: "4px 8px",
                                "&:hover": {
                                  backgroundColor: "rgba(239, 0, 120, 0.1)",
                                },
                              }}
                            >
                              <Box sx={{ minWidth: '70px', textAlign: 'left' }}>
                                {creative.dayparting}
                              </Box>
                              <AccessTimeIcon sx={{ color: "#EF0078", fontSize: 24 }} />
                            </Button>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          {/* Distributions Section */}
          <Box sx={{ mb: 16 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Distributions
              </Typography>
              <Stack direction="row" spacing={2}>
                <Tooltip title="Add a new distribution tag">
                  <Button variant="outlined" sx={outlinedButtonStyle}>
                    Add Distribution Tag
                  </Button>
                </Tooltip>
                <Tooltip title="Export all distribution tags">
                  <Button variant="outlined" sx={outlinedButtonStyle}>
                    Export Distribution Tags
                  </Button>
                </Tooltip>
              </Stack>
            </Box>
            <TableContainer
              component={Paper}
              sx={{
                bgcolor: "transparent",
                background: "transparent",
                boxShadow: "none",
                border: "none",
                "& .MuiTable-root": {
                  borderCollapse: "collapse",
                  "& .MuiTableCell-root": {
                    borderBottom: "1px solid rgba(93, 93, 93, 0.3)",
                    padding: "12px 16px",
                  },
                  "& .MuiTableHead-root": {
                    "& .MuiTableCell-root": {
                      borderBottom: "1px solid #5d5d5d",
                      color: "#cdcdcd",
                    },
                  },
                  "& .MuiTableBody-root": {
                    "& .MuiTableRow-root:last-child .MuiTableCell-root": {
                      borderBottom: "none",
                    },
                  },
                },
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Distribution Tag</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>test pcta</TableCell>
                    <TableCell>https://radius.video/v1/distributions/7097?line-item-id=18</TableCell>
                    <TableCell align="right">
                      <Tooltip title="More options">
                        <IconButton size="small">
                          <MoreHorizIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          {/* Pixels Section */}
          <Box sx={{ mb: 8 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Pixels
              </Typography>
              <Stack direction="row" spacing={2}>
                <Tooltip title="Import pixels from external source">
                  <Button variant="outlined" sx={outlinedButtonStyle}>
                    Import Pixels
                  </Button>
                </Tooltip>
                <Tooltip title="Export CSV template for pixels">
                  <Button variant="outlined" sx={outlinedButtonStyle}>
                    Export CSV Template
                  </Button>
                </Tooltip>
                <Tooltip title="Link existing event pixels">
                  <Button variant="outlined" sx={outlinedButtonStyle}>
                    Link Event Pixels
                  </Button>
                </Tooltip>
                <Tooltip title="Create a new event pixel">
                  <Button variant="outlined" sx={outlinedButtonStyle}>
                    Create Event Pixel
                  </Button>
                </Tooltip>
              </Stack>
            </Box>
            <TableContainer
              component={Paper}
              sx={{
                bgcolor: "transparent",
                background: "transparent",
                boxShadow: "none",
                border: "none",
                "& .MuiTable-root": {
                  borderCollapse: "collapse",
                  "& .MuiTableCell-root": {
                    borderBottom: "1px solid rgba(93, 93, 93, 0.3)",
                    padding: "12px 16px",
                  },
                  "& .MuiTableHead-root": {
                    "& .MuiTableCell-root": {
                      borderBottom: "1px solid #5d5d5d",
                      color: "#cdcdcd",
                    },
                  },
                  "& .MuiTableBody-root": {
                    "& .MuiTableRow-root:last-child .MuiTableCell-root": {
                      borderBottom: "none",
                    },
                  },
                },
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Event Types</TableCell>
                    <TableCell>Pixel URL</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>test pcta</TableCell>
                    <TableCell>test pcta</TableCell>
                    <TableCell>https://radius.video/v1/distributions/7097?line-item-id=18</TableCell>
                    <TableCell align="right">
                      <Tooltip title="More options">
                        <IconButton size="small">
                          <MoreHorizIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </Box>

      {/* Add Creative Dialog */}
      <AddCreativeDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAdd={handleAddCreative}
        options={creativeOptions.filter((option) => !creatives.some((creative) => creative.id === option.id))}
      />

      {/* Date Picker Dialog */}
      {datePickerOpen && selectedCreativeId !== null && (
        <DatePickerDialog
          open={datePickerOpen}
          onClose={handleCloseDatePicker}
          onSelect={handleDateSelect}
          initialDate={
            datePickerType === "start"
              ? creatives.find((c) => c.id === selectedCreativeId)?.startDate
                ? new Date(creatives.find((c) => c.id === selectedCreativeId)!.startDate)
                : new Date()
              : creatives.find((c) => c.id === selectedCreativeId)?.endDate
                ? new Date(creatives.find((c) => c.id === selectedCreativeId)!.endDate)
                : new Date()
          }
          minDate={datePickerType === "end" ? getMinDate(selectedCreativeId!) : null}
          title={`Select ${datePickerType === "start" ? "Start" : "End"} Date`}
          anchorEl={datePickerAnchorEl}
        />
      )}

      {/* Dayparting Dialog */}
      {daypartingDialogOpen && daypartingCreativeId !== null && (
        <DaypartingDialog
          open={daypartingDialogOpen}
          onClose={() => {
            setDaypartingDialogOpen(false)
            setDaypartingCreativeId(null)
          }}
          onSave={handleSaveDayparting}
          initialSchedule={creatives.find((c) => c.id === daypartingCreativeId)?.daypartingSchedule}
          existingSchedules={getOtherDaypartingSchedules(daypartingCreativeId)}
          currentCreativeId={daypartingCreativeId}
          defaultTimezone={lastSelectedTimezone}
        />
      )}

      {/* Change Default Creative Dialog */}
      <ChangeDefaultCreativeDialog
        open={changeDefaultDialogOpen}
        onClose={() => {
          setChangeDefaultDialogOpen(false)
          setNewDefaultCreativeId(null)
          setDeleteAfterChangeDefault(false)
          setCreativeToDelete(null)
        }}
        onChangeDefault={handleChangeDefault}
        options={creatives}
        creativeToDeactivate={newDefaultCreativeId}
        isForDeletion={deleteAfterChangeDefault}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: "#383838",
            background: "#383838",
            backgroundColor: "#383838",
            color: "white",
            width: "400px",
            maxWidth: "90vw",
          },
        }}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "rgba(255, 255, 255, 0.7)" }}>
            Are you sure you want to delete this creative? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: "#EF0078",
              "&:hover": {
                backgroundColor: "rgba(239, 0, 120, 0.1)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteCreative}
            sx={{
              color: "white",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Line Item Date Picker Dialog */}
      {lineItemDatePickerOpen && (
        <DatePickerDialog
          open={lineItemDatePickerOpen}
          onClose={() => {
            setLineItemDatePickerOpen(false)
            setLineItemDatePickerAnchorEl(null)
          }}
          onSelect={(date) => handleLineItemDateSelect(lineItemDatePickerType, date)}
          initialDate={
            lineItemDatePickerType === "lineItemStart"
              ? lineItemStartDate
                ? new Date(lineItemStartDate)
                : new Date()
              : lineItemEndDate
                ? new Date(lineItemEndDate)
                : new Date()
          }
          minDate={lineItemDatePickerType === "lineItemEnd" && lineItemStartDate ? new Date(lineItemStartDate) : null}
          title={`Select ${lineItemDatePickerType === "lineItemStart" ? "Start" : "End"} Date`}
          anchorEl={lineItemDatePickerAnchorEl}
        />
      )}
    </div>
  );
}

