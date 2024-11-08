import { Suspense } from "react"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "./paginated-products"
import { Button } from "@medusajs/ui"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
  inStock, // Pass inStock as a prop if available, or determine it within the component
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  inStock?: boolean
}) => {
  const pageNumber = page ? parseInt(page) : 1

  return (
    <div className="flex flex-col small:flex-row small:items-start py-6 content-container">
      <RefinementList sortBy={sortBy || "created_at"} />
      <div className="w-full">
        <div className="mb-8 text-2xl-semi">
          <h1>All products</h1>
          {/* Add the Button below the product name */}
          <Button
            variant="primary"
            className="mt-4"
            disabled={!inStock}
          >
            {inStock ? "Add to Cart" : "Out of Stock"}
          </Button>
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sortBy || "created_at"}
            page={pageNumber}
            countryCode={countryCode}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate
