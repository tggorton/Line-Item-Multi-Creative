"use client"

import { useEffect, useRef, useState } from "react"
import Box from "@mui/material/Box"
import Tooltip from "@mui/material/Tooltip"

export default function Sidebar() {
  const [firstIconTop, setFirstIconTop] = useState(180)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)

  // Navigation items with icons and tooltips
  const navItems = [
    {
      icon: "advertisers",
      tooltip: "Advertisers",
      normalUrl:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/advertisers-EC4ZJ9kp79Ke3WTLMlrHY3eywSwYap.png",
      hoverUrl:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/advertisers-EC4ZJ9kp79Ke3WTLMlrHY3eywSwYap.png", // Using same URL for hover until hover versions are provided
    },
    {
      icon: "creatives",
      tooltip: "Creatives",
      normalUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/creatives-Xqkj3NjXpc79TcEuz3XEanlm6hWuhX.png",
      hoverUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/creatives-Xqkj3NjXpc79TcEuz3XEanlm6hWuhX.png",
    },
    {
      icon: "io-tool",
      tooltip: "IO Tool",
      normalUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/io-tool-iGbeIPETENaG3HMc4vqIkepLZlAumI.png",
      hoverUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/io-tool-iGbeIPETENaG3HMc4vqIkepLZlAumI.png",
    },
    {
      icon: "pixels",
      tooltip: "Pixels",
      normalUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pixels-XCMiqGo4zuv0I1nxQGI069kc9jznCR.png",
      hoverUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pixels-XCMiqGo4zuv0I1nxQGI069kc9jznCR.png",
    },
    {
      icon: "segments",
      tooltip: "Segments",
      normalUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/segments-p2FLgDddfptE6Epdo4BGIGYmn4tUfY.png",
      hoverUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/segments-p2FLgDddfptE6Epdo4BGIGYmn4tUfY.png",
    },
    {
      icon: "products",
      tooltip: "Products",
      normalUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/products-G3JPk9tRbj92OSOQK4LNsF0HsWOySS.png",
      hoverUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/products-G3JPk9tRbj92OSOQK4LNsF0HsWOySS.png",
    },
    {
      icon: "reporting",
      tooltip: "Reporting",
      normalUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/reporting-KXnw1mzm7NbKEH54WguCFNxIHNz9Iz.png",
      hoverUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/reporting-KXnw1mzm7NbKEH54WguCFNxIHNz9Iz.png",
    },
    {
      icon: "admin",
      tooltip: "Admin",
      normalUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/admin-lU7qIzZqk8v4Bs96p2D7m8v5rtGykC.png",
      hoverUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/admin-lU7qIzZqk8v4Bs96p2D7m8v5rtGykC.png",
    },
    {
      icon: "support",
      tooltip: "Support",
      normalUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/support-8m3XYHIj6J8jOxYru251SigB0Bn8cS.png",
      hoverUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/support-8m3XYHIj6J8jOxYru251SigB0Bn8cS.png",
    },
    {
      icon: "logout",
      tooltip: "Logout",
      normalUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logout-8kRgp4U9Xb7A8c3iVYAxgw8CinX9tG.png",
      hoverUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logout-8kRgp4U9Xb7A8c3iVYAxgw8CinX9tG.png",
    },
  ]

  // Effect to find the Line Item Details box and align the first icon with it
  useEffect(() => {
    const findLineItemDetailsBox = () => {
      const lineItemDetailsBox = document.querySelector('div[class*="MuiPaper-root"]')
      if (lineItemDetailsBox) {
        const lineItemDetailsTop = lineItemDetailsBox.getBoundingClientRect().top
        // Add a small offset to ensure the first icon isn't clipped
        setFirstIconTop(lineItemDetailsTop + 20)
      }
    }

    findLineItemDetailsBox()
    window.addEventListener("resize", findLineItemDetailsBox)
    return () => window.removeEventListener("resize", findLineItemDetailsBox)
  }, [])

  return (
    <Box
      ref={sidebarRef}
      sx={{
        width: 80,
        bgcolor: "#001529",
        height: "100vh",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "hidden", // Prevent content from overflowing
        minWidth: 60, // Set minimum width
        flexShrink: 0, // Prevent sidebar from shrinking too much
      }}
    >
      {/* KERV Logo */}
      <Box
        sx={{
          position: "absolute",
          top: 42,
          left: "50%", // Center horizontally
          transform: "translateX(-50%)", // Center horizontally
          width: 44,
          height: 44,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <svg
          viewBox="0 0 664.11 662.9"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet" // Maintain aspect ratio
          aria-label="KERV Logo"
          style={{
            maxWidth: "44px", // Maximum width
            maxHeight: "44px", // Maximum height
          }}
        >
          <polygon fill="#e64d9b" points="331.42 0 0 331.46 0 0 331.42 0" />
          <polyline fill="#d82388" points="331.42 331.46 0 331.46 331.42 0" />
          <polygon fill="#b91d7e" points="1.19 331.48 332.65 662.9 1.19 662.9 1.19 331.48" />
          <polyline fill="#e03694" points="332.65 331.48 332.65 662.9 1.19 331.48" />
          <polygon fill="#e44c9b" points="332.65 331.48 664.11 662.9 332.65 662.9 332.65 331.48" />
          <polygon fill="#e64d9b" points="662.87 0 331.45 331.46 331.45 0 662.87 0" />
        </svg>
      </Box>

      {/* Navigation Icons Container */}
      <Box
        sx={{
          position: "absolute",
          top: 120, // Fixed position below the logo
          bottom: 20, // Fixed margin from bottom
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflowY: "auto", // Enable vertical scrolling
          // Add custom scrollbar styling
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(255, 255, 255, 0.2)",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "rgba(255, 255, 255, 0.3)",
          },
          // Add padding to ensure icons aren't clipped
          padding: "10px 10px 20px 10px",
        }}
      >
        {/* Navigation Icons */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            width: "100%",
          }}
        >
          {navItems.map((item, index) => (
            <Tooltip key={index} title={item.tooltip} placement="right" arrow>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  // Make sure icons stay centered and visible
                  margin: "0 auto",
                  position: "relative",
                }}
                onMouseEnter={() => setHoveredIcon(item.icon)}
                onMouseLeave={() => setHoveredIcon(null)}
              >
                {/* Normal state image */}
                <Box
                  component="img"
                  src={item.normalUrl}
                  alt={`${item.tooltip} Icon`}
                  sx={{
                    maxWidth: 24,
                    maxHeight: 24,
                    width: "auto",
                    height: "auto",
                    position: "absolute",
                    opacity: hoveredIcon === item.icon ? 0 : 1,
                    transition: "opacity 0.2s ease",
                    objectFit: "contain",
                  }}
                />

                {/* Hover state image - using a pink filter for hover effect */}
                <Box
                  component="img"
                  src={item.hoverUrl}
                  alt={`${item.tooltip} Icon (Hover)`}
                  sx={{
                    maxWidth: 24,
                    maxHeight: 24,
                    width: "auto",
                    height: "auto",
                    position: "absolute",
                    opacity: hoveredIcon === item.icon ? 1 : 0,
                    transition: "opacity 0.2s ease",
                    filter: "invert(27%) sepia(100%) saturate(7057%) hue-rotate(322deg) brightness(99%) contrast(100%)", // Pink filter for hover effect
                    objectFit: "contain",
                  }}
                />
              </Box>
            </Tooltip>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

