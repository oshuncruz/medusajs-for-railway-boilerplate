"use client";

import { useState, useEffect, useMemo } from "react";
import { Text, Button } from "@medusajs/ui";
import { ProductPreviewType } from "types/global";
import { retrievePricedProductById } from "@lib/data";
import { getProductPrice } from "@lib/util/get-product-price";
import { Region } from "@medusajs/medusa";
import { PricedProduct } from "@medusajs/medusa/dist/types/pricing";
import LocalizedClientLink from "@modules/common/components/localized-client-link";
import Thumbnail from "../thumbnail";
import PreviewPrice from "./price";
import { addToCart } from "@modules/cart/actions";
import { useParams } from "next/navigation";

export default function ProductPreview({
  productPreview,
  isFeatured,
  region,
}: {
  productPreview: ProductPreviewType;
  isFeatured?: boolean;
  region: Region;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [pricedProduct, setPricedProduct] = useState<PricedProduct | null>(null);

  const params = useParams();
  const countryCode = (params.countryCode as string) || "us"; // Adjust as needed

  useEffect(() => {
    const fetchProduct = async () => {
      const product = await retrievePricedProductById({
        id: productPreview.id,
        regionId: region.id,
      });
      setPricedProduct(product);
    };

    fetchProduct();
  }, [productPreview.id, region.id]);

  if (!pricedProduct) {
    return null; // Or a loading indicator
  }

  const { cheapestPrice } = getProductPrice({
    product: pricedProduct,
    region,
  });

  // Get the first variant
  const variant = pricedProduct.variants[0];

  if (!variant) {
    console.error("No variants available for this product");
    return null;
  }

  // Determine if the variant is in stock, similar to ProductActions
  const inStock = useMemo(() => {
    if (!variant) return false;

    if (!variant.manage_inventory) {
      return true;
    }

    if (variant.inventory_quantity > 0) {
      return true;
    }

    if (variant.allow_backorder) {
      return true;
    }

    return false;
  }, [variant]);

  const handleAddToCart = async () => {
    const variantId = variant.id;

    if (!variantId) {
      console.error("Variant ID is undefined");
      return;
    }

    setIsAdding(true);

    try {
      await addToCart({
        variantId,
        quantity: 1,
        countryCode,
      });
      // Optionally, provide user feedback or refresh cart state
    } catch (error) {
      console.error("Failed to add item to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="group">
      <LocalizedClientLink href={`/products/${productPreview.handle}`}>
        <div>
          <Thumbnail
            thumbnail={productPreview.thumbnail}
            size="full"
            isFeatured={isFeatured}
          />
          <div className="flex txt-compact-medium mt-4 justify-between">
            <Text className="text-ui-fg-subtle">{productPreview.title}</Text>
            <div className="flex items-center gap-x-2">
              {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
            </div>
          </div>
        </div>
      </LocalizedClientLink>

      {/* Add "Add to Cart" button */}
      <Button
        onClick={handleAddToCart}
        isLoading={isAdding}
        disabled={isAdding || !inStock}
        className="mt-2 w-full"
      >
        {!inStock ? "Out of Stock" : "Add to Cart"}
      </Button>
    </div>
  );
}
