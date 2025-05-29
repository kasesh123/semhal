"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
// Import the updated ProductCard and necessary types
import ProductCard, { ApiProduct, RatesMap, ExchangeRate } from "@/components/product-card";
import { useMobile } from "@/hooks/use-mobile";

// --- Constants ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const DEFAULT_DISPLAY_CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_DISPLAY_CURRENCY || "ETB";

// --- Interfaces (Using imported types now) ---
// Define the expected API list response structure
interface ApiResponse {
    products: ApiProduct[]; // Expecting full ApiProduct data, or adjust if API returns less
    pagination?: { // Optional pagination
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// --- Helper Function (Consider moving to shared utils) ---
// Fetch and process exchange rates
async function getRatesMap(): Promise<RatesMap | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/exchange-rates`);
        if (!response.ok) throw new Error(`Failed to fetch rates: ${response.statusText}`);
        const ratesData: ExchangeRate[] = await response.json();
        const ratesMap = ratesData.reduce((map, rate) => {
            const rateValue = parseFloat(rate.rate_from_usd);
            if (!isNaN(rateValue) && rateValue > 0) map[rate.currency_code] = rateValue;
            return map;
        }, {} as RatesMap);
        if (!ratesMap.USD) ratesMap.USD = 1.0; // Ensure USD base rate
        return ratesMap;
    } catch (error) {
        console.error("Error fetching or processing exchange rates:", error);
        return null;
    }
}


// --- Component ---
export default function NewArrivals() {
    const isMobile = useMobile();

    // --- State Variables ---
    // State now holds the full ApiProduct objects
    const [newArrivalProducts, setNewArrivalProducts] = useState<ApiProduct[]>([]);
    const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State for currency conversion (needed for ProductCard)
    const [rates, setRates] = useState<RatesMap | null>(null);
    const [loadingRates, setLoadingRates] = useState<boolean>(true);
    // Using constant for display currency, could be state/context if changeable
    const displayCurrency = DEFAULT_DISPLAY_CURRENCY;

    // --- Data Fetching Effects ---

    // Fetch Exchange Rates (runs once)
    // NOTE: Ideally, fetch rates once globally (Context/Layout) instead of in every component.
    useEffect(() => {
        setLoadingRates(true);
        getRatesMap().then(map => {
            setRates(map);
            setLoadingRates(false);
            if (!map) { console.warn("Exchange rates could not be loaded for NewArrivals."); }
        });
    }, []);

    // Fetch New Arrival Products (runs once)
    useEffect(() => {
        const fetchNewArrivalProducts = async () => {
            setLoadingProducts(true);
            setError(null);
            try {
                // Fetch data - Consider adding query param if API supports filtering new arrivals server-side
                // e.g., `${API_BASE_URL}/api/products?isNewArrival=true&limit=8`
                const response = await fetch(`${API_BASE_URL}/api/products?limit=10`); // Fetch a bit more for client filtering

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status} ${response.statusText}`);
                }

                const data: ApiResponse = await response.json();

                if (!data || !Array.isArray(data.products)) {
                    console.error("Fetched data is not in the expected format:", data);
                    throw new Error("Invalid data format received from API.");
                }

                // --- Filter Products Client-Side ---
                // Filter based on the is_new_arrival flag
                // **Important**: Ensure every product from the API has the `images` field,
                // even if it's null or '[]', otherwise the ORIGINAL error could happen here
                // before even reaching ProductCard if you tried processing images here.
                const filteredProducts = data.products.filter(product => {
                    // Defensive check: Ensure product exists and has an ID before proceeding
                    if (!product || typeof product.id === 'undefined') {
                        console.warn("Skipping invalid product object received from API:", product);
                        return false;
                    }
                    // The actual filtering logic
                    return product.is_new_arrival;
                });

                // **No Transformation Needed**: Keep the full ApiProduct object
                // The robust `parseImages` inside ProductCard handles undefined/null/invalid images string.
                setNewArrivalProducts(filteredProducts);

            } catch (err) {
                console.error("Failed to fetch or process new arrival products:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred");
            } finally {
                setLoadingProducts(false);
            }
        };

        fetchNewArrivalProducts();
    }, []); // Empty dependency array ensures fetching once on mount

    // --- Combined Loading State ---
    const isLoading = loadingProducts || loadingRates;

    // --- Render Loading State ---
    if (isLoading) {
        return (
            <section className="py-12 md:py-16">
                <div className="container text-center text-muted-foreground">Loading new arrivals...</div>
                {/* TODO: Add Skeleton Loader */}
            </section>
        );
    }

    // --- Render Error State ---
    if (error) {
        return (
            <section className="py-12 md:py-16">
                <div className="container text-center text-destructive">
                    Error loading products: {error}
                </div>
            </section>
        );
    }

    // --- Render No Products Found State ---
    if (newArrivalProducts.length === 0) {
        return (
            <section className="py-12 md:py-16">
                <div className="container text-center text-muted-foreground">
                    No new arrivals found at this time.
                </div>
            </section>
        );
    }

    // Determine number of products to show based on view
    const productsToShowMobile = newArrivalProducts.slice(0, 6); // Show more for horizontal scroll
    const productsToShowDesktop = newArrivalProducts.slice(0, 4); // Show 4 in the grid

    // --- Render Mobile View ---
    if (isMobile) {
        return (
            <section className="py-4 overflow-hidden"> {/* Prevent layout shifts */}
                <div className="px-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-bold">New Arrivals</h2>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/collections/all?sort=newest"> {/* Single <Link> child */}
                                View All <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                    {/* Enable horizontal scrolling */}
                    <div className="overflow-x-auto -mx-4 px-4 pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                        <div className="flex space-x-3" style={{ minWidth: "max-content" }}>
                            {/* Pass the full product object and currency info */}
                            {productsToShowMobile.map((product) => (
                                <div key={product.id} className="w-32 flex-shrink-0">
                                    <ProductCard
                                        product={product}
                                        rates={rates}
                                        displayCurrency={displayCurrency}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    // --- Render Desktop View ---
    return (
        <section className="py-12 md:py-16">
            <div className="container">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold">New Arrivals</h2>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/collections/all?sort=newest"> {/* Example link */}
                            View All <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {/* Pass the full product object and currency info */}
                    {productsToShowDesktop.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            rates={rates}
                            displayCurrency={displayCurrency}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}