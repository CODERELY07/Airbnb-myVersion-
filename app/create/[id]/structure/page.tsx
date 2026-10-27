import { StructureForm } from "@/app/components/StructureForm";

export default async function StructureRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StructureForm listingId={id} />;
}
