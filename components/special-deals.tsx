"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMobile } from "@/hooks/use-mobile";
// Removed Tabs imports, keeping Badge just in case, but likely removable
// import { Badge } from "@/components/ui/badge"; // Can likely remove this

const API_BASE_URL = "http://localhost:5000";

// --- Interfaces ---
// Interface for the transformed data structure needed for inline rendering
interface FeaturedProductData {
    id: number;
    name: string;
    price: number; // derived from base_price
    image: string; // full URL
    href: string;
    // NOTE: Fields like originalPrice, discount, endsIn, items are NOT expected from the standard product API
}

// Interface for product data coming from the API list
interface ApiProduct {
    id: number;
    name: string;
    base_price: string;
    images: string; // JSON string array of paths
    category_id: number;
    is_featured?: boolean; // We will filter by this
    is_new_arrival?: boolean;
}

// Interface for the API response for the product list
interface ProductsApiResponse {
    products: ApiProduct[];
    pagination?: any;
}
// --- End Interfaces ---

// Renamed component to be specific
export default function FeaturedProductsMobile() {
    const isMobile = useMobile();
    const [products, setProducts] = useState<FeaturedProductData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFeaturedProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${API_BASE_URL}/api/products`); // Fetch products
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: ProductsApiResponse = await response.json();

                if (!data || !Array.isArray(data.products)) {
                     console.error("Invalid products API response format:", data);
                     throw new Error("Invalid data format received for products.");
                }

                // Filter for featured products and transform data
                const featured = data.products
                    .filter(product => product.is_featured === true) // Filter for is_featured
                    .map((product): FeaturedProductData | null => { // Transform
                        try {
                            let imageUrl = "/placeholder.svg?height=300&width=300"; // Fallback
                            if (product.images) {
                                const paths = JSON.parse(product.images);
                                if (Array.isArray(paths) && paths.length > 0) {
                                    imageUrl = `${API_BASE_URL}/uploads/${paths[0]}`;
                                }
                            }
                            const price = parseFloat(product.base_price);
                            return {
                                id: product.id,
                                name: product.name,
                                price: !isNaN(price) ? price : 0,
                                image: imageUrl,
                                href: `/product/${product.id}` // Link uses product ID
                            };
                        } catch (e) {
                            console.error("Error processing product", product.id, e);
                            return null;
                        }
                    })
                    .filter((p): p is FeaturedProductData => p !== null);

                setProducts(featured);

            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchFeaturedProducts();
    }, []);

    // Only renders on mobile
    if (!isMobile) return null;

    // --- Render Loading ---
    if (loading) {
         return (
             <section className="py-4">
                 <div className="px-4">
                     <h2 className="text-base font-bold mb-3">Featured Products</h2>
                     <div className="text-center">Loading...</div>
                 </div>
             </section>
         );
     }

    // --- Render Error ---
    if (error) {
         return (
             <section className="py-4">
                 <div className="px-4">
                     <h2 className="text-base font-bold mb-3">Featured Products</h2>
                     <div className="text-center text-red-500">Error: {error}</div>
                 </div>
             </section>
         );
     }

    // --- Render No Products ---
     if (products.length === 0) {
          return (
              <section className="py-4">
                  <div className="px-4">
                      <h2 className="text-base font-bold mb-3">Featured Products</h2>
                      <div className="text-center text-muted-foreground">No featured products found.</div>
                  </div>
              </section>
          );
      }

    // --- Render Component (Mobile Only) ---
    return (
        <section className="py-4">
            <div className="px-4">
                <h2 className="text-base font-bold mb-3">Featured Products</h2>

                {/* Removed Tabs, directly rendering the grid */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Map over the fetched featured products */}
                    {products.map((product) => (
                        // Using the inline rendering structure from SpecialDeals
                        <Link
                            key={product.id}
                            href={product.href} // Use constructed href
                            className="relative rounded-lg overflow-hidden border border-border bg-card"
                        >
                            <div className="relative aspect-square">
                                <Image
                                    src={product.image} // Use transformed image URL
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 50vw, 150px" // Basic sizes
                                />
                                {/* Removed Discount Badge - Not available in standard product data */}
                                {/* Removed endsIn / items Badges - Not available */}
                            </div>
                            <div className="p-2">
                                <h3 className="text-xs font-medium line-clamp-1">{product.name}</h3>
                                <div className="flex items-center mt-1">
                                    {/* Display only the current price */}
                                    <span className="text-xs font-bold text-destructive">
                                         {/* Add currency symbol if needed */}
                                         ${product.price.toFixed(2)}
                                    </span>
                                    {/* Removed Original Price - Not available in standard product data */}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}