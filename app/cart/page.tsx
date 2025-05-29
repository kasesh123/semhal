"use client";

import { useState, useEffect } from "react"; // Import useEffect
import Link from "next/link";
import Image from "next/image";
import { Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Keep if using promo code input
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define the structure of items expected from localStorage
// (Should match the interface used when adding items)
interface CartItem {
  id: string; // Unique identifier (e.g., productId-size) - NOTE: This is a STRING now
  productId: number;
  name: string;
  size: string | null;
  quantity: number;
  price: number; // Price per unit
  currency: string; // Currency code (e.g., 'USD', 'ETB')
  imageUrl?: string;
}

// Simple currency formatting helper (could be imported from a shared util)
const formatCurrencySimple = (value: number, currencyCode: string): string => {
    // Basic fallback, ideally use Intl.NumberFormat like in ProductPage
    return `${currencyCode} ${value.toFixed(2)}`;
}

export default function CartPage() {
  // Initialize state with an empty array, will be populated from localStorage
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  // Effect to load cart from localStorage on component mount
  useEffect(() => {
    setIsLoading(true);
    try {
      const storedCart = localStorage.getItem("shoppingCart");
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        // Basic validation: Ensure it's an array
        if (Array.isArray(parsedCart)) {
          setCartItems(parsedCart);
        } else {
           console.warn("Invalid cart data found in localStorage. Resetting.");
           localStorage.removeItem("shoppingCart"); // Clear invalid data
           setCartItems([]);
        }
      } else {
        setCartItems([]); // No cart found
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
      setCartItems([]); // Reset on error
    } finally {
        setIsLoading(false); // Done loading
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to save cart changes back to localStorage whenever cartItems state updates
  useEffect(() => {
    // Don't save during the initial load phase or if the initial load failed resulting in empty cart (unless it was genuinely empty)
    if (!isLoading) {
       try {
           localStorage.setItem("shoppingCart", JSON.stringify(cartItems));
       } catch (error) {
           console.error("Failed to save cart to localStorage:", error);
           // Optionally notify the user that cart changes might not be saved
       }
    }
  }, [cartItems, isLoading]); // Run this effect when cartItems or isLoading changes

  // --- Cart manipulation functions ---

  const updateQuantity = (id: string, quantity: number) => { // ID is now string
    // Ensure quantity is at least 1
    const newQuantity = Math.max(1, quantity);
    setCartItems(
      cartItems.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
    // localStorage update is handled by the useEffect watching cartItems
  };

  const removeItem = (id: string) => { // ID is now string
    setCartItems(cartItems.filter((item) => item.id !== id));
    // localStorage update is handled by the useEffect watching cartItems
  };

  // --- Calculations ---
  // Note: Assumes all items in the cart have the same currency for subtotal/total display.
  // A more robust solution would convert items or handle mixed currencies.
  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Use currency from the first item for display, or a fallback
  const displayCurrencyCode = cartItems.length > 0 ? cartItems[0].currency : 'USD'; // Fallback to USD if cart empty

  // Example shipping logic (adjust as needed)
  const shippingThreshold = 100; // Assuming threshold is in the cart's currency
  const shippingCost = 10;
  const shipping = subtotal > shippingThreshold ? 0 : shippingCost;
  const total = subtotal + shipping;

  // --- Render Logic ---

  if (isLoading) {
      return <div className="container py-10 text-center">Loading cart...</div>; // Basic loading indicator
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        // Display Empty Cart Message
        <div className="text-center py-16 space-y-6">
          <div className="flex justify-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-medium">Your cart is empty</h2>
          <p className="text-muted-foreground">
            Looks like you haven't added any perfumes to your cart yet.
          </p>
          <Button asChild>
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      ) : (
        // Display Cart Contents and Summary
        <div className="grid md:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="md:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row gap-4 py-4 border-b">
                {/* Image */}
                <div className="relative w-24 h-24 bg-secondary/10 rounded-md overflow-hidden flex-shrink-0 mx-auto sm:mx-0">
                  <Image
                    // Use imageUrl from cart item, provide fallback
                    src={item.imageUrl || "/placeholder.svg?height=100&width=100"}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="100px" // Hint for optimization
                  />
                </div>
                {/* Details */}
                <div className="flex-1 space-y-1 text-center sm:text-left">
                  <h3 className="font-medium">{item.name}</h3>
                  {/* Display size only if it exists */}
                  {item.size && <p className="text-sm text-muted-foreground">Size: {item.size}</p>}
                  {/* Display formatted price with currency */}
                  <p className="font-medium">
                    {formatCurrencySimple(item.price, item.currency)} / unit
                  </p>
                   <p className="text-sm text-muted-foreground sm:hidden"> {/* Show total on small screens below quantity */}
                     Total: {formatCurrencySimple(item.price * item.quantity, item.currency)}
                   </p>
                </div>
                {/* Quantity and Remove */}
                <div className="flex flex-col items-center sm:items-end gap-2 justify-between">
                   <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground hidden sm:inline">Qty:</span>
                        <Select
                            value={item.quantity.toString()}
                            // Ensure quantity updates correctly
                            onValueChange={(value) => updateQuantity(item.id, parseInt(value, 10))}
                        >
                            <SelectTrigger className="w-16 h-9">
                            <SelectValue placeholder="Qty" />
                            </SelectTrigger>
                            <SelectContent>
                            {/* Generate options 1-10 (or adjust range) */}
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                {num}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                   </div>
                   <p className="font-medium hidden sm:block"> {/* Show total on larger screens */}
                     {formatCurrencySimple(item.price * item.quantity, item.currency)}
                   </p>
                   <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground h-8 px-2 text-xs" // Smaller remove button
                    >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                  </Button>
                </div>
              </div>
            ))}

            {/* Optional: Promo Code Section */}
            {/* <div className="flex gap-4 pt-4">
              <Input placeholder="Promo code" className="max-w-xs" />
              <Button variant="outline">Apply</Button>
            </div> */}
          </div>

          {/* Order Summary */}
          <div className="bg-secondary/10 rounded-lg p-6 h-fit space-y-4">
            <h2 className="text-lg font-medium">Order Summary</h2>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                {/* Format subtotal using the determined currency */}
                <span>{formatCurrencySimple(subtotal, displayCurrencyCode)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                 {/* Display shipping cost */}
                 <span>
                   {shipping === 0
                     ? "Free"
                     : formatCurrencySimple(shipping, displayCurrencyCode)}
                 </span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                {/* Format total using the determined currency */}
                <span>{formatCurrencySimple(total, displayCurrencyCode)}</span>
              </div>
            </div>
            <Button className="w-full" size="lg" asChild>
              <Link href="/checkout"> {/* Link to your checkout page */}
                Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-xs text-center text-muted-foreground pt-2">
              Shipping & taxes calculated at checkout
            </p>
          </div>
        </div>
      )}
    </div>
  );
}