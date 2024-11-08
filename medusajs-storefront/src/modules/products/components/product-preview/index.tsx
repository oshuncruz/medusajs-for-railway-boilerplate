// Remove "use client" at the top to make it a Server Component.

import { Text } from "@medusajs/ui";
import { ProductPreviewType } from "types/global";
import { retrievePricedProductById } from "@lib/data";
import { getProductPrice } from "@lib/util/get-product-price";
import { Region } from "@medusajs/medusa";
import LocalizedClientLink from "@modules/common/components/localized-client-link";
import Thumbnail from "../thumbnail";
import PreviewPrice from "./price";
import { addToCart } from "@modules/cart/actions";

export default async function ProductPreview({
  productPreview,
  isFeatured,
  region,
}: {
  productPreview: ProductPreviewType;
  isFeatured?: boolean;
  region: Region;
}) {
  // Fetch the priced product data on the server side.
  const pricedProduct = await retrievePricedProductById({
    id: productPreview.id,
    regionId: region.id,
  });

  if (!pricedProduct) {
    return null;
  }

  const { cheapestPrice } = getProductPrice({
    product: pricedProduct,
    region,
  });

  // Define a server action to handle the form submission.
  async function handleAddToCart(formData: FormData) {
    "use server";

    const variantId = formData.get("variantId") as string;
    const quantity = Number(formData.get("quantity") || 1);
    const countryCode = region.countries[0]?.iso_2 || "us"; // Default to "us" if country code is unavailable.

    await addToCart({
      variantId,
      quantity,
      countryCode,
    });
  }

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

      {/* Add a form to handle the "Add to Cart" action */}
      <form action={handleAddToCart}>
        <input type="hidden" name="variantId" value={pricedProduct.variants[0].id} />
        <input type="hidden" name="quantity" value="1" />
        <button type="submit" className="mt-2 w-full">
          Add to Cart
        </button>
      </form>
    </div>
  );
}
