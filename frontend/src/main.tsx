import React from "react"
import { createRoot } from "react-dom/client"
import StudySynopsisStudio from "../../app/page"
import "../../app/globals.css"

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <StudySynopsisStudio />
  </React.StrictMode>,
)
