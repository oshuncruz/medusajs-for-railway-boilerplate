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

interface ProductPreviewProps {
  productPreview: ProductPreviewType;
  isFeatured?: boolean;
  region: Region;
}

export default function ProductPreview({
  productPreview,
  isFeatured = false,
  region,
}: ProductPreviewProps) {
  const { cart, addLineItem } = useCart();
  const [pricedProduct, setPricedProduct] = useState<any>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const product = await retrievePricedProductById({
          id: productPreview.id,
          regionId: region.id,
        });
        setPricedProduct(product);
      } catch (error) {
        console.error('Error fetching product:', error);
        // You might want to add error handling UI here
      }
    };

    fetchProduct();
  }, [productPreview.id, region.id]);

  const handleAddToCart = async () => {
    if (!pricedProduct || !cart?.id) {
      return;
    }

    setIsAdding(true);

    const variantId = pricedProduct.variants[0].id;

    try {
      await addLineItem({
        variant_id: variantId,
        quantity: 1,
      });
      // You could add a success notification here
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      // You could add an error notification here
    } finally {
      setIsAdding(false);
    }
  };

  // Show loading state or return null while data is being fetched
  if (!cart || !pricedProduct) {
    return null; // Or return a loading spinner component
  }

  const { cheapestPrice } = getProductPrice({
    product: pricedProduct,
    region,
  });

  return (
    <div className="group relative flex flex-col">
      <LocalizedClientLink 
        href={`/products/${productPreview.handle}`}
        className="flex-1"
      >
        <div className="relative">
          <Thumbnail
            thumbnail={productPreview.thumbnail}
            size="full"
            isFeatured={isFeatured}
          />
          <div className="flex txt-compact-medium mt-4 justify-between">
            <Text className="text-ui-fg-subtle truncate">
              {productPreview.title}
            </Text>
            <div className="flex items-center gap-x-2">
              {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
            </div>
          </div>
        </div>
      </LocalizedClientLink>
      
      <Button
        onClick={handleAddToCart}
        disabled={isAdding}
        isLoading={isAdding}
        className="mt-2 w-full"
      >
        {isAdding ? 'Adding...' : 'Add to Cart'}
      </Button>
    </div>
  );
}