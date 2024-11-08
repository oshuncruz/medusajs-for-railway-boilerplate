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
import { useCart, useCreateLineItem } from 'medusa-react';

export default function ProductPreview({
  productPreview,
  isFeatured,
  region,
}: {
  productPreview: ProductPreviewType;
  isFeatured?: boolean;
  region: Region;
}) {
  const { cart } = useCart();

  // Call useCreateLineItem without arguments
  const { mutate: addItem, isLoading: isAdding } = useCreateLineItem();
  const [pricedProduct, setPricedProduct] = useState(null);

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

  // Handle cases where cart or product data is not yet available
  const isLoading = !cart || !pricedProduct;

  const handleAddToCart = () => {
    if (!pricedProduct || !cart?.id) {
      return;
    }

    const variantId = pricedProduct.variants[0].id;

    addItem(
      {
        cart_id: cart.id,
        variant_id: variantId,
        quantity: 1,
      },
      {
        onSuccess: () => {
          // Optional: handle success feedback
        },
        onError: (error) => {
          console.error('Failed to add item to cart:', error);
        },
      }
    );
  };

  if (isLoading) {
    // Optionally render a loading state while cart or product is being fetched
    return null;
  }

  const { cheapestPrice } = getProductPrice({
    product: pricedProduct,
    region,
  });

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
        disabled={isAdding || !cart || !pricedProduct}
        className="mt-2 w-full"
      >
        Add to Cart
      </Button>
    </div>
  );
}
