"use client";

import Link from "next/link";
import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteListing } from "@/lib/supabase/listings";
import { ListingCardShell, type ListingCardShellProps } from "./ListingCardShell";

// Listing card with edit / delete actions for the owner
export function UpdateListingCard(props: Omit<ListingCardShellProps, "action">) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await deleteListing(props.listingId); // redirects on success
    } catch (err) {
      // Next.js redirects are thrown as errors: let them through
      if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw err;
      console.error("Failed to delete listing:", err);
      setError("Could not delete this listing. Please try again.");
      setIsDeleting(false);
    }
  };

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Listing actions"
        className="grid size-9 place-items-center rounded-full bg-white/95 shadow-md ring-1 ring-black/5 transition hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link href={`/edit/${props.listingId}/structure`}>
            <Pencil />
            Edit listing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => setIsDeleteDialogOpen(true)}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <ListingCardShell {...props} action={menu} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl font-medium">Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{props.title}&rdquo; and its photo will be removed for good. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="rounded-full bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
