"use client"

import { useState } from "react"
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import DialogActions from "@mui/material/DialogActions"
import Button from "@mui/material/Button"
import Autocomplete from "@mui/material/Autocomplete"
import TextField from "@mui/material/TextField"
import Box from "@mui/material/Box"
import FormControl from "@mui/material/FormControl"

interface ChangeDefaultCreativeDialogProps {
  open: boolean
  onClose: () => void
  onChangeDefault: (creativeId: number) => void
  options: { id: number; name: string; status?: boolean; isDefault?: boolean }[]
  creativeToDeactivate?: number | null
  isForDeletion?: boolean
}

export function ChangeDefaultCreativeDialog({
  open,
  onClose,
  onChangeDefault,
  options,
  creativeToDeactivate,
  isForDeletion = false,
}: ChangeDefaultCreativeDialogProps) {
  const [selectedCreativeId, setSelectedCreativeId] = useState<number | null>(null)

  // Update the filtering logic in the ChangeDefaultCreativeDialog component

  // Find the filteredOptions definition and update it:
  // Filter out:
  // 1. The creative that's being deactivated (if any)
  // 2. Any inactive creatives
  // 3. The current default creative (when not deactivating)
  const filteredOptions = options.filter((option) => {
    // Always filter out inactive creatives
    if (option.status === false) return false

    // Filter out the creative being deactivated (if any)
    if (creativeToDeactivate !== null && option.id === creativeToDeactivate) return false

    // If we're not deactivating a creative (just changing default),
    // filter out the current default
    if (creativeToDeactivate === null && option.isDefault === true) return false

    return true
  })

  const handleClose = () => {
    setSelectedCreativeId(null)
    onClose()
  }

  const handleChangeDefault = () => {
    if (selectedCreativeId) {
      onChangeDefault(selectedCreativeId)
      setSelectedCreativeId(null)
    }
  }

  // Get the name of the creative being deactivated
  const deactivatingCreativeName = creativeToDeactivate
    ? options.find((c) => c.id === creativeToDeactivate)?.name
    : null

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          bgcolor: "#383838 !important",
          background: "#383838 !important",
          backgroundColor: "#383838 !important",
          color: "white",
          width: "500px",
          maxWidth: "90vw",
          borderRadius: "8px",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, fontSize: "18px", fontWeight: 500 }}>
        {isForDeletion
          ? `Select New Default Creative (Current Default Will Be Deleted)`
          : deactivatingCreativeName
            ? `Select New Default Creative (${deactivatingCreativeName} will be deactivated)`
            : "Change Default Creative"}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ mt: 1 }}>
          <FormControl fullWidth variant="outlined">
            <Autocomplete
              options={filteredOptions}
              getOptionLabel={(option) => option.name}
              value={filteredOptions.find((c) => c.id === selectedCreativeId) || null}
              onChange={(_, newValue) => setSelectedCreativeId(newValue ? newValue.id : null)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Creative"
                  placeholder={!selectedCreativeId ? "Search to Select" : ""}
                  variant="outlined"
                  fullWidth
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && selectedCreativeId) {
                      e.preventDefault()
                      handleChangeDefault()
                    }
                  }}
                  sx={{
                    "& .MuiInputLabel-root": {
                      backgroundColor: "#383838 !important",
                      padding: "0 8px !important",
                      marginLeft: "-4px !important",
                      marginRight: "-4px !important",
                      borderRadius: "4px !important",
                    },
                    "& .MuiOutlinedInput-notchedOutline legend": {
                      width: "0 !important",
                    },
                  }}
                  InputLabelProps={{
                    shrink: true,
                    sx: {
                      color: "rgba(255, 255, 255, 0.7)",
                      "&.Mui-focused": {
                        color: "#EF0078",
                      },
                      fontSize: "14px",
                      position: "absolute",
                      top: 0,
                      left: 0,
                      transform: "translate(14px, -6px) scale(0.75)",
                      transformOrigin: "top left",
                      zIndex: 10,
                    },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    sx: {
                      color: "white",
                      "&::placeholder": {
                        color: "white",
                        opacity: 1,
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255, 255, 255, 0.3)",
                        borderWidth: "1px",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255, 255, 255, 0.5)",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#EF0078",
                        borderWidth: "2px",
                      },
                      "& input::placeholder": {
                        color: "white",
                        opacity: 1,
                      },
                    },
                  }}
                />
              )}
              sx={{
                "& .MuiAutocomplete-endAdornment": {
                  color: "white",
                },
                "& .MuiAutocomplete-clearIndicator": {
                  color: "rgba(255, 255, 255, 0.7)",
                  "&:hover": {
                    color: "white",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                },
                "& .MuiAutocomplete-popupIndicator": {
                  color: "rgba(255, 255, 255, 0.7)",
                  "&:hover": {
                    color: "white",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                },
              }}
              ListboxProps={{
                style: {
                  backgroundColor: "#383838", // Ensure dropdown matches
                },
              }}
            />
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          sx={{
            color: "#EF0078",
            fontWeight: 500,
            textTransform: "uppercase",
            "&:hover": {
              backgroundColor: "rgba(239, 0, 120, 0.1)",
            },
          }}
        >
          CANCEL
        </Button>
        <Button
          onClick={handleChangeDefault}
          disabled={!selectedCreativeId}
          sx={{
            color: "white",
            fontWeight: 500,
            textTransform: "uppercase",
            opacity: !selectedCreativeId ? 0.5 : 1,
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          {isForDeletion ? "CONTINUE TO DELETE" : "CHANGE DEFAULT"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

