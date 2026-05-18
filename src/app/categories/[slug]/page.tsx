import { redirect } from "next/navigation";

export default function CategoriesSlugRedirect({ params }: { params: { slug: string } }) {
  redirect(`/category/${params.slug}`);
}
