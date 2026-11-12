import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin";
import type { ProductRow } from "@/lib/supabase/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  const { supabase } = await requireAdmin();
  const { id } = await props.params;

  if (id === "new") {
    return (
      <>
        <PageTitle>New product</PageTitle>
        <ProductForm product={null} />
      </>
    );
  }
  if (!UUID.test(id)) notFound();
  const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const product = data as ProductRow;

  return (
    <>
      <PageTitle>
        {product.name} — {product.color}
      </PageTitle>
      <ProductForm product={product} />
    </>
  );
}
