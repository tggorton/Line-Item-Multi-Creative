import React, { useState, useEffect, useCallback, useRef } from "react"

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
import { LineItemDetails } from "./line-item-details"
import { DatePickerDialog } from "./date-picker-dialog"

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
  weighting: number
  hasCustomWeight?: boolean
  originalWeight?: number
  thumbnailUrl?: string
}

// Find the redistributeWeights function and replace it with this improved version:

const redistributeWeights = (updatedCreatives: Creative[]) => {
  // Get active creatives
  const activeCreatives = updatedCreatives.filter((c) => c.status)

  // If no active creatives, return as is
  if (activeCreatives.length === 0) return updatedCreatives

  // If only one active creative, set its weight to 100% and status to true
  if (activeCreatives.length === 1) {
    return updatedCreatives.map((creative) => (creative.id === activeCreatives[0].id ? { ...creative, weighting: 100, status: true } : creative))
  }

  // Get creatives with custom weights
  const customWeightedCreatives = activeCreatives.filter((c) => c.hasCustomWeight)
  const nonCustomCreatives = activeCreatives.filter((c) => !c.hasCustomWeight)

  // If no custom weights, distribute evenly with improved logic
  if (customWeightedCreatives.length === 0) {
    // Remove isDefault logic from sorting
    const sortedCreatives = [...activeCreatives].sort((a, b) => a.id - b.id) // Sort by ID for consistency

    // Calculate base weight and remainder
    const baseWeight = Math.floor(100 / activeCreatives.length)
    const remainder = 100 - baseWeight * activeCreatives.length

    // Create a map to track which creatives get extra weight
    const extraWeightMap = new Map<number, boolean>()

    // Distribute the remainder among the first 'remainder' sorted creatives
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
      // Calculate base weight and remainder
      const baseWeight = Math.floor(remainingWeight / nonCustomCreatives.length)
      const remainder = remainingWeight - baseWeight * nonCustomCreatives.length

      // Sort non-custom creatives by ID for consistency
      const sortedNonCustom = [...nonCustomCreatives].sort((a, b) => a.id - b.id);


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
  else if (totalCustomWeight < 100 && customWeightedCreatives.length > 0) { // Check length > 0
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

  // Add state for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [creativeToDelete, setCreativeToDelete] = useState<number | null>(null)

  // Keep line item dates for the top box, but remove handlers tied to specific creatives
  const [lineItemStartDate, setLineItemStartDate] = useState("2025/03/01") // March 1, 2025
  const [lineItemEndDate, setLineItemEndDate] = useState("2025/05/31") // May 31, 2025
  const [lineItemDatePickerOpen, setLineItemDatePickerOpen] = useState(false)
  const [lineItemDatePickerType, setLineItemDatePickerType] = useState<"lineItemStart" | "lineItemEnd">("lineItemStart")
  const [lineItemDatePickerAnchorEl, setLineItemDatePickerAnchorEl] = useState<HTMLElement | null>(null)

  // Handler for line item date picker (keep this for the top box)
  const handleLineItemDateSelect = (type: "lineItemStart" | "lineItemEnd", date: Date) => {
    // Simple helper to format date YYYY-MM-DD
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const formattedDate = formatDate(date);
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

  // Update the getDefaultCreativeInfo function to get the FIRST creative info
  // Keep original name to match prop expected by LineItemDetails
  const getDefaultCreativeInfo = () => {
    const firstCreative = creatives.length > 0 ? creatives[0] : null;
    return firstCreative
      ? {
          name: firstCreative.name,
          thumbnailUrl: firstCreative.thumbnailUrl || null,
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

  // Handle opening delete dialog (simplified - no default check)
  const handleOpenDeleteDialog = (id: number) => {
    // Directly open delete confirmation
    setCreativeToDelete(id)
    setDeleteDialogOpen(true)
  }

  // Handle delete creative (simplified - no default handling)
  const handleDeleteCreative = () => {
    if (creativeToDelete === null) return

    // Remove the creative
    setCreatives((prevCreatives) => prevCreatives.filter((c) => c.id !== creativeToDelete))

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
    // Create new creatives with default weights
    const newCreatives = selectedCreatives.map((creative, index) => ({
      id: creative.id,
      name: creative.label,
      playbackMode: "CTV",
      status: true, // Default status is true
      weighting: 0, // Will be calculated in redistributeWeights
      hasCustomWeight: false, // Initialize with no custom weight
      thumbnailUrl: `/placeholder.svg?height=34&width=60&text=${encodeURIComponent(creative.label)}`,
    }))

    // Add new creatives and redistribute weights
    const updatedCreatives = redistributeWeights([...creatives, ...newCreatives])

    setCreatives(updatedCreatives)
    setAddDialogOpen(false)
  }

  const handleStatusChange = (id: number, checked: boolean) => {
    // Prevent deactivating the last remaining creative
    if (!checked && creatives.length === 1) {
      alert("Cannot deactivate the only remaining creative.");
      return;
    }

    // Update the status of the creative
    let updatedCreatives = creatives.map((creative) => {
      if (creative.id === id) {
        return { ...creative, status: checked }
      }
      return creative
    })

    updatedCreatives = redistributeWeights(updatedCreatives);

    setCreatives(updatedCreatives)
  }

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

      // Check if there's only one creative after potential changes
      const activeCreativesAfterUpdate = updatedCreatives.filter(c => c.status);
      if (activeCreativesAfterUpdate.length === 1) {
          updatedCreatives = updatedCreatives.map(c => c.id === activeCreativesAfterUpdate[0].id ? { ...c, weighting: 100, status: true } : c);
      } else {
          // If multiple active, just ensure redistribution
          updatedCreatives = redistributeWeights(updatedCreatives);
      }

      // Set the updated creatives
      setCreatives(updatedCreatives)
    } finally {
      isUpdatingWeights.current = false
    }
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
                  <Button variant="outlined" onClick={() => setAddDialogOpen(true)} sx={{
                     color: "#EF0078",
                     borderColor: "#EF0078",
                     "&:hover": {
                       borderColor: "#EF0078",
                       backgroundColor: "rgba(239, 0, 120, 0.1)",
                     },
                   }}>
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
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        Weighting
                        <Tooltip title="Reset all custom weights and distribute evenly">
                          <IconButton
                            size="small"
                            onClick={resetAllCustomWeights}
                            disabled={creatives.length <= 1}
                            sx={{
                              color: "rgba(255, 255, 255, 0.7)",
                              "&:hover": {
                                color: "#EF0078",
                                backgroundColor: "rgba(239, 0, 120, 0.1)",
                              },
                              "&.Mui-disabled": {
                                color: "rgba(255, 255, 255, 0.3)",
                                pointerEvents: "none"
                              },
                            }}
                          >
                            <AutorenewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {creatives.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
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
                            <Tooltip title={creatives.length === 1 ? "Status cannot be changed for single creative" : (creative.status ? "Set creative to inactive" : "Set creative to active")}>
                              <span>
                               <Checkbox
                                checked={creative.status}
                                onChange={(e) => handleStatusChange(creative.id, e.target.checked)}
                                disabled={creatives.length === 1}
                                sx={{
                                  color: "#EF0078",
                                  "&.Mui-checked": {
                                    color: "#EF0078",
                                  },
                                  "&.Mui-disabled": {
                                     color: "rgba(239, 0, 120, 0.3)"
                                   }
                                }}
                               />
                              </span>
                            </Tooltip>
                            Active
                          </Box>
                        </TableCell>
                        <TableCell sx={{ 
                          // Apply opacity directly to the cell if disabled
                          ...(creatives.length === 1 && { opacity: 0.5, pointerEvents: 'none' })
                        }}>
                          <CreativeWeighting
                            id={creative.id}
                            weighting={creative.weighting}
                            status={creative.status}
                            isOnlyActive={creatives.filter((c) => c.status).length === 1}
                            hasCustomWeight={creative.hasCustomWeight || false}
                            onWeightChange={handleWeightChange}
                          />
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
                  <Button variant="outlined" sx={{
                    color: "#EF0078",
                    borderColor: "#EF0078",
                    "&:hover": {
                      borderColor: "#EF0078",
                      backgroundColor: "rgba(239, 0, 120, 0.1)",
                    },
                  }}>
                    Add Distribution Tag
                  </Button>
                </Tooltip>
                <Tooltip title="Export all distribution tags">
                  <Button variant="outlined" sx={{
                    color: "#EF0078",
                    borderColor: "#EF0078",
                    "&:hover": {
                      borderColor: "#EF0078",
                      backgroundColor: "rgba(239, 0, 120, 0.1)",
                    },
                  }}>
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
                  <Button variant="outlined" sx={{
                    color: "#EF0078",
                    borderColor: "#EF0078",
                    "&:hover": {
                      borderColor: "#EF0078",
                      backgroundColor: "rgba(239, 0, 120, 0.1)",
                    },
                  }}>
                    Import Pixels
                  </Button>
                </Tooltip>
                <Tooltip title="Export CSV template for pixels">
                  <Button variant="outlined" sx={{
                    color: "#EF0078",
                    borderColor: "#EF0078",
                    "&:hover": {
                      borderColor: "#EF0078",
                      backgroundColor: "rgba(239, 0, 120, 0.1)",
                    },
                  }}>
                    Export CSV Template
                  </Button>
                </Tooltip>
                <Tooltip title="Link existing event pixels">
                  <Button variant="outlined" sx={{
                    color: "#EF0078",
                    borderColor: "#EF0078",
                    "&:hover": {
                      borderColor: "#EF0078",
                      backgroundColor: "rgba(239, 0, 120, 0.1)",
                    },
                  }}>
                    Link Event Pixels
                  </Button>
                </Tooltip>
                <Tooltip title="Create a new event pixel">
                  <Button variant="outlined" sx={{
                    color: "#EF0078",
                    borderColor: "#EF0078",
                    "&:hover": {
                      borderColor: "#EF0078",
                      backgroundColor: "rgba(239, 0, 120, 0.1)",
                    },
                  }}>
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
    </div>
  );
}

