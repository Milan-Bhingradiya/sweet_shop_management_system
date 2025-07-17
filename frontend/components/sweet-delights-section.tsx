import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SweetDelightsSection() {
  return (
    <section className="py-16 bg-gradient-to-r from-pink-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Sweet <span className="text-pink-600">Delights</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Indulge in our exquisite collection of traditional sweets, crafted
            with passion and perfection. Each bite tells a story of heritage,
            quality, and unmatched taste.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="h-48 bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-16 h-16 text-pink-600 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <p className="text-pink-600 font-semibold">
                  Traditional Recipes
                </p>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Time-Honored Traditions
              </h3>
              <p className="text-gray-600">
                Passed down through generations, our recipes preserve the
                authentic flavors of traditional sweets.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="h-48 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-16 h-16 text-orange-600 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-orange-600 font-semibold">Premium Quality</p>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Finest Ingredients
              </h3>
              <p className="text-gray-600">
                We use only the highest quality ingredients sourced from trusted
                suppliers to ensure excellence.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="w-16 h-16 text-green-600 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <p className="text-green-600 font-semibold">Fresh Daily</p>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Made Fresh Daily
              </h3>
              <p className="text-gray-600">
                Every sweet is prepared fresh daily to ensure you receive the
                best taste and quality.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/products">
            <Button
              size="lg"
              className="bg-pink-600 hover:bg-pink-700 text-white px-12 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:scale-105"
            >
              Explore Our Collection
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
