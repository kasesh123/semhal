"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"

interface AdvertisementBannerProps {
  title: string
  subtitle: string
  image: string
  buttonText: string
  buttonLink: string
  badge?: string
  position?: "left" | "right" | "center"
  theme?: "primary" | "secondary" | "dark"
  fullWidth?: boolean
}

export default function AdvertisementBanner({
  title,
  subtitle,
  image,
  buttonText,
  buttonLink,
  badge,
  position = "left",
  theme = "primary",
  fullWidth = false,
}: AdvertisementBannerProps) {
  const isMobile = useMobile()

  // Background and text colors based on theme
  const bgGradient = {
    primary: "from-primary/80 to-transparent",
    secondary: "from-secondary/80 to-transparent",
    dark: "from-black/80 to-transparent",
  }

  const textColor = {
    primary: "text-white",
    secondary: "text-foreground",
    dark: "text-white",
  }

  const buttonVariant = {
    primary: "secondary",
    secondary: "default",
    dark: "outline",
  } as const

  // Content position
  const contentPosition = {
    left: "justify-start text-left",
    right: "justify-end text-right",
    center: "justify-center text-center",
  }

  const gradientDirection = position === "right" ? "to-l" : "to-r"

  if (isMobile) {
    return (
      <div className={`my-3 ${fullWidth ? "mx-0" : "mx-4"}`}>
        <div className="relative h-[100px] rounded-lg overflow-hidden">
          <Image src={image || "/placeholder.svg"} alt={title} fill className="object-cover" />
          <div
            className={`absolute inset-0 bg-gradient-${gradientDirection} ${bgGradient[theme]} flex items-center p-4 ${contentPosition[position]}`}
          >
            <div className={position === "right" ? "mr-auto" : position === "center" ? "mx-auto" : "ml-auto"}>
              {badge && (
                <Badge variant="secondary" className="mb-1 text-xs">
                  {badge}
                </Badge>
              )}
              <h3 className={`${textColor[theme]} text-lg font-bold`}>{title}</h3>
              <p className={`${textColor[theme]} text-xs mb-2`}>{subtitle}</p>
              <Button variant={buttonVariant[theme]} size="sm" asChild className="text-xs">
                <Link href={buttonLink}>{buttonText}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`container my-8 ${fullWidth ? "max-w-none px-0" : ""}`}>
      <div className="relative h-[200px] rounded-lg overflow-hidden">
        <Image src={image || "/placeholder.svg"} alt={title} fill className="object-cover" />
        <div
          className={`absolute inset-0 bg-gradient-${gradientDirection} ${bgGradient[theme]} flex items-center p-8 ${contentPosition[position]}`}
        >
          <div className="max-w-md">
            {badge && (
              <Badge variant="secondary" className="mb-2">
                {badge}
              </Badge>
            )}
            <h3 className={`${textColor[theme]} text-3xl font-bold mb-2`}>{title}</h3>
            <p className={`${textColor[theme]} text-lg mb-4`}>{subtitle}</p>
            <Button variant={buttonVariant[theme]} size="lg" asChild>
              <Link href={buttonLink}>{buttonText}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
