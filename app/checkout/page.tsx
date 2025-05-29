"use client"

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, Upload, Loader2 } from "lucide-react"
import axios from "axios" // For making API calls

// --- Shadcn UI Imports (adjust paths if needed) ---
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
// --- End Shadcn UI Imports ---

// --- Authentication Hook ---
const useAuth = () => {
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    user: null as { first_name: string; last_name: string; email: string } | null,
    token: null as string | null,
    checked: false, // To prevent premature redirect
  })

  useEffect(() => {
    // Check for token in localStorage
    const token = localStorage.getItem("token")

    if (token) {
      // If token exists, fetch user profile
      const fetchUserProfile = async () => {
        try {
          const response = await fetch("http://localhost:5000/api/auth/profile", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const userData = await response.json()
            setAuthState({
              isLoggedIn: true,
              user: userData,
              token: token,
              checked: true,
            })
          } else {
            // Token might be expired or invalid
            localStorage.removeItem("token")
            setAuthState({
              isLoggedIn: false,
              user: null,
              token: null,
              checked: true,
            })
          }
        } catch (error) {
          console.error("Error fetching profile:", error)
          setAuthState({
            isLoggedIn: false,
            user: null,
            token: null,
            checked: true,
          })
        }
      }

      fetchUserProfile()
    } else {
      setAuthState({
        isLoggedIn: false,
        user: null,
        token: null,
        checked: true,
      })
    }
  }, [])

  return authState
}
// --- End Authentication Hook ---

// Interface for cart items stored in localStorage
interface CartItem {
  id: string
  productId: number
  name: string
  size: string | null
  quantity: number
  price: number
  currency: string
  imageUrl?: string
}

// Simple currency formatting helper
const formatCurrencySimple = (value: number, currencyCode: string): string => {
  // Basic fallback, ideally use Intl.NumberFormat
  return `${currencyCode} ${value.toFixed(2)}`
}

// --- Checkout Page Component ---
export default function CheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isLoggedIn, user, token, checked: authChecked } = useAuth() // Get auth state

  // Component State
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [checkoutDetails, setCheckoutDetails] = useState({
    phone: "",
    city: "",
    address: "",
  })
  const [paymentMethod, setPaymentMethod] = useState<"chapa" | "screenshot">("chapa")
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false) // For API call loading state
  const [isCartLoading, setIsCartLoading] = useState(true) // For loading cart from storage
  const [error, setError] = useState<string | null>(null) // For displaying errors

  // Effect 1: Load cart from localStorage on component mount
  useEffect(() => {
    setIsCartLoading(true)
    try {
      const storedCart = localStorage.getItem("shoppingCart")
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart)
        if (Array.isArray(parsedCart)) {
          setCartItems(parsedCart)
        } else {
          setCartItems([]) // Handle invalid data
        }
      } else {
        setCartItems([]) // No cart found
      }
    } catch (err) {
      console.error("Failed to load cart:", err)
      setError("Could not load cart items.")
      toast({ title: "Error", description: "Could not load cart items.", variant: "destructive" })
    } finally {
      setIsCartLoading(false)
    }
  }, []) // Empty dependency array ensures this runs only once on mount

  // Effect 2: Check authentication status and redirect if necessary
  useEffect(() => {
    // Only run this check *after* the auth status has been determined from localStorage
    if (authChecked) {
      if (!isLoggedIn) {
        toast({
          title: "Login Required",
          description: "Please log in to proceed to checkout.",
          variant: "destructive",
        })
        // Redirect to login, appending current path for redirection after login
        router.replace(`/account`)
      }
    }
  }, [authChecked, isLoggedIn, router, toast]) // Depend on auth check status and login status

  // --- Calculations (based on cartItems state) ---
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  const shipping = subtotal > 2000 ? 0 : 150 // Assuming ETB & backend logic
  const total = subtotal + shipping
  const displayCurrency = cartItems.length > 0 ? cartItems[0].currency : "ETB" // Default to ETB

  // --- Handlers ---
  const handleDetailsChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCheckoutDetails({
      ...checkoutDetails,
      [e.target.id]: e.target.value,
    })
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshotFile(e.target.files[0])
      setError(null) // Clear previous file errors
    } else {
      setScreenshotFile(null)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    // Ensure user is logged in (redundant check, but safe)
    if (!isLoggedIn || !token) {
      toast({ title: "Not Logged In", description: "Please log in again.", variant: "destructive" })
      router.push("/login?redirect=/checkout")
      return
    }
    if (cartItems.length === 0) {
      toast({ title: "Empty Cart", description: "Cannot checkout with an empty cart.", variant: "destructive" })
      return
    }
    // Form field validation
    if (!checkoutDetails.phone || !checkoutDetails.city || !checkoutDetails.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in Phone, City, and Address.",
        variant: "destructive",
      })
      setError("Please fill in all required shipping details (*).")
      return
    }
    // Screenshot validation
    if (paymentMethod === "screenshot" && !screenshotFile) {
      toast({
        title: "Missing Screenshot",
        description: "Please select a payment screenshot file.",
        variant: "destructive",
      })
      setError("Please select a payment screenshot file.")
      return
    }

    setIsLoading(true)
    setError(null)

    // Prepare API request
    const apiHeaders = { Authorization: `Bearer ${token}` }
    const baseApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "" // Use environment variable for API base

    try {
      if (paymentMethod === "chapa") {
        const payload = { checkoutDetails, items: cartItems }
        const response = await axios.post(`${baseApiUrl}/api/orders/initiate-chapa`, payload, { headers: apiHeaders })
        if (response.data?.checkoutUrl) {
          toast({ title: "Redirecting to Chapa..." })
          window.location.href = response.data.checkoutUrl // Redirect browser
          // Don't setIsLoading(false) here because the page will navigate away
          return // Stop execution after redirect starts
        } else {
          throw new Error("Chapa URL not received from server.")
        }
      } else if (paymentMethod === "screenshot") {
        const formData = new FormData()
        formData.append("paymentScreenshot", screenshotFile as Blob)
        formData.append("checkoutDetailsJson", JSON.stringify(checkoutDetails))
        formData.append("itemsJson", JSON.stringify(cartItems))

        // Note: Let browser set Content-Type for FormData
        const response = await axios.post(`http://localhost:5000/api/checkout/upload-screenshot`, formData, {
          headers: apiHeaders,
        })

        toast({ title: "Order Placed Successfully!", description: "Awaiting payment verification." })
        localStorage.removeItem("shoppingCart") // Clear cart on successful order
        router.push(`/order/confirmation?orderId=${response.data.orderId}&method=screenshot`) // Redirect to confirmation
      }
    } catch (err: any) {
      console.error("Checkout API failed:", err)
      const errMsg = err.response?.data?.message || err.message || "Checkout failed. Please try again."
      setError(errMsg)
      toast({ title: "Checkout Error", description: errMsg, variant: "destructive" })
    } finally {
      // Only set loading false if it wasn't a successful Chapa redirect
      if (paymentMethod !== "chapa") {
        setIsLoading(false)
      }
    }
  }

  // --- Render Logic ---

  // Show loading state while checking auth or loading cart
  if (!authChecked || isCartLoading) {
    return (
      <div className="container py-10 text-center flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Render login prompt if auth check completed and user is not logged in
  // This acts as a fallback UI while the useEffect redirect is processing
  if (authChecked && !isLoggedIn) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Login Required</h1>
        <p className="text-muted-foreground mb-6">Please log in or create an account to proceed with checkout.</p>
        <Button asChild>
          <Link href="/login?redirect=/checkout">Login or Register</Link>
        </Button>
      </div>
    )
  }

  // Main Checkout View (only rendered if logged in)
  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/cart">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Link>
        </Button>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-16">
          <h2 className="text-xl font-medium">Your cart is empty.</h2>
          <Button asChild className="mt-4">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Left Column: Shipping & Payment */}
            <div className="md:col-span-2 space-y-8">
              {user && (
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <h2 className="text-lg font-semibold mb-2">Account</h2>
                  <p className="text-sm text-muted-foreground">
                    Ordering as: {user.first_name} {user.last_name} ({user.email})
                  </p>
                </div>
              )}

              <div>
                <h2 className="text-xl font-semibold mb-3">Shipping & Contact Details</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={checkoutDetails.phone}
                      onChange={handleDetailsChange}
                      required
                      placeholder="e.g., 0911223344"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="city"
                      value={checkoutDetails.city}
                      onChange={handleDetailsChange}
                      required
                      placeholder="e.g., Addis Ababa"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      Full Address (Subcity, Woreda, Specific Area, House No.){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="address"
                      value={checkoutDetails.address}
                      onChange={handleDetailsChange}
                      required
                      placeholder="e.g., Bole Subcity, Woreda 03, Near Atlas Hotel, #123"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Payment Method</h2>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(value: "chapa" | "screenshot") => setPaymentMethod(value)}
                >
                  {/* Chapa Option */}
                  <Label
                    htmlFor="chapa"
                    className={`flex items-center space-x-3 border p-4 rounded-md cursor-pointer hover:border-primary ${paymentMethod === "chapa" ? "border-primary ring-1 ring-primary" : ""}`}
                  >
                    <RadioGroupItem value="chapa" id="chapa" disabled={isLoading} />
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <span>Pay with Chapa (Online Payment)</span>
                  </Label>
                  {/* Screenshot Option */}
                  <Label
                    htmlFor="screenshot"
                    className={`flex items-center space-x-3 border p-4 rounded-md cursor-pointer hover:border-primary mt-3 ${paymentMethod === "screenshot" ? "border-primary ring-1 ring-primary" : ""}`}
                  >
                    <RadioGroupItem value="screenshot" id="screenshot" disabled={isLoading} />
                    <Upload className="h-5 w-5 text-green-600" />
                    <span>Upload Screenshot (Bank/Telebirr)</span>
                  </Label>
                </RadioGroup>

                {paymentMethod === "screenshot" && (
                  <div className="mt-4 space-y-3 border-l-4 border-green-500 pl-4 py-3">
                    <Label htmlFor="paymentScreenshot" className="font-medium">
                      Upload Payment Screenshot <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="paymentScreenshot"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      required={paymentMethod === "screenshot"}
                      disabled={isLoading}
                      className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
                    />
                    {screenshotFile && <p className="text-xs text-muted-foreground">Selected: {screenshotFile.name}</p>}
                    {/* !! IMPORTANT: Add your bank/Telebirr details here !! */}
                    <p className="text-xs text-muted-foreground">
                      Transfer the total amount to [Your Bank Name] Account [Your Account Number] OR Telebirr [Your
                      Telebirr Number], then upload the screenshot.
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="text-destructive bg-destructive/10 border border-destructive/30 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || cartItems.length === 0}
                className="w-full mt-6 py-3 text-base"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                  </>
                ) : paymentMethod === "chapa" ? (
                  "Proceed to Chapa Payment"
                ) : (
                  "Place Order"
                )}
              </Button>
            </div>

            {/* Right Column: Order Summary */}
            <div className="bg-secondary/10 rounded-lg p-6 h-fit space-y-4 border">
              <h2 className="text-lg font-medium mb-4">Order Summary</h2>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="relative w-16 h-16 bg-background rounded-md overflow-hidden flex-shrink-0 border">
                      <Image
                        src={item.imageUrl || "/placeholder.svg?height=80&width=80"}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                      <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground w-5 h-5 flex items-center justify-center rounded-full text-xs font-semibold">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm leading-tight">{item.name}</h4>
                      {item.size && <p className="text-xs text-muted-foreground">Size: {item.size}</p>}
                      <p className="text-xs text-muted-foreground">{formatCurrencySimple(item.price, item.currency)}</p>
                    </div>
                    <div className="text-right text-sm font-medium pl-2">
                      {formatCurrencySimple(item.price * item.quantity, item.currency)}
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrencySimple(subtotal, displayCurrency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatCurrencySimple(shipping, displayCurrency)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrencySimple(total, displayCurrency)}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
