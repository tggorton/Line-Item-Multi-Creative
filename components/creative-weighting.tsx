"use client"

import { useState } from "react"
import Box from "@mui/material/Box"
import TextField from "@mui/material/TextField"
import IconButton from "@mui/material/IconButton"
import Typography from "@mui/material/Typography"
import Tooltip from "@mui/material/Tooltip"
import PercentIcon from "@mui/icons-material/Percent"

interface CreativeWeightingProps {
  id: number
  weighting: number
  status: boolean
  isOnlyActive: boolean
  hasCustomWeight: boolean
  onWeightChange: (id: number, value: string) => void
}

export function CreativeWeighting({
  id,
  weighting,
  status,
  isOnlyActive,
  hasCustomWeight,
  onWeightChange,
}: CreativeWeightingProps) {
  const [isEditing, setIsEditing] = useState(false)

  // If creative is inactive, show empty state
  if (!status) {
    return (
      <Tooltip title="Inactive creatives have no weight">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            color: "rgba(255, 255, 255, 0.5)",
          }}
        >
          - <PercentIcon fontSize="small" sx={{ color: "rgba(239, 0, 120, 0.5)", ml: 0.5 }} />
        </Box>
      </Tooltip>
    )
  }

  // If only one active creative, show static 100%
  if (isOnlyActive) {
    return (
      <Tooltip title="Single active creatives always have 100% weight">
        <Typography
          variant="body1"
          sx={{
            display: "flex",
            alignItems: "center",
            color: "white",
          }}
        >
          100 <PercentIcon fontSize="small" sx={{ color: "#EF0078", ml: 0.5 }} />
        </Typography>
      </Tooltip>
    )
  }

  // For multiple active creatives, show editable value with up/down buttons
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          backgroundColor: isEditing ? "#1e1e1e" : "transparent",
          borderRadius: "4px",
          padding: "4px 8px",
          gap: 2,
          "&:hover": {
            backgroundColor: "#1e1e1e",
          },
        }}
      >
        <TextField
          value={weighting}
          onChange={(e) => {
            const value = e.target.value
            if (value === "" || /^\d+$/.test(value)) {
              onWeightChange(id, value)
            }
          }}
          onFocus={() => setIsEditing(true)}
          onBlur={(e) => {
            // Only clear editing state if we're not clicking the arrows
            const target = e.relatedTarget as HTMLElement
            if (!target?.closest("[data-arrow-controls]")) {
              setIsEditing(false)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              setIsEditing(false)
            } else if (e.key === "ArrowUp") {
              e.preventDefault()
              const newValue = Math.min(100, weighting + 1)
              onWeightChange(id, newValue.toString())
            } else if (e.key === "ArrowDown") {
              e.preventDefault()
              const newValue = Math.max(0, weighting - 1)
              onWeightChange(id, newValue.toString())
            }
          }}
          type="number"
          inputProps={{
            min: 0,
            max: 100,
            style: {
              textAlign: "center",
              color: "white",
              width: "32px",
              MozAppearance: "textfield",
            },
            "aria-label": "Creative weight percentage",
          }}
          sx={{
            width: "48px",
            "& .MuiInputBase-root": {
              backgroundColor: "transparent",
              height: "32px",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              border: "none",
            },
            "& .MuiInputBase-input": {
              padding: "4px",
              "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
                WebkitAppearance: "none",
              },
            },
          }}
        />
        {isEditing && (
          <Box
            data-arrow-controls
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "32px",
              justifyContent: "space-between",
            }}
          >
            <IconButton
              size="small"
              onMouseDown={(e) => e.preventDefault()} // Prevent input blur
              onClick={() => {
                const newValue = Math.min(100, weighting + 1)
                onWeightChange(id, newValue.toString())
              }}
              sx={{
                padding: 0,
                minWidth: "16px",
                minHeight: "16px",
                color: "white",
                "&:hover": {
                  backgroundColor: "transparent",
                  color: "#EF0078",
                },
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 0,
                  height: 0,
                  borderLeft: "4px solid transparent",
                  borderRight: "4px solid transparent",
                  borderBottom: "4px solid currentColor",
                }}
              />
            </IconButton>
            <IconButton
              size="small"
              onMouseDown={(e) => e.preventDefault()} // Prevent input blur
              onClick={() => {
                const newValue = Math.max(0, weighting - 1)
                onWeightChange(id, newValue.toString())
              }}
              sx={{
                padding: 0,
                minWidth: "16px",
                minHeight: "16px",
                color: "white",
                "&:hover": {
                  backgroundColor: "transparent",
                  color: "#EF0078",
                },
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 0,
                  height: 0,
                  borderLeft: "4px solid transparent",
                  borderRight: "4px solid transparent",
                  borderTop: "4px solid currentColor",
                }}
              />
            </IconButton>
          </Box>
        )}
        <PercentIcon
          fontSize="small"
          sx={{
            color: "#EF0078",
            fontSize: "16px",
            pointerEvents: "none",
          }}
        />
      </Box>
    </Box>
  )
}

