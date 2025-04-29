import { createTheme } from "@mui/material/styles"

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#ef0078",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#001529",
      contrastText: "#ffffff",
    },
    background: {
      default: "#000000",
      paper: "#383838", // Updated to match our dialog background
    },
    text: {
      primary: "#ffffff",
      secondary: "#cdcdcd",
    },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    button: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: "uppercase",
          fontWeight: 600,
        },
        containedPrimary: {
          backgroundColor: "#ef0078",
          "&:hover": {
            backgroundColor: "#d82388",
          },
        },
        outlined: {
          borderColor: "#5d5d5d",
          color: "#ffffff",
          "&:hover": {
            backgroundColor: "rgba(93, 93, 93, 0.1)",
            borderColor: "#5d5d5d",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid #5d5d5d",
          padding: "12px 16px",
        },
        head: {
          color: "#cdcdcd",
          fontWeight: 400,
        },
      },
    },
  },
})

