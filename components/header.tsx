"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image"; // Import Image
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, Heart, User, Menu, Home, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle // Import style helper for consistency
} from "@/components/ui/navigation-menu"; // Import NavigationMenu components
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Import Accordion components
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils"; // For conditional classes

// Import shared types if defined externally
// import type { ApiCategory, CategoriesApiResponse, ApiSubcategory } from "@/types";

// --- Constants ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const UPLOADS_URL = `${API_BASE_URL}`; // Centralize uploads path

// --- Helper Function ---
const getImageUrl = (path: string | null | undefined): string => {
    // Return placeholder if path is invalid/null/undefined
    if (!path || typeof path !== 'string' || path.trim() === '') {
        return "/placeholder.svg?w=50&h=50"; // Simple placeholder
    }
    // Prepend base URL only if it's not already an absolute URL
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    // Ensure leading slash consistency if needed, depends on API response format
    return `${UPLOADS_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};


export default function Header() {
    const [isSheetOpen, setIsSheetOpen] = useState(false); // Control mobile sheet
    const pathname = usePathname();
    const isMobile = useMobile();

    // --- State for Dynamic Categories (Store full data) ---
    const [categories, setCategories] = useState<ApiCategory[]>([]); // Store full ApiCategory objects
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [categoryError, setCategoryError] = useState<string | null>(null);
    // --- End State ---

    // --- Fetch Dynamic Categories ---
    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoadingCategories(true);
            setCategoryError(null);
            try {
                const response = await fetch(`${API_BASE_URL}/api/categories`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: CategoriesApiResponse = await response.json();

                if (!data.success || !Array.isArray(data.categories)) {
                    throw new Error("Invalid category data format");
                }

                 // Clean up names and store full category data
                 const cleanedCategories = data.categories.map(cat => ({
                    ...cat,
                    name: cat.name.trim(), // Trim whitespace from names
                    subcategories: cat.subcategories.map(sub => ({
                        ...sub,
                        name: sub.name.trim() // Trim subcategory names too
                    }))
                 }));

                setCategories(cleanedCategories);

            } catch (err) {
                setCategoryError(err instanceof Error ? err.message : "Failed to load categories");
                console.error("Category fetch error:", err);
            } finally {
                setIsLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);
    // --- End Fetch ---

    // --- Mobile Rendering ---
    if (isMobile) {
        return (
            <>
                {/* Mobile Top Header */}
                <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex h-14 items-center px-4">
                        {/* Mobile Menu Button (Sheet Trigger) */}
                        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="mr-2">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] p-4 overflow-y-auto"> {/* Increased width slightly */}
                                <Link href="/" className="flex items-center space-x-2 mb-6" onClick={() => setIsSheetOpen(false)}>
                                    <span className="font-bold text-xl tracking-tight">Semhal</span>
                                </Link>
                                {/* Mobile Menu Navigation using Accordion */}
                                <div className="flex flex-col">
                                    {isLoadingCategories ? (
                                        <p className="text-sm text-muted-foreground px-2">Loading categories...</p>
                                    ) : categoryError ? (
                                        <p className="text-sm text-red-600 px-2">Error loading categories.</p>
                                    ) : (
                                        <Accordion type="single" collapsible className="w-full">
                                            {categories.map((category) => (
                                                <AccordionItem value={`category-${category.id}`} key={category.id}>
                                                    <AccordionTrigger className="text-base font-medium px-2 hover:no-underline">
                                                        {/* Link to category page */}
                                                        <Link href={`/category/${category.id}`} className="flex-1 text-left" onClick={() => setIsSheetOpen(false)}>
                                                            {category.name}
                                                        </Link>
                                                        {/* Arrow only if subcategories exist */}
                                                         {category.subcategories && category.subcategories.length > 0 ? null : <span className="w-4"></span>} {/* Placeholder to align text */}
                                                    </AccordionTrigger>
                                                    {/* Only render content if subcategories exist */}
                                                    {category.subcategories && category.subcategories.length > 0 && (
                                                        <AccordionContent className="pb-1">
                                                            {/* Horizontal scroll for subcategories */}
                                                            <div className="overflow-x-auto py-2 px-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                                                                <div className="flex space-x-4" style={{ minWidth: "max-content" }}>
                                                                    {category.subcategories.map((sub) => (
                                                                        <Link
                                                                            href={`/category/${category.id}/${sub.id}`} // Subcategory link
                                                                            key={sub.id}
                                                                            className="flex flex-col items-center w-20 text-center group"
                                                                            onClick={() => setIsSheetOpen(false)}
                                                                        >
                                                                            <div className="relative w-14 h-14 rounded-full overflow-hidden border border-border mb-1 group-hover:border-primary transition-colors">
                                                                                <Image
                                                                                    src={getImageUrl(sub.image_url)}
                                                                                    alt={sub.name}
                                                                                    fill
                                                                                    className="object-cover"
                                                                                    sizes="56px"
                                                                                    onError={(e) => { e.currentTarget.src = '/placeholder.svg?w=50&h=50'; }}
                                                                                />
                                                                            </div>
                                                                            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors line-clamp-2">
                                                                                {sub.name}
                                                                            </span>
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </AccordionContent>
                                                    )}
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    )}
                                    {/* Optional: Add static links like Sale here if needed */}
                                    {/* <Link href="/category/sale" className="px-2 py-2 text-base font-medium" onClick={() => setIsSheetOpen(false)}>Sale</Link> */}
                                </div>
                            </SheetContent>
                        </Sheet>

                        {/* Mobile Logo/Title */}
                        <Link href="/" className="flex-1 flex justify-center">
                            <span className="font-bold text-xl tracking-tight">Semhal</span>
                        </Link>

                        {/* Mobile Action Icons */}
                        <div className="flex items-center gap-1 sm:gap-2">
                             <Button variant="ghost" size="icon"><Search className="h-5 w-5" /><span className="sr-only">Search</span></Button>
                             <Button variant="ghost" size="icon" asChild><Link href="/cart"><ShoppingBag className="h-5 w-5" /><span className="sr-only">Cart</span></Link></Button>
                        </div>
                    </div>
                </header>

                {/* Mobile Bottom Navigation */}
                 <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t py-2 px-4">
                    <div className="flex justify-around items-center">
                         <Link href="/" className={`flex flex-col items-center p-1 ${pathname === '/' ? 'text-primary' : 'text-muted-foreground'}`}><Home className="h-5 w-5" /><span className="text-[10px] mt-1">Home</span></Link>
                         {/* Trigger sheet for categories */}
                         <Button variant="ghost" className="flex flex-col items-center p-1 h-auto text-muted-foreground" onClick={() => setIsSheetOpen(true)}>
                            <Grid className="h-5 w-5" />
                            <span className="text-[10px] mt-1">Categories</span>
                         </Button>
                         <Link href="/wishlist" className={`flex flex-col items-center p-1 ${pathname === '/wishlist' ? 'text-primary' : 'text-muted-foreground'}`}><Heart className="h-5 w-5" /><span className="text-[10px] mt-1">Wishlist</span></Link>
                         <Link href="/account" className={`flex flex-col items-center p-1 ${pathname === '/account' ? 'text-primary' : 'text-muted-foreground'}`}><User className="h-5 w-5" /><span className="text-[10px] mt-1">Account</span></Link>
                    </div>
                </div>
            </>
        );
    }

    // --- Desktop Rendering ---
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center">
                {/* Desktop Logo */}
                <Link href="/" className="mr-6 lg:mr-10 flex items-center space-x-2">
                    <span className="font-bold text-2xl tracking-tight">Semhal</span>
                </Link>

                {/* Desktop Navigation with Dropdowns */}
                <NavigationMenu>
                    <NavigationMenuList>
                        {/* Dynamic Categories */}
                        {isLoadingCategories ? (
                             <NavigationMenuItem><span className="text-sm text-muted-foreground px-3 py-2">Loading...</span></NavigationMenuItem>
                        ) : categoryError ? (
                             <NavigationMenuItem><span className="text-sm text-red-600 px-3 py-2">Error</span></NavigationMenuItem>
                        ) : (
                            categories.map((category) => (
                                <NavigationMenuItem key={category.id}>
                                    <NavigationMenuTrigger className="text-sm font-medium">
                                         {/* Main category link */}
                                         <Link href={`/category/${category.id}`} legacyBehavior passHref>
                                            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                                {category.name}
                                            </NavigationMenuLink>
                                         </Link>
                                    </NavigationMenuTrigger>
                                    {/* Only render content if subcategories exist */}
                                    {category.subcategories && category.subcategories.length > 0 && (
                                        <NavigationMenuContent>
                                            {/* Grid layout for subcategories */}
                                            <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] grid-cols-2 lg:grid-cols-3">
                                                {category.subcategories.map((sub) => (
                                                    <li key={sub.id}>
                                                        <NavigationMenuLink asChild>
                                                            <Link
                                                                href={`/category/${category.id}/${sub.id}`} // Subcategory link
                                                                className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent hover:text-accent-foreground focus:outline-none focus:bg-accent focus:text-accent-foreground"
                                                            >
                                                                <div className="relative w-10 h-10 rounded-full overflow-hidden border flex-shrink-0">
                                                                    <Image
                                                                        src={getImageUrl(sub.image_url)}
                                                                        alt={sub.name}
                                                                        fill
                                                                        className="object-cover"
                                                                         sizes="40px"
                                                                         onError={(e) => { e.currentTarget.src = '/placeholder.svg?w=50&h=50'; }}
                                                                    />
                                                                </div>
                                                                <span className="text-sm font-medium leading-tight line-clamp-2">
                                                                    {sub.name}
                                                                </span>
                                                            </Link>
                                                        </NavigationMenuLink>
                                                    </li>
                                                ))}
                                            </ul>
                                        </NavigationMenuContent>
                                    )}
                                </NavigationMenuItem>
                            ))
                        )}
                        {/* Optional Static Link */}
                        {/* <NavigationMenuItem>
                            <Link href="/category/sale" legacyBehavior passHref>
                                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                    Sale
                                </NavigationMenuLink>
                            </Link>
                        </NavigationMenuItem> */}
                    </NavigationMenuList>
                </NavigationMenu>

                {/* Desktop Action Icons */}
                <div className="ml-auto flex items-center gap-2 md:gap-4">
                     <Button variant="ghost" size="icon"><Search className="h-5 w-5" /><span className="sr-only">Search</span></Button>
                     <Button variant="ghost" size="icon" asChild><Link href="/wishlist"><Heart className="h-5 w-5" /><span className="sr-only">Wishlist</span></Link></Button>
                     <Button variant="ghost" size="icon" asChild><Link href="/account"><User className="h-5 w-5" /><span className="sr-only">Account</span></Link></Button>
                     <Button variant="ghost" size="icon" asChild><Link href="/cart"><ShoppingBag className="h-5 w-5" /><span className="sr-only">Cart</span></Link></Button>
                </div>
            </div>
        </header>
    );
}