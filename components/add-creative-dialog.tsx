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
import Chip from "@mui/material/Chip"

interface AddCreativeDialogProps {
  open: boolean
  onClose: () => void
  onAdd: (creatives: any[]) => void
  options: { id: number; label: string }[]
}

export function AddCreativeDialog({ open, onClose, onAdd, options }: AddCreativeDialogProps) {
  const [selectedCreatives, setSelectedCreatives] = useState<any[]>([])

  const handleClose = () => {
    setSelectedCreatives([])
    onClose()
  }

  const handleAdd = () => {
    if (selectedCreatives.length > 0) {
      onAdd(selectedCreatives)
      setSelectedCreatives([])
    }
  }

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
      <DialogTitle sx={{ pb: 1, fontSize: "18px", fontWeight: 500 }}>Add Creatives</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ mt: 1 }}>
          <FormControl fullWidth variant="outlined">
            <Autocomplete
              multiple
              options={options}
              getOptionLabel={(option) => option.label}
              value={selectedCreatives}
              onChange={(_, newValue) => setSelectedCreatives(newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const tagProps = getTagProps({ index })
                  const { key, ...otherProps } = tagProps

                  return (
                    <Chip
                      key={key}
                      label={option.label}
                      {...otherProps}
                      sx={{
                        bgcolor: "#EF0078",
                        color: "black",
                        fontWeight: 500,
                        borderRadius: "4px",
                        height: "24px",
                        "& .MuiChip-deleteIcon": {
                          color: "black",
                          "&:hover": {
                            color: "rgba(0, 0, 0, 0.7)",
                          },
                        },
                      }}
                    />
                  )
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Creative"
                  placeholder={selectedCreatives.length === 0 ? "Search to Select" : ""}
                  variant="outlined"
                  fullWidth
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && selectedCreatives.length > 0) {
                      e.preventDefault()
                      handleAdd()
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
                      "& .MuiAutocomplete-endAdornment": {
                        "& .MuiButtonBase-root": {
                          color: "rgba(255, 255, 255, 0.7)",
                        },
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
          Cancel
        </Button>
        <Button
          onClick={handleAdd}
          disabled={selectedCreatives.length === 0}
          sx={{
            color: "white",
            fontWeight: 500,
            textTransform: "uppercase",
            opacity: selectedCreatives.length === 0 ? 0.5 : 1,
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          Add {selectedCreatives.length > 0 ? `(${selectedCreatives.length})` : ""}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

