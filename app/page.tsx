"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import HeroSection from "@/components/hero-section"
import CategorySection from "@/components/category-section"
import FeaturedProducts from "@/components/featured-products"
import NewArrivals from "@/components/new-arrivals"
import Newsletter from "@/components/newsletter"
import AdvertisementBanner from "@/components/advertisement-banner"
import SpecialDeals from "@/components/special-deals"
import { useMobile } from "@/hooks/use-mobile"

export default function Home() {
  const isMobile = useMobile()

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen pb-20">
        <HeroSection />

        <AdvertisementBanner
          title="25% OFF All Gift Sets"
          subtitle="Use code: GIFT25"
          image="https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=800"
          buttonText="Shop Now"
          buttonLink="/category/gift-sets"
          badge="Limited Time"
          position="left"
          theme="primary"
        />

        <CategorySection />
        <NewArrivals />
      
        <FeaturedProducts />
        <Newsletter />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />

      <CategorySection />

      {/* First Advertisement Banner */}
      <AdvertisementBanner
        title="Limited Edition Collection"
        subtitle="Discover our exclusive summer fragrances"
        image="https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200"
        buttonText="Shop Now"
        buttonLink="/category/limited-edition"
        badge="New Release"
        position="left"
        theme="primary"
      />

      <NewArrivals />
      <FeaturedProducts />

      <section className="py-12 md:py-20 bg-secondary/20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Discover Our Signature Collection</h2>
              <p className="text-muted-foreground">
                Handcrafted with the finest ingredients, our signature collection offers a unique blend of scents that
                will captivate your senses.
              </p>
              <Button asChild>
                <Link href="/category/signature">
                  Shop Collection <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="relative aspect-square">
              <Image
                src="https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=600"
                alt="Signature Collection"
                fill
                className="object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <Newsletter />
    </div>
  )
}
