"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, Heart, House, LogOut, Menu, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getClientUserProfile } from "@/lib/supabase/auth";
import { trpc } from "@/trpc/client";
import AuthForm from "./Auth/AuthForm";
import { signOut } from "./Auth/action";
import { Avatar } from "./Avatar";

type Profile = Awaited<ReturnType<typeof getClientUserProfile>>;

const menuLinks = [
  { href: "/my-listings", label: "My listings", icon: House },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/reservations", label: "Reservations", icon: CalendarCheck },
];

const NavUser = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<Profile>(null);
  const router = useRouter();

  const createListing = trpc.createListing.createListing.useMutation({
    onSuccess: (data) => router.push(`/create/${data?.id}/${data?.type}`),
    onError: (error) => console.error("Failed to create listing:", error),
  });

  useEffect(() => {
    getClientUserProfile().then(setUser);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    // full reload so the menu doesn't keep the old user
    window.location.href = "/";
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account menu"
          className="flex items-center gap-2.5 rounded-full border bg-card py-1 pl-3 pr-1 shadow-xs transition hover:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Menu className="size-4" />
          <Avatar src={user?.avatar} name={user?.name} className="size-8" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" sideOffset={8} className="w-60 rounded-xl p-1.5">
          {user ? (
            <>
              <DropdownMenuLabel className="px-2 py-2">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={createListing.isPending}
                onSelect={() => user.id && createListing.mutate({ userId: user.id })}
                className="font-medium"
              >
                <Plus />
                {createListing.isPending ? "Creating…" : "List your home"}
              </DropdownMenuItem>
              {menuLinks.map(({ href, label, icon: Icon }) => (
                <DropdownMenuItem key={href} asChild>
                  <Link href={href}>
                    <Icon />
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSignOut}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onSelect={() => setShowAuth(true)} className="font-medium">
              Log in or sign up
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {showAuth && <AuthForm toggleClick={() => setShowAuth(false)} />}
    </>
  );
};

export default NavUser;
