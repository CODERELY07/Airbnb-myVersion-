// import { createCategoryPage } from "@/app/actions";
import { CreationBottomBar } from "@/app/components/CreationBottomBar";
import { SelectedCategory } from "@/app/components/SelectedCategory";
import { createCategoryAction } from "@/lib/supabase/listings";

export default async function StructureRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <div className="w-3/5 mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight transition-colors">
          Which of these best describe your Home?
        </h2>
      </div>

      <form action={createCategoryAction}>
        <input type="hidden" name="listingId" value={id} />
        <SelectedCategory />
        <CreationBottomBar />
      </form>
    </>
  );
}