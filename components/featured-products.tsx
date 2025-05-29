"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ProductCard, { ApiProduct, RatesMap, ExchangeRate } from "@/components/product-card";
import { useMobile } from "@/hooks/use-mobile";

// --- Constants ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const DEFAULT_DISPLAY_CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_DISPLAY_CURRENCY || "ETB";

// --- Interfaces ---
interface ApiResponse {
  products: ApiProduct[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// --- Helper Function ---
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
    if (!ratesMap.USD) ratesMap.USD = 1.0;
    return ratesMap;
  } catch (error) {
    console.error("Error fetching/processing exchange rates:", error);
    return null;
  }
}

// --- Component ---
export default function AllProductsSection() {
    const isMobile = useMobile();

    // --- State Variables ---
    const [products, setProducts] = useState<ApiProduct[]>([]);
    const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [rates, setRates] = useState<RatesMap | null>(null);
    const [loadingRates, setLoadingRates] = useState<boolean>(true);
    const displayCurrency = DEFAULT_DISPLAY_CURRENCY;

    // --- Data Fetching Effects ---
    useEffect(() => {
        setLoadingRates(true);
        getRatesMap().then(map => {
            setRates(map);
            setLoadingRates(false);
            if (!map) { console.warn("Exchange rates could not be loaded for AllProductsSection."); }
        });
    }, []);

    useEffect(() => {
        const fetchAllProducts = async () => {
            setLoadingProducts(true);
            setError(null);
            try {
                const response = await fetch(`${API_BASE_URL}/api/products`);
                if (!response.ok) {
                    throw new Error(`API Error: ${response.status} ${response.statusText}`);
                }
                const data: ApiResponse = await response.json();
                if (!data || !Array.isArray(data.products)) {
                    throw new Error("Invalid product data format from API.");
                }
                const validProducts = data.products.filter(p => p && typeof p.id !== 'undefined');
                setProducts(validProducts);
            } catch (err) {
                console.error("Failed to fetch products:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred");
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchAllProducts();
    }, []);

    // --- Combined Loading State ---
    const isLoading = loadingProducts || loadingRates;

    // --- Render Logic ---

    if (isLoading) {
        return (
            <section className="py-12 md:py-16 bg-primary/5">
                <div className="container text-center text-muted-foreground">Loading products...</div>
            </section>
        );
    }
    if (error) {
        return (
            <section className="py-12 md:py-16 bg-primary/5">
                <div className="container text-center text-destructive">Error loading products: {error}</div>
            </section>
        );
    }
    if (products.length === 0) {
        return (
            <section className="py-12 md:py-16 bg-primary/5">
                <div className="container text-center text-muted-foreground">No products found.</div>
            </section>
        );
    }

    // --- Mobile View ---
    if (isMobile) {
        return (
            // Removed overflow-hidden from section as it might clip grid items unexpectedly
            <section className="py-4 bg-primary/5">
                <div className="px-4"> {/* Keep overall horizontal padding */}
                    <div className="flex items-center justify-between mb-4"> {/* Added more bottom margin */}
                        <h2 className="text-lg font-bold">Our Products</h2> {/* Slightly larger title */}
                         {/* Removed 'View All' button */}
                    </div>
                    {/* Use Grid instead of Flexbox for mobile */}
                    <div className="grid grid-cols-2 gap-3"> {/* 2 columns with gap */}
                        {products.map((product) => (
                            // Removed fixed width div, grid handles sizing
                            <ProductCard
                                key={product.id}
                                product={product}
                                rates={rates}
                                displayCurrency={displayCurrency}
                            />
                        ))}
                    </div>
                     {/* TODO: Add Mobile Pagination/Load More */}
                </div>
            </section>
        )
    }

    // --- Desktop View ---
    // (Desktop view remains unchanged from the previous correct version)
    return (
        <section className="py-12 md:py-16 bg-primary/5">
            <div className="container">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold">Our Products</h2>
                     {/* Removed 'View All' button */}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            rates={rates}
                            displayCurrency={displayCurrency}
                        />
                    ))}
                </div>
                 {/* TODO: Add Desktop Pagination Controls */}
            </div>
        </section>
    )
}