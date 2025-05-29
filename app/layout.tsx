import type React from "react"
import { Inter, Dancing_Script } from "next/font/google"
import "./globals.css"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider" // Assuming this wraps next-themes

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const dancingScript = Dancing_Script({ subsets: ["latin"], variable: "--font-dancing-script" })

export const metadata = {
  title: "Poéselle - Luxury Perfumes",
  description: "Discover your signature scent with our luxury perfume collection",
  // generator: 'v0.dev' // You can keep or remove this meta tag
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // Add suppressHydrationWarning to the <html> tag
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${dancingScript.variable} font-sans`}>
        {/* ThemeProvider configuration looks correct */}
        <ThemeProvider
            attribute="class"
            defaultTheme="light" // Sets the initial server render theme
            enableSystem // Allows theme to adapt to system preference on client
            disableTransitionOnChange // Prevents theme transition flash on load
        >
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}

// Note: The duplicate import './globals.css' at the end is unnecessary and can be removed.
// It's already imported at the top.