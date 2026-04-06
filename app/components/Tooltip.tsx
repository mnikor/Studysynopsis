"use client"

import type React from "react"
import { useState } from "react"
import { Info } from "lucide-react"

interface TooltipProps {
  content: string
}

const Tooltip: React.FC<TooltipProps> = ({ content }) => {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-block">
      <Info
        className="h-4 w-4 text-gray-400 cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      />
      {isVisible && (
        <div className="absolute z-10 w-64 px-3 py-2 text-sm font-light text-white bg-gray-700 rounded-lg shadow-sm -top-2 left-6">
          {content}
        </div>
      )}
    </div>
  )
}

export default Tooltip

