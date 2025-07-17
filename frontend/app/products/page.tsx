"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { ProductCard } from "@/components/product-card";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<
    number | undefined
  >();
  const [page, setPage] = useState(1);

  // Handle category from URL params
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    if (categoryFromUrl) {
      setSelectedCategory(Number(categoryFromUrl));
    }
  }, [searchParams]);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", page, selectedCategory],
    queryFn: () =>
      productsApi.getProducts({
        page,
        limit: 12,
        ...(selectedCategory && { categoryId: selectedCategory }),
      }),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.getCategories,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Categories Bar - Same as home page */}
      <section className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-6 overflow-x-auto scrollbar-hide">
            <div
              onClick={() => setSelectedCategory(undefined)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                !selectedCategory
                  ? "bg-pink-100 text-pink-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Products
            </div>
            {categories?.data?.categories &&
            Array.isArray(categories.data.categories)
              ? categories.data.categories.map((category: any) => (
                  <div
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors whitespace-nowrap ${
                      selectedCategory === category.id
                        ? "bg-pink-100 text-pink-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {category.name}
                  </div>
                ))
              : null}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Our Products</h1>
            <p className="text-gray-600 mt-2">
              {selectedCategory
                ? `Showing products in ${
                    categories?.data?.categories?.find(
                      (c: any) => c.id === selectedCategory
                    )?.name || "selected category"
                  }`
                : "Browse our complete collection of delicious sweets"}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Select
              value={selectedCategory?.toString() || "all"}
              onValueChange={(value) =>
                setSelectedCategory(value === "all" ? undefined : Number(value))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.data?.categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm border animate-pulse"
              >
                <div className="w-full h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products?.data?.products &&
              Array.isArray(products.data.products) ? (
                products.data.products.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="text-center col-span-full py-12">
                  <div className="text-gray-500 text-lg mb-4">
                    {selectedCategory
                      ? "No products found in this category"
                      : "No products available"}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCategory(undefined)}
                  >
                    {selectedCategory ? "Show All Products" : "Refresh"}
                  </Button>
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-8 space-x-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">Page {page}</span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={
                  !products?.data?.products ||
                  products.data.products.length < 12
                }
              >
                Next
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
