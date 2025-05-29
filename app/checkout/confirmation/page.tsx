// pages/order/confirmation.tsx (or similar)
"use client"

import { useState, useEffect, Suspense } from "react"; // Import Suspense
import Link from "next/link";
import { useSearchParams } from 'next/navigation'; // Hook to read URL query params
import { CheckCircle, Package, ArrowRight, Loader2 } from "lucide-react";
import axios from 'axios';

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast"; // Optional: for notifications

// --- Placeholder for Authentication Context/Hook ---
// Make sure this provides the auth token correctly
const useAuth = () => {
    const [authState, setAuthState] = useState({ token: null as string | null, checked: false });
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        setAuthState({ token: token, checked: true });
    }, []);
    return authState;
};
// --- End Placeholder ---

// Interface for the Order data fetched from the backend (matches Checkout model)
interface OrderData {
    id: number;
    userId: number;
    orderPhone: string;
    orderCity: string;
    orderAddress: string;
    cartItemsSnapshot: CartItem[]; // Assuming CartItem interface is defined as before
    subtotalAmount: string; // Comes as string from Sequelize Decimal
    shippingAmount: string;
    totalAmount: string;
    currency: string;
    orderStatus: string;
    paymentMethod: 'chapa' | 'screenshot';
    paymentStatus: string;
    chapaTxRef?: string;
    paymentScreenshotPath?: string;
    createdAt: string; // Comes as string date
    updatedAt: string;
    // Add user details if included in backend response
    // User?: { first_name: string; last_name: string; email: string };
}

// Interface for cart items within the snapshot
interface CartItem {
  id: string | number; // Can be number or string depending on source
  productId: number;
  name: string;
  size: string | null;
  quantity: number;
  price: number;
  currency: string;
  imageUrl?: string;
}

// Simple currency formatting helper
const formatCurrencySimple = (value: string | number, currencyCode: string): string => {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    return `${currencyCode} ${numericValue.toFixed(2)}`;
}

// Helper to format date string
const formatDate = (dateString: string): string => {
    try {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    } catch (e) {
        return "Invalid Date";
    }
}

// --- Main Confirmation Component Logic ---
function ConfirmationContent() {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { token, checked: authChecked } = useAuth(); // Get auth token

    const orderId = searchParams.get('orderId');
    const method = searchParams.get('method'); // e.g., 'screenshot' or could be 'chapa'

    const [orderData, setOrderData] = useState<OrderData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Wait for auth check and ensure orderId exists
        if (!authChecked || !orderId) {
             // If auth not checked yet, do nothing. If no orderId, set error.
             if(authChecked && !orderId) {
                 setError("Order ID not found in URL.");
                 setIsLoading(false);
             }
            return;
        }

        if (!token) {
             setError("You must be logged in to view this page.");
             setIsLoading(false);
             // Optionally redirect to login here as well
             return;
        }

        const fetchOrder = async () => {
            setIsLoading(true);
            setError(null);
            const baseApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
            try {
                const response = await axios.get(`${baseApiUrl}/api/orders/${orderId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setOrderData(response.data);
            } catch (err: any) {
                console.error("Failed to fetch order:", err);
                const errMsg = err.response?.data?.message || err.message || "Could not load order details.";
                setError(errMsg);
                toast({ title: "Error Loading Order", description: errMsg, variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrder();

    }, [orderId, token, authChecked, toast]); // Depend on orderId, token, and auth check status

    // --- Render States ---
    if (isLoading || !authChecked) {
        return (
            <div className="text-center py-16 flex justify-center items-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-16">
                <h2 className="text-xl font-semibold text-destructive mb-4">Error</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button variant="outline" asChild>
                    <Link href="/">Go Home</Link>
                </Button>
            </div>
        );
    }

    if (!orderData) {
         return (
            <div className="text-center py-16">
                <h2 className="text-xl font-semibold text-muted-foreground">Order details not available.</h2>
            </div>
        );
    }

    // --- Main Content Render ---
    // Extract data for easier use
    const {
        id, createdAt, totalAmount, currency, paymentMethod: orderPaymentMethod, paymentStatus,
        cartItemsSnapshot, orderPhone, orderCity, orderAddress, subtotalAmount, shippingAmount
     } = orderData;
     const userEmail = "your_email@example.com"; // Replace with actual user email if available from auth or order fetch

    return (
        <div className="container max-w-3xl py-16">
            <div className="text-center space-y-4 mb-10">
                <div className="flex justify-center">
                    <CheckCircle className="h-16 w-16 text-primary" />
                </div>
                <h1 className="text-3xl font-bold">Thank You for Your Order!</h1>
                <p className="text-muted-foreground">
                    {orderPaymentMethod === 'screenshot' && paymentStatus === 'pending_verification'
                        ? "Your order has been received and is awaiting payment verification."
                        : "Your order has been received and is being processed."}
                </p>
            </div>

            <div className="bg-secondary/10 rounded-lg p-6 md:p-8 space-y-6 border">
                {/* Order Summary Header */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Order Number</p>
                        <p className="font-medium">#{id}</p> {/* Display actual ID */}
                    </div>
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Date Placed</p>
                        <p className="font-medium">{formatDate(createdAt)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Total Amount</p>
                        <p className="font-medium">{formatCurrencySimple(totalAmount, currency)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Payment Method</p>
                        <p className="font-medium capitalize">{orderPaymentMethod}</p>
                    </div>
                </div>

                <Separator />

                {/* Order Items Details */}
                <div className="space-y-4">
                    <h2 className="font-semibold text-lg">Order Details</h2>
                    <div className="space-y-3">
                        {cartItemsSnapshot?.map((item, index) => ( // Use optional chaining
                            <div key={item.id || index} className="flex justify-between items-center text-sm">
                                <span>{item.name} {item.size ? `(${item.size})` : ''} &times; {item.quantity}</span>
                                <span>{formatCurrencySimple(item.price * item.quantity, item.currency)}</span>
                            </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{formatCurrencySimple(subtotalAmount, currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Shipping</span>
                            <span>{parseFloat(shippingAmount) === 0 ? "Free" : formatCurrencySimple(shippingAmount, currency)}</span>
                        </div>
                        {/* Add Tax display here if applicable */}
                        <Separator />
                        <div className="flex justify-between font-semibold text-base">
                            <span>Total</span>
                            <span>{formatCurrencySimple(totalAmount, currency)}</span>
                        </div>
                    </div>
                </div>

                 <Separator />

                {/* Shipping Information */}
                <div className="space-y-4">
                    <h2 className="font-semibold text-lg">Shipping Information</h2>
                    <div className="flex items-start gap-3 text-sm">
                        <Package className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                            {/* Display user name if available, otherwise fallback */}
                            {/* <p>{orderData.User?.first_name || 'N/A'} {orderData.User?.last_name || ''}</p> */}
                            <p>Phone: {orderPhone}</p>
                            <p>{orderAddress}</p>
                            <p>{orderCity}</p>
                            {/* Add Country if stored/needed */}
                        </div>
                    </div>
                </div>

                {/* Confirmation Footer Notes */}
                <div className="space-y-2 pt-4 text-center border-t mt-6">
                    <p className="text-sm text-muted-foreground">A confirmation email has been sent to {userEmail}.</p>
                    <p className="text-sm text-muted-foreground">
                        You can track your order status in the "My Orders" section.
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Button asChild>
                    <Link href="/my-orders">View My Orders</Link> {/* Link to user's order history page */}
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/">
                        Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </div>
    )
}


// --- Page Component Wrapper (Handles Suspense for useSearchParams) ---
export default function ConfirmationPage() {
     // Suspense is required by Next.js when using useSearchParams at the page level
     return (
         <Suspense fallback={<div className="container py-10 text-center">Loading confirmation...</div>}>
             <ConfirmationContent />
         </Suspense>
     );
}