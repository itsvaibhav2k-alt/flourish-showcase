"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

const navigation = [
  { name: "Features", href: "/features" },
  { name: "Pricing", href: "/pricing" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
]

export function MarketingHeader() {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <header className="relative z-50 bg-white/60 backdrop-blur-md border-b border-primary-100/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative">
        {/* Logo - Left */}
        <Link href="/" className="flex items-center group transition-smooth group-hover:opacity-80 z-10">
          <Image
            src="/logo.png"
            alt="Flourish"
            width={200}
            height={52}
            className="h-13 w-auto"
            style={{ height: '52px' }}
            priority
          />
        </Link>

        {/* Desktop Navigation - Absolutely Centered */}
        <nav className="hidden lg:flex items-center space-x-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="px-4 py-2 text-neutral-600 hover:text-neutral-900 hover:bg-primary-50/80 transition-smooth font-medium rounded-lg"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA Buttons - Right */}
        <div className="hidden lg:flex items-center space-x-3 z-10">
          <Link href="/login">
            <Button
              variant="ghost"
              className="text-neutral-600 hover:text-neutral-900 hover:bg-primary-50/80 transition-smooth font-medium"
            >
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-gradient-primary hover:opacity-90 text-white border-0 shadow-lg shadow-primary-500/20 transition-smooth hover:shadow-primary-500/35 hover:scale-[1.02] font-medium">
              Get started free
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[350px]">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <Image
                  src="/logo.png"
                  alt="Flourish"
                  width={120}
                  height={30}
                  className="h-8 w-auto"
                />
              </div>

              <nav className="flex flex-col space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-3 text-neutral-700 hover:text-neutral-900 hover:bg-primary-50 transition-smooth font-medium rounded-lg"
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto pt-8 space-y-3">
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full justify-center"
                  >
                    Sign in
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setIsOpen(false)}>
                  <Button className="w-full justify-center bg-gradient-primary hover:opacity-90 text-white border-0 shadow-lg shadow-primary-500/20">
                    Get started free
                  </Button>
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
