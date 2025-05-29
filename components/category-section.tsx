"use client"

import { useState, useEffect } from "react"; // Import hooks
import Link from "next/link"
import Image from "next/image"
import { useMobile } from "@/hooks/use-mobile"

const API_BASE_URL = "http://localhost:5000";

// --- Interfaces based on your API response ---
interface ApiSubcategory { // Not directly used here, but part of the API response
    id: number;
    category_id: number;
    name: string;
    description: string | null;
    image_url: string;
    // ... other fields
}

interface ApiCategory {
    id: number;
    name: string;
    description: string | null;
    image_url: string | null; // Image URL can be null
    subcategories: ApiSubcategory[];
    // ... other fields
}

interface CategoriesApiResponse {
    success: boolean;
    categories: ApiCategory[];
}

// Interface for the data structure needed by this component
interface TransformedCategory {
    id: number;
    name: string;
    image: string; // Full image URL
    href: string; // Link URL
}
// --- End Interfaces ---

export default function CategorySection() {
    const isMobile = useMobile();
    const [fetchedCategories, setFetchedCategories] = useState<TransformedCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${API_BASE_URL}/api/categories`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: CategoriesApiResponse = await response.json();

                if (!data.success || !Array.isArray(data.categories)) {
                    console.error("Invalid categories API response format:", data);
                    throw new Error("Invalid data format received for categories.");
                }

                // Transform API data into the structure needed by the component
                const transformed = data.categories.map((category): TransformedCategory => {
                    // Construct full image URL, provide placeholder if missing
                    const imageUrl = category.image_url
                        ? `${API_BASE_URL}${category.image_url}`
                        : "/placeholder.svg?width=150&height=150"; // Placeholder

                    // Construct link URL (adjust pattern if needed)
                    const linkHref = `/category/${category.id}`; // Example: /category/5

                    return {
                        id: category.id,
                        name: category.name.trim(), // Trim potential whitespace
                        image: imageUrl,
                        href: linkHref,
                    };
                });

                setFetchedCategories(transformed);

            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred while fetching categories.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []); // Fetch once on mount

    // --- Render Loading State ---
    if (loading) {
        return (
            <section className="py-12 md:py-16">
                <div className="container text-center">Loading categories...</div>
            </section>
        );
    }

    // --- Render Error State ---
    if (error) {
        return (
            <section className="py-12 md:py-16">
                 <div className="container text-center text-red-500">
                     Could not load categories: {error}
                 </div>
             </section>
        );
    }

    // --- Render No Categories State ---
     if (fetchedCategories.length === 0) {
         return (
             <section className="py-12 md:py-16">
                  <div className="container text-center">
                      No categories found.
                  </div>
              </section>
         );
     }


    // --- Mobile View ---
    if (isMobile) {
        return (
            <section className="py-4">
                <div className="px-4">
                    <h2 className="text-base font-bold mb-3">Shop By Category</h2>
                    <div className="overflow-x-auto pb-2 -mx-4 px-4">
                        <div className="flex space-x-3" style={{ minWidth: "max-content" }}>
                             {/* Map over fetched data */}
                            {fetchedCategories.map((category) => (
                                <Link key={category.id} href={category.href} className="flex flex-col items-center w-16">
                                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20 bg-secondary/10 mb-1 relative"> {/* Added relative positioning */}
                                        <Image
                                            src={category.image} // Use transformed URL
                                            alt={category.name}
                                            fill // Use fill for aspect ratio control within parent
                                            className="object-cover" // Ensure image covers the area
                                            sizes="56px" // Optimize for the displayed size
                                        />
                                    </div>
                                    <span className="text-[10px] font-medium text-center">{category.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    // --- Desktop View ---
    return (
        <section className="py-12 md:py-16">
            <div className="container">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Shop By Category</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
                     {/* Map over fetched data */}
                    {fetchedCategories.map((category) => (
                         // Apply group class for potential hover effects (optional)
                        <Link key={category.id} href={category.href} className="category-item flex flex-col items-center text-center group">
                            {/* Adjusted image container for better centering and potential hover scale */}
                            <div className="category-image w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary/30 transition-all duration-300 group-hover:scale-105 relative bg-secondary/10">
                                <Image
                                    src={category.image} // Use transformed URL
                                    alt={category.name}
                                    fill // Use fill for aspect ratio control
                                    className="object-cover" // Ensure image covers the area
                                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw" // Optimize based on grid columns
                                />
                            </div>
                            <span className="font-medium mt-2 group-hover:text-primary transition-colors">{category.name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}