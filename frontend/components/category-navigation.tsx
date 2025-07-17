"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "@/lib/api/categories";
import { ChevronRight, Sparkles } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  color?: string;
}

interface CategoryNavigationProps {
  className?: string;
}

const categoryColors = [
  "from-amber-500 to-orange-500",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-emerald-500",
  "from-purple-500 to-pink-500",
  "from-teal-500 to-green-500",
  "from-red-500 to-pink-500",
  "from-indigo-500 to-purple-500",
  "from-yellow-500 to-amber-500",
];

const categoryIcons = ["🍯", "🥛", "🌰", "🎉", "🌿", "🎁", "🌸", "💎"];

export function CategoryNavigation({
  className = "",
}: CategoryNavigationProps) {
  const {
    data: categories,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getCategories,
    retry: 1,
  });

  const handleCategoryClick = (categoryId: string, categoryName: string) => {
    console.log("Category clicked:", { id: categoryId, name: categoryName });
    // You can add additional logic here if needed
  };

  return (
    <section
      className={`py-6 bg-gradient-to-r from-pink-50 via-white to-orange-50 border-b border-pink-100 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-pink-600" />
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
              Shop by Category
            </h2>
          </div>
          {/* <Link
            href="/categories"
            className="hidden md:flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium transition-colors"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Link> */}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 rounded-2xl h-24 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-gray-500">
            Failed to load categories
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories?.data?.categories?.map(
              (category: any, index: number) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.id}`}
                  onClick={() =>
                    handleCategoryClick(category.id, category.name)
                  }
                  className="group relative bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 hover:border-pink-200"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${
                      categoryColors[index % categoryColors.length]
                    } opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}
                  />
                  <div className="relative z-10 text-center">
                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
                      {category.icon ||
                        categoryIcons[index % categoryIcons.length]}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800 group-hover:text-pink-700 transition-colors leading-tight">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}
