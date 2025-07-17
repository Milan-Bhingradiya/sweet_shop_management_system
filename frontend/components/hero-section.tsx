"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Heart,
  ShoppingBag,
} from "lucide-react";

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const sliderImages = [
    {
      url: "https://chowpattysweetsandsnacks.com/cdn/shop/files/ChatGPTImageMay10_2025_01_34_01PM.png?v=1746898448&width=640",
      title: "Traditional Sweets",
      subtitle: "Handcrafted with love and tradition",
    },
    {
      url: "https://manjulaskitchen.com/wp-content/uploads/peda.jpg",
      title: "Premium Peda Collection",
      subtitle: "Rich, creamy, and absolutely delicious",
    },
    {
      url: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjOvIGjB3tX9wJ94T8XbbU-Smhm0iCjMt1EwOESGziFmU8Y1idZGmP7J7dtrOj3GFu7kSbAf3NPPsJGf4OoaZs1s1tt-5fQuEk4jnYhPJ1cdBCEagnTEIdkEfe3rt72437hg1V7dNoqFfw/s1600/IMG_20200301_205037_compress36.jpg",
      title: "Festival Specials",
      subtitle: "Celebrate every moment with sweetness",
    },
    {
      url: "https://indiashopping.io/cdn/shop/files/1702383466_p.webp?v=1737629213&width=1200",
      title: "Gift Collections",
      subtitle: "Perfect presents for your loved ones",
    },
  ];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, sliderImages.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + sliderImages.length) % sliderImages.length
    );
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Touch/swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsAutoPlaying(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
    setTimeout(() => setIsAutoPlaying(true), 1000);
  };

  return (
    <section className="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden bg-gradient-to-br from-pink-50 to-orange-50">
      <div
        className="flex transition-transform duration-1000 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {sliderImages.map((slide, index) => (
          <div key={index} className="w-full flex-shrink-0 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60 z-10" />
            <img
              src={slide.url || "/placeholder.svg"}
              alt={`Sweet delights ${index + 1}`}
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="text-center text-white max-w-5xl px-4">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-sm ml-2 text-yellow-200">
                    Trusted by 10,000+ customers
                  </span>
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight">
                  Welcome to{" "}
                  <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 bg-clip-text text-transparent">
                    SimpleSweet
                  </span>
                </h1>

                <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-4 text-pink-200">
                  {slide.title}
                </h2>

                <p className="text-base md:text-lg lg:text-xl mb-8 max-w-3xl mx-auto text-gray-200 leading-relaxed">
                  {slide.subtitle} • Discover authentic handcrafted sweets made
                  with traditional recipes and premium ingredients
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link href="/products">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-lg px-8 py-4 rounded-full font-semibold shadow-2xl hover:shadow-pink-500/25 transition-all duration-300 hover:scale-105"
                    >
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      Shop Now
                    </Button>
                  </Link>
                  <Link href="/products">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-2 border-white/80 text-white hover:bg-white hover:text-gray-900 text-lg px-8 py-4 rounded-full font-semibold backdrop-blur-sm bg-white/10 transition-all duration-300 hover:scale-105"
                    >
                      <Heart className="w-5 h-5 mr-2" />
                      Browse Categories
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 md:p-4 transition-all duration-300 hover:scale-110 shadow-xl backdrop-blur-sm z-30"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-800" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 md:p-4 transition-all duration-300 hover:scale-110 shadow-xl backdrop-blur-sm z-30"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-800" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-30">
        {sliderImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "bg-white shadow-lg scale-125"
                : "bg-white/50 hover:bg-white/75 hover:scale-110"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-pink-400/20 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-orange-400/20 rounded-full blur-xl animate-pulse delay-1000" />
    </section>
  );
}
