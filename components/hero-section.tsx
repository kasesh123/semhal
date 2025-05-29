"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button"; // Assuming Button component is here
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { useMobile } from "@/hooks/use-mobile";

const API_BASE_URL = "http://localhost:5000";

// --- Interfaces ---
interface FeaturedProductData {
    id: number; name: string; price: number; image: string; href: string;
}
interface ApiProduct {
    id: number; name: string; base_price: string; images: string; category_id: number; is_featured?: boolean; is_new_arrival?: boolean;
}
interface ProductsApiResponse { products: ApiProduct[]; pagination?: any; }
// --- End Interfaces ---

// --- Static Slider Content ---
const sliderContent = [
    { id: 1, title: "EXPLORE", subtitle: "THE TRENDS", buttonText: "", buttonLink: "/category/trends", image: "https://images.unsplash.com/photo-1515886657471-8375bdb8fdc5?q=80&w=800" },
    { id: 2, title: "Mom-Worthy Deals", subtitle: "TOP SELLERS", highlight: "300K+", badgeText: "SALE BIG", buttonText: "SAVE NOW >>", buttonLink: "/category/sale", image: "https://images.unsplash.com/photo-1529903384028-929ae5dccdf1?q=80&w=800" },
];
// --- End Static Slider Content ---

export default function HeroSection() {
    // --- State for Slider ---
    const [currentSlide, setCurrentSlide] = useState(0);
    const [activeSlide, setActiveSlide] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isMobile = useMobile();

    // --- State for Featured Products ---
    const [featuredProducts, setFeaturedProducts] = useState<FeaturedProductData[]>([]);
    const [loadingFeatured, setLoadingFeatured] = useState(true);
    const [errorFeatured, setErrorFeatured] = useState<string | null>(null);

    // --- Slider Logic ---
    const resetTimeout = () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    useEffect(() => {
        resetTimeout();
        timeoutRef.current = setTimeout(() => {
            const nextSlide = currentSlide === sliderContent.length - 1 ? 0 : currentSlide + 1;
            setCurrentSlide(nextSlide);
            setActiveSlide(nextSlide);
        }, 5000);
        return () => { resetTimeout(); };
    }, [currentSlide]);
    const goToPrevSlide = () => { const prevSlide = currentSlide === 0 ? sliderContent.length - 1 : currentSlide - 1; setCurrentSlide(prevSlide); setActiveSlide(prevSlide); };
    const goToNextSlide = () => { const nextSlide = currentSlide === sliderContent.length - 1 ? 0 : currentSlide + 1; setCurrentSlide(nextSlide); setActiveSlide(nextSlide); };
    // --- End Slider Logic ---

    // --- Fetch Featured Products ---
    useEffect(() => {
        const fetchFeatured = async () => {
            setLoadingFeatured(true); setErrorFeatured(null);
            try {
                const response = await fetch(`${API_BASE_URL}/api/products?limit=6`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: ProductsApiResponse = await response.json();
                if (!data || !Array.isArray(data.products)) throw new Error("Invalid data format for products.");

                const featured = data.products
                    .filter(product => product.is_featured === true)
                    .map((product): FeaturedProductData | null => {
                        try {
                            let imageUrl = "/placeholder.svg?height=300&width=300";
                            if (product.images) {
                                const paths = JSON.parse(product.images);
                                if (Array.isArray(paths) && paths.length > 0) imageUrl = `${API_BASE_URL}/uploads/${paths[0]}`;
                            }
                            const price = parseFloat(product.base_price);
                            return { id: product.id, name: product.name, price: !isNaN(price) ? price : 0, image: imageUrl, href: `/product/${product.id}` };
                        } catch (e) { console.error("Error processing product", product.id, e); return null; }
                    })
                    .filter((p): p is FeaturedProductData => p !== null);
                setFeaturedProducts(featured);
            } catch (err) { setErrorFeatured(err instanceof Error ? err.message : "Failed to load featured products."); console.error(err); }
            finally { setLoadingFeatured(false); }
        };
        fetchFeatured();
    }, []);
    // --- End Fetch Featured Products ---

    // --- Mobile Rendering ---
    if (isMobile) {
        return (
            <div className="flex flex-col bg-gray-50">
                {/* Mobile Header */}
                <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm">
                    {/* ... Header Content ... */}
                     <div className="flex items-center"><span className="font-bold text-pink-500 text-lg">SHOP</span></div>
                     <div className="flex items-center space-x-3"><button className="relative"><ShoppingBag className="h-6 w-6 text-gray-700" /><span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">2</span></button></div>
                </div>
                {/* Mobile Slider */}
                <div className="relative w-full h-[200px] bg-gray-100">
                    {/* ... Slider Content & Controls ... */}
                     <div className="h-full relative">
                        {sliderContent.map((slide, index) => (
                            <div key={index} className={`absolute inset-0 transition-opacity duration-500 ${ activeSlide === index ? "opacity-100 z-10" : "opacity-0 z-0" }`}>
                                {index === 0 ? ( <div className="relative h-full"><Image src={slide.image || "/placeholder.svg"} alt={slide.title} fill className="object-cover object-center" priority={index === 0} /><div className="absolute inset-0 bg-black/30 flex items-center justify-center"><div className="text-center text-white"><h2 className="text-3xl font-bold">{slide.title}</h2><p className="text-xl font-bold">{slide.subtitle}</p></div></div></div> )
                                : ( <div className="absolute inset-0 bg-gradient-to-r from-pink-300 to-pink-200 flex items-center"><div className="w-full px-6"><div className="flex flex-col items-start"><h2 className="text-2xl font-bold text-black/80 mb-2 font-script">{slide.title}</h2><div className="flex items-center"><div className="bg-pink-500 text-white p-1 rounded-full"><span className="text-xs">{slide.badgeText}</span></div><span className="text-4xl font-bold text-pink-500 mx-2">{slide.highlight}</span></div><p className="text-xl font-bold text-pink-500 mb-4">{slide.subtitle}</p>
                                {/* CHECK 1: Mobile Sale Button - Must have only Link as child */}
                                <Button className="bg-black text-white hover:bg-black/80 rounded-full px-4 text-sm" asChild><Link href={slide.buttonLink}>{slide.buttonText}</Link></Button>
                                {/* END CHECK 1 */}
                                </div></div></div> )}
                            </div>
                        ))}
                         <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center space-x-2">{sliderContent.map((_, index) => ( <button key={index} onClick={() => setActiveSlide(index)} className={`w-2 h-2 rounded-full transition-all ${ activeSlide === index ? "bg-white w-4" : "bg-white/50" }`} aria-label={`Go to slide ${index + 1}`} /> ))}</div>
                    </div>
                </div>
                {/* Mobile Sale Zone */}
                <div className="bg-gradient-to-r from-pink-500 to-pink-400 p-4 flex justify-between items-center relative">
                    {/* ... Sale Zone Content ... */}
                     <div className="absolute -top-5 -left-2 bg-white rounded-full w-14 h-14 flex items-center justify-center rotate-12 shadow-lg"><span className="text-pink-500 font-bold text-xs">SALE</span></div>
                     <div className="ml-8"><h2 className="text-2xl font-bold text-white leading-tight">SALE ZONE</h2><p className="text-white text-xs">Super coupons every day!</p></div>
                    {/* CHECK 2: Mobile Sale Button - Must have only Link as child */}
                    <Button className="bg-black text-white hover:bg-black/80 rounded-sm text-xs px-3 py-1 h-auto" asChild>
                        <Link href="/category/sale">CLICK TO GET</Link>
                    </Button>
                    {/* END CHECK 2 */}
                </div>
                {/* Mobile Featured Products */}
                <div className="p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold flex items-center text-pink-600">Featured Products</h2>
                        <Link href="/products?featured=true" className="text-xs text-gray-500">View All</Link>
                    </div>
                     {loadingFeatured ? (<div className="text-center text-gray-500">Loading...</div>)
                     : errorFeatured ? (<div className="text-center text-red-500">{errorFeatured}</div>)
                     : featuredProducts.length === 0 ? (<div className="text-center text-gray-500">No featured products available.</div>)
                     : (<div className="grid grid-cols-2 gap-3"> {featuredProducts.slice(0, 4).map((product) => (<Link href={product.href} key={product.id} className="relative group overflow-hidden rounded-md"><div className="relative aspect-square bg-gray-50"><Image src={product.image} alt={product.name} fill className="object-cover" sizes="(max-width: 640px) 50vw, 150px" /><div className="absolute bottom-2 right-2 bg-white text-pink-500 text-xs px-2 py-1 rounded-full font-bold shadow-sm">${product.price.toFixed(2)}</div></div></Link>))}</div>)}
                </div>
                {/* Mobile Limited Edition Banner */}
                <div className="bg-gradient-to-r from-pink-300 to-purple-300 p-2 flex items-center">
                    {/* ... Banner Content ... */}
                     <div className="bg-green-500 text-white text-xs px-2 py-0.5">New Release</div>
                     <h3 className="text-sm font-bold ml-2 text-white">Limited Edition Collection</h3>
                </div>
            </div>
        );
    }

    // --- Desktop Rendering ---
    return (
        <section className="relative w-full">
            <div className="flex" style={{ height: '280px' }}>
                {/* Left Panel - Sale Zone */}
                <div className="w-1/4 bg-gradient-to-b from-pink-500 to-pink-400 flex flex-col justify-center items-center text-center p-4 relative overflow-hidden" style={{ height: '280px' }}>
                    {/* ... Sale Zone Content ... */}
                     <div className="absolute inset-0 opacity-20 flex flex-wrap justify-center items-center"> {Array.from({ length: 20 }).map((_, i) => ( <div key={i} className="text-white text-xs font-bold rotate-[-30deg] m-1 whitespace-nowrap"> SALE ZONE </div> ))} </div>
                    <div className="z-10"> <h1 className="text-6xl font-bold text-white mb-2 leading-none">SALE</h1> <h1 className="text-6xl font-bold text-white mb-4 leading-none">ZONE</h1> <p className="text-white text-sm mb-6">Super coupons every day!</p>
                    {/* CHECK 3: Desktop Sale Button - Must have only Link as child */}
                    <Button className="w-full bg-black text-white hover:bg-black/80 rounded-sm font-bold text-sm" asChild>
                        <Link href="/category/sale">CLICK TO GET</Link>
                    </Button>
                    {/* END CHECK 3 */}
                     </div>
                     <div className="absolute -bottom-6 -left-6 bg-pink-600 w-24 h-24 flex items-center justify-center rounded-full text-xs text-white font-bold rotate-[-15deg]"> SALE ZONE </div>
                </div>

                {/* Middle Panel - Slider */}
                <div className="w-2/4 relative overflow-hidden" style={{ height: '280px' }}>
                    {/* ... Slider Content & Controls ... */}
                    {/* Slides */}
                     <div className="h-full relative">
                         {/* Slide 1 */}
                         <div className={`absolute inset-0 transition-opacity duration-1000 ${ currentSlide === 0 ? "opacity-100" : "opacity-0" }`}>
                             <div className="absolute inset-0"><Image src={sliderContent[0].image || "/placeholder.svg"} alt="Explore the trends" fill className="object-cover object-center" priority /><div className="absolute inset-0 bg-black/20"></div></div>
                             <div className="absolute inset-0 flex items-center justify-center"><div className="text-center text-white"><h2 className="text-5xl font-bold">{sliderContent[0].title}</h2><h3 className="text-3xl font-bold">{sliderContent[0].subtitle}</h3></div></div>
                         </div>
                         {/* Slide 2 */}
                         <div className={`absolute inset-0 transition-opacity duration-1000 ${ currentSlide === 1 ? "opacity-100" : "opacity-0" }`}>
                             <div className="absolute inset-0 bg-gradient-to-r from-pink-300 to-pink-200 flex items-center">
                                <div className="w-1/2 pl-12"> <div className="flex flex-col items-start"> <h2 className="text-4xl font-bold text-black/80 mb-2 font-script">{sliderContent[1].title}</h2> <div className="flex items-center"> <div className="bg-pink-500 text-white p-1 px-2 rounded-full"><span className="text-xs font-bold">{sliderContent[1].badgeText}</span></div> <span className="text-7xl font-bold text-pink-500 mx-2">{sliderContent[1].highlight}</span> </div> <p className="text-3xl font-bold text-pink-500 mb-4">{sliderContent[1].subtitle}</p>
                                {/* CHECK 4: Desktop Slider Button - Must have only Link as child */}
                                <Button className="bg-black text-white hover:bg-black/80 rounded-full px-6" asChild>
                                    <Link href={sliderContent[1].buttonLink}>{sliderContent[1].buttonText}</Link>
                                </Button>
                                {/* END CHECK 4 */}
                                </div> </div>
                                <div className="absolute right-0 h-full w-3/5"><Image src={sliderContent[1].image || "/placeholder.svg"} alt="Mom-Worthy Deals" fill className="object-cover object-center" /></div>
                            </div>
                         </div>
                     </div>
                     {/* Slide Controls */}
                     <button onClick={goToPrevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/50 rounded-full p-2" aria-label="Previous slide"><ChevronLeft className="h-6 w-6 text-black" /></button>
                     <button onClick={goToNextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/50 rounded-full p-2" aria-label="Next slide"><ChevronRight className="h-6 w-6 text-black" /></button>
                     {/* Slide Indicators */}
                     <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">{sliderContent.map((_, index) => ( <button key={index} onClick={() => setCurrentSlide(index)} className={`w-2 h-2 rounded-full transition-all ${ currentSlide === index ? "bg-white w-6" : "bg-white/50 hover:bg-white/80" }`} aria-label={`Go to slide ${index + 1}`} /> ))}</div>
                </div>

                {/* Right Panel - Featured Products */}
                <div className="w-1/4 bg-white p-2 flex flex-col" style={{ height: '280px' }}>
                    <div className="flex justify-between items-center mb-1">
                        <h2 className="text-sm font-bold text-pink-600">Featured Products</h2>
                        <Link href="/products?featured=true" className="text-xs text-gray-500 hover:text-pink-600">View All</Link>
                    </div>
                     {loadingFeatured ? ( <div className="flex-1 flex items-center justify-center text-gray-500">Loading...</div> )
                     : errorFeatured ? ( <div className="flex-1 flex items-center justify-center text-red-500 text-xs p-2">{errorFeatured}</div> )
                     : featuredProducts.length === 0 ? ( <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">No featured products.</div> )
                     : ( <div className="grid grid-cols-3 grid-rows-2 gap-1 flex-1"> {featuredProducts.slice(0, 6).map((product) => (<Link href={product.href} key={product.id} className="relative group overflow-hidden rounded-md"><div className="relative aspect-square bg-gray-50"><Image src={product.image} alt={product.name} fill className="object-cover" sizes="(max-width: 1024px) 10vw, 80px" /><div className="absolute bottom-1 right-1 bg-white text-pink-500 text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">${product.price.toFixed(2)}</div></div></Link>))}</div> )}
                </div>
            </div>

            {/* New Release Banner */}
            <div className="relative w-full bg-gradient-to-r from-pink-300 to-purple-300 h-10 flex items-center">
                 <div className="bg-green-500 text-white text-xs px-2 py-0.5 ml-4">New Release</div>
                 <h3 className="text-lg font-bold ml-4 text-white">Limited Edition Collection</h3>
            </div>
        </section>
    );
}