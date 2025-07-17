"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCartStore } from "@/lib/stores/cart-store";
import { useHydration } from "@/hooks/use-hydration";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/api/products";
import { Plus } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const isHydrated = useHydration();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_urls[0],
    });

    toast({
      title: "Added to cart!",
      description: `${product.name} has been added to your cart`,
      duration: 3000,
    });
  };

  return (
    <Card className="h-full">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image
            src={
              product.image_urls[0] || "/placeholder.svg?height=200&width=300"
            }
            alt={product.name}
            fill
            className="object-cover rounded-t-lg"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg mb-2">{product.name}</CardTitle>
        <p className="text-gray-600 text-sm mb-2">{product.description}</p>
        <p className="text-2xl font-bold text-pink-600">₹{product.price}</p>
        <p className="text-sm text-gray-500">Stock: {product.stock_quantity}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleAddToCart}
          className="w-full"
          disabled={product.stock_quantity === 0 || !isHydrated}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
