"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useMobile } from "@/hooks/use-mobile"

export default function Newsletter() {
  const isMobile = useMobile()

  if (isMobile) {
    return (
      <section className="py-8 bg-primary/10 px-4">
        <div className="text-center space-y-3">
          <h2 className="text-xl font-bold">Join Our Newsletter</h2>
          <p className="text-sm text-muted-foreground">
            Subscribe to receive updates on new fragrances and exclusive offers.
          </p>
          <form className="flex flex-col gap-2 mt-4">
            <Input type="email" placeholder="Enter your email" className="flex-1" required />
            <Button type="submit" className="w-full">
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 md:py-16 bg-primary/10">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">Join Our Newsletter</h2>
          <p className="text-muted-foreground">
            Subscribe to receive updates on new fragrances, exclusive offers, and more.
          </p>
          <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto mt-6">
            <Input type="email" placeholder="Enter your email" className="flex-1" required />
            <Button type="submit">Subscribe</Button>
          </form>
        </div>
      </div>
    </section>
  )
}
