
import { StructureForm } from "@/app/components/StructureForm";

export default async function StructureRoute({ 
  params 
}: { 
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <div className="w-11/12 sm:w-4/5 lg:w-3/5 mx-auto px-4 sm:px-0">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight transition-colors">
          Which of these best describe your Home?
        </h2>
      </div>

      <StructureForm listingId={id} />
    </>
  );
}