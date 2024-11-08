"use client";

import { useState, useEffect } from 'react';
import { Text, Button } from '@medusajs/ui';
import { ProductPreviewType } from 'types/global';
import { retrievePricedProductById } from '@lib/data';
import { getProductPrice } from '@lib/util/get-product-price';
import { Region } from '@medusajs/medusa';
import LocalizedClientLink from '@modules/common/components/localized-client-link';
import Thumbnail from '../thumbnail';
import PreviewPrice from './price';
import { useCart } from 'medusa-react';

export default function ProductPreview({
  productPreview,
  isFeatured,
  region,
}: {
  productPreview: ProductPreviewType;
  isFeatured?: boolean;
  region: Region;
}) {
  const { cart, addItem } = useCart(); // Use addItem from useCart
  const [pricedProduct, setPricedProduct] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  // Fetch priced product
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

  // Determine loading state
  const isLoading = !cart || !pricedProduct;

  // Conditional rendering after hooks
  if (isLoading) {
    return null; // Or render a loading indicator
  }

  // Get the cheapest price
  const { cheapestPrice } = getProductPrice({
    product: pricedProduct,
    region,
  });

  // Handle adding item to cart
  const handleAddToCart = async () => {
    if (!pricedProduct) {
      return;
    }

    setIsAdding(true);

    const variantId = pricedProduct.variants[0].id;

    try {
      await addItem({ variantId, quantity: 1 });
      // Optional: handle success feedback
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      // Optional: handle error feedback
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
      <Button
        onClick={handleAddToCart}
        isLoading={isAdding}
        disabled={isAdding}
        className="mt-2 w-full"
      >
        Add to Cart
      </Button>
    </div>
  );
}
