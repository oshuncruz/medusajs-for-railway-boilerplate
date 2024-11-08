"use client";

import { useState, useEffect, useMemo } from "react";
import { Text, Button } from "@medusajs/ui";
import { ProductPreviewType } from "types/global";
import { Region } from "@medusajs/medusa";
import { PricedProduct } from "@medusajs/medusa/dist/types/pricing";
import { isEqual } from "lodash";
import { useParams } from "next/navigation";

import { retrievePricedProductById } from "@lib/data";
import { addToCart } from "@modules/cart/actions";
import LocalizedClientLink from "@modules/common/components/localized-client-link";
import Thumbnail from "../thumbnail";
import PreviewPrice from "./price";
import OptionSelect from "@modules/products/components/option-select";
import Divider from "@modules/common/components/divider";

export default function ProductPreview({
  productPreview,
  isFeatured,
  region,
}: {
  productPreview: ProductPreviewType;
  isFeatured?: boolean;
  region: Region;
}) {
  const [options, setOptions] = useState<Record<string, string>>({});
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

  const variants = pricedProduct.variants;

  // Initialize option state
  useEffect(() => {
    const optionObj: Record<string, string> = {};

    for (const option of pricedProduct.options || []) {
      Object.assign(optionObj, { [option.id]: undefined });
    }

    setOptions(optionObj);
  }, [pricedProduct]);

  // Create variant record mapping
  const variantRecord = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};

    for (const variant of variants) {
      if (!variant.options || !variant.id) continue;

      const temp: Record<string, string> = {};

      for (const option of variant.options) {
        temp[option.option_id] = option.value;
      }

      map[variant.id] = temp;
    }

    return map;
  }, [variants]);

  // Determine selected variant
  const variant = useMemo(() => {
    let variantId: string | undefined = undefined;

    for (const key of Object.keys(variantRecord)) {
      if (isEqual(variantRecord[key], options)) {
        variantId = key;
      }
    }

    return variants.find((v) => v.id === variantId);
  }, [options, variantRecord, variants]);

  // Auto-select variant if only one exists
  useEffect(() => {
    if (variants.length === 1 && variants[0].id) {
      setOptions(variantRecord[variants[0].id]);
    }
  }, [variants, variantRecord]);

  // Update options when user selects an option
  const updateOptions = (update: Record<string, string>) => {
    setOptions({ ...options, ...update });
  };

  // Determine if the variant is in stock
  const inStock = useMemo(() => {
    if (variant && !variant.inventory_quantity) {
      return false
    }

    if (variant && variant.allow_backorder === false) {
      return true
    }
  }, [variant])

  const handleAddToCart = async () => {
    if (!variant?.id) {
      console.error("No variant selected");
      return;
    }

    setIsAdding(true);

    try {
      await addToCart({
        variantId: variant.id,
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

      {/* Option Selection */}
      {pricedProduct.variants.length > 1 && (
        <div className="flex flex-col gap-y-4 mt-4">
          {(pricedProduct.options || []).map((option) => {
            return (
              <div key={option.id}>
                <OptionSelect
                  option={option}
                  current={options[option.id]}
                  updateOption={updateOptions}
                  title={option.title}
                />
              </div>
            );
          })}
          <Divider />
        </div>
      )}

      {/* Add to Cart Button */}
      <Button
        onClick={handleAddToCart}
        disabled={!inStock || !variant}
        variant="primary"
        className="mt-2 w-full"
        isLoading={isAdding}
      >
        {!variant
          ? "Select variant"
          : !inStock
          ? "Out of stock"
          : "Add to cart"}
      </Button>
    </div>
  );
}
