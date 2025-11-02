'use client';

import { useEffect, useState } from 'react';
import { redirect, useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MenuIcon } from "lucide-react";
import AuthForm from "./Auth/AuthForm";
import { getClientUserProfile } from '@/lib/supabase/auth';
import { signOut } from './Auth/action';
import Link from 'next/link';
import { trpc } from '@/trpc/client';

const NavUser = () => {
  const [signinToggle, setSigninToggle] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const mutation = trpc.createListing.createListing.useMutation({
    onSuccess: (data) => {
      // console.log(data);
      return router.push(`/create/${data?.id}/${data?.type}`);
    },
    onError: (error) => {
      console.error('Failed to create listing:', error);
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getClientUserProfile();
      setUser(userData);
    };

    fetchUser();
  }, []);

  const createHomewithId = () => {
    if (!user?.id) {
      // console.error('User not logged in');
      return;
    }
    mutation.mutate({ userId: user.id });
  };
  
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="rounded-full border px-2 py-2 lg:px-4 lg:py-2 flex items-center gap-x-2 lg:gap-x-3">
            <MenuIcon className="w-5 h-5 lg:w-5 lg:h-5" />
            <img
              src={
                user?.avatar ??
                "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"
              }
              alt="User Avatar"
              className="w-7 h-7 lg:w-8 lg:h-8 rounded-full hidden sm:block"
            />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px] sm:w-[200px]">
          {user ? (
            <>
              <DropdownMenuItem disabled className="text-xs sm:text-sm">{user.name}</DropdownMenuItem>
              <DropdownMenuItem disabled className="text-xs sm:text-sm">{user.email}</DropdownMenuItem>
              <DropdownMenuItem>
                <form action={signOut} className="w-full">
                  <button className="btn text-xs sm:text-sm w-full text-left" type="submit">Sign Out</button>
                </form>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={createHomewithId}
                disabled={mutation.isPending}
                className="text-xs sm:text-sm"
              >
                {mutation.isPending ? 'Creating...' : 'Airbnb your Home'}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs sm:text-sm">
                <Link href='/my-listings' className='w-full'>
                  My Listings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs sm:text-sm">
                <Link href='/favorites' className='w-full'>
                  My Favorites
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs sm:text-sm">
                <Link href='/reservations' className='w-full'>
                  My Reservation
                </Link>
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={() => setSigninToggle(true)} className="text-xs sm:text-sm">
              Login or sign up
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {signinToggle && (
        <AuthForm toggleClick={() => setSigninToggle(false)} />
      )}
    </div>
  );
};

export default NavUser;