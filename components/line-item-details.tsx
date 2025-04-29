"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"
import TextField from "@mui/material/TextField"
import Button from "@mui/material/Button"
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth"
import EditIcon from "@mui/icons-material/Edit"
import IconButton from "@mui/material/IconButton"
import Tooltip from "@mui/material/Tooltip"
import Paper from "@mui/material/Paper"
import ClickAwayListener from "@mui/material/ClickAwayListener"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"

interface LineItemDetailsProps {
  id: string
  defaultCreativeInfo: {
    name: string | null
    thumbnailUrl: string | null
  }
  onDateSelect: (type: "lineItemStart" | "lineItemEnd", date: Date) => void
  onOpenDatePicker: (type: "lineItemStart" | "lineItemEnd", event: React.MouseEvent<HTMLElement>) => void // Updated to include event
  startDate?: string
  endDate?: string
}

// Status options
const STATUS_OPTIONS = ["Active", "Inactive", "Test", "Pending", "Deleted"]

export function LineItemDetails({
  id,
  defaultCreativeInfo,
  onDateSelect,
  onOpenDatePicker,
  startDate = "2025/03/01",
  endDate = "2025/05/31",
}: LineItemDetailsProps) {
  // State for editable fields
  const [status, setStatus] = useState("Active")
  const [rate, setRate] = useState("0")
  const [impressionBudget, setImpressionBudget] = useState("0")
  const [reverseWrapTag, setReverseWrapTag] = useState("<not assigned>")
  const [thirdPartyTag, setThirdPartyTag] = useState("<not assigned>")
  const [externalName, setExternalName] = useState("<not assigned>")

  // State to track which fields are being edited
  const [editingField, setEditingField] = useState<string | null>(null)

  // State for custom dropdown
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const statusRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle status selection
  const handleStatusSelect = (newStatus: string) => {
    console.log("Status selected:", newStatus)
    setStatus(newStatus)
    setStatusDropdownOpen(false)
    setEditingField(null)
  }

  // Helper function to format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "SELECT"
    try {
      const date = new Date(dateStr)
      // Format as M/D/YYYY to match the requested format
      const month = date.getMonth() + 1 // getMonth() is zero-based
      const day = date.getDate()
      const year = date.getFullYear()
      return `${month}/${day}/${year}`
    } catch (e) {
      return "SELECT"
    }
  }

  // Helper to render editable text field
  const renderEditableField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    type = "text",
    startAdornment?: React.ReactNode,
  ) => (
    <Grid item xs={3} sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {editingField === label ? (
          <TextField
            fullWidth
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setEditingField(null)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setEditingField(null)
              }
            }}
            autoFocus
            InputProps={{
              startAdornment: startAdornment,
              sx: {
                color: "white",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.3)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#EF0078",
                },
              },
            }}
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                cursor: "pointer",
                "&:hover": { color: "#EF0078" },
                marginRight: 0.5,
              }}
              onClick={() => setEditingField(label)}
            >
              {startAdornment}
              {value}
            </Typography>
            <Tooltip title={`Edit ${label.toLowerCase()}`}>
              <IconButton
                size="small"
                onClick={() => setEditingField(label)}
                aria-label={`Edit ${label.toLowerCase()}`}
                sx={{
                  color: "rgba(255, 255, 255, 0.5)",
                  "&:hover": {
                    color: "#EF0078",
                  },
                  padding: "2px",
                  marginLeft: "2px",
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Grid>
  )

  // Custom status dropdown component
  const renderCustomStatusDropdown = () => (
    <Grid item xs={3} sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary">
        Status
      </Typography>
      <Box ref={statusRef} sx={{ position: "relative" }}>
        {editingField === "Status" ? (
          <ClickAwayListener onClickAway={() => setEditingField(null)}>
            <Box>
              <Box
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "4px",
                  backgroundColor: "#333333",
                  color: "white",
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: "rgba(255, 255, 255, 0.5)",
                  },
                }}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={statusDropdownOpen}
                aria-label="Select status"
              >
                <Typography>{status}</Typography>
                <KeyboardArrowDownIcon />
              </Box>

              {statusDropdownOpen && (
                <Paper
                  sx={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    mt: 1,
                    bgcolor: "#333333",
                    zIndex: 1000,
                    boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <Box
                      key={option}
                      onClick={() => handleStatusSelect(option)}
                      sx={{
                        padding: "10px 12px",
                        color: "white",
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: "rgba(239, 0, 120, 0.1)",
                        },
                        ...(option === status && {
                          bgcolor: "rgba(239, 0, 120, 0.2)",
                          "&:hover": {
                            bgcolor: "rgba(239, 0, 120, 0.3)",
                          },
                        }),
                      }}
                      role="option"
                      aria-selected={option === status}
                    >
                      {option}
                    </Box>
                  ))}
                </Paper>
              )}
            </Box>
          </ClickAwayListener>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              cursor: "pointer",
              "&:hover": { color: "#EF0078" },
            }}
            onClick={() => setEditingField("Status")}
            role="button"
            aria-label="Edit status"
          >
            <Typography
              variant="body1"
              sx={{
                marginRight: 0.5,
              }}
            >
              {status}
            </Typography>
            <Tooltip title="Edit status">
              <IconButton
                size="small"
                aria-label="Edit status"
                sx={{
                  color: "rgba(255, 255, 255, 0.5)",
                  "&:hover": {
                    color: "#EF0078",
                  },
                  padding: "2px",
                  marginLeft: "2px",
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Grid>
  )

  // Log when default creative info changes
  useEffect(() => {
    console.log("Default creative info updated:", defaultCreativeInfo)
  }, [defaultCreativeInfo])

  return (
    <Box sx={{ p: 6 }}>
      <Grid container spacing={4}>
        {/* Read-only Line Item ID */}
        <Grid item xs={3} sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Line Item ID
          </Typography>
          <Typography variant="body1">{id}</Typography>
        </Grid>

        {/* Status with custom dropdown */}
        {renderCustomStatusDropdown()}

        {/* Start Date */}
        <Grid item xs={3} sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Start Date
          </Typography>
          <Tooltip title="Select start date">
            <Button
              variant="text"
              size="small"
              onClick={(event) => onOpenDatePicker("lineItemStart", event)}
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
              {formatDate(startDate)}
              <CalendarMonthIcon sx={{ color: "#EF0078", fontSize: 18 }} />
            </Button>
          </Tooltip>
        </Grid>

        {/* End Date */}
        <Grid item xs={3} sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            End Date
          </Typography>
          <Tooltip title="Select end date">
            <Button
              variant="text"
              size="small"
              onClick={(event) => onOpenDatePicker("lineItemEnd", event)}
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
              {formatDate(endDate)}
              <CalendarMonthIcon sx={{ color: "#EF0078", fontSize: 18 }} />
            </Button>
          </Tooltip>
        </Grid>

        {/* Rate */}
        {renderEditableField("Rate", rate, setRate, "number", <span style={{ marginRight: "4px" }}>$</span>)}

        {/* Impression Budget */}
        {renderEditableField("Impression Budget", impressionBudget, setImpressionBudget, "number")}

        {/* Reverse Wrap Tag */}
        {renderEditableField("Reverse Wrap Tag", reverseWrapTag, setReverseWrapTag)}

        {/* 3rd Party Tag */}
        {renderEditableField("3rd Party Tag", thirdPartyTag, setThirdPartyTag)}

        {/* External Name */}
        {renderEditableField("External Name", externalName, setExternalName)}

        {/* Read-only Type */}
        <Grid item xs={3} sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Type
          </Typography>
          <Typography variant="body1">video</Typography>
        </Grid>

        {/* Dynamic Creative (based on default creative) */}
        <Grid item xs={3} sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Creative
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="body1">{defaultCreativeInfo.name || "<no creative assigned>"}</Typography>
            {defaultCreativeInfo.name && (
              <Tooltip title="View creative details">
                <Box
                  onClick={() => {
                    // In a real system, this would navigate to the creative details page
                    console.log(`Navigate to creative details for ${defaultCreativeInfo.name}`)
                  }}
                  sx={{
                    width: "90px",
                    height: "50px",
                    bgcolor: "#2a2a2a",
                    borderRadius: "4px",
                    overflow: "hidden",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "scale(1.05)",
                      boxShadow: "0 0 8px rgba(239, 0, 120, 0.6)",
                      "& img": {
                        opacity: 0.9,
                      },
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={defaultCreativeInfo.thumbnailUrl || "/placeholder.svg?height=50&width=90"}
                    alt="Creative thumbnail"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "opacity 0.2s",
                    }}
                  />
                </Box>
              </Tooltip>
            )}
          </Box>
        </Grid>

        {/* Read-only Creative Playback Version */}
        <Grid item xs={3} sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Creative Playback Version
          </Typography>
          <Typography variant="body1">CTV</Typography>
        </Grid>
      </Grid>
    </Box>
  )
}

