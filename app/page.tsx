
import Image from 'next/image';
import Link from 'next/link';
import { signOut } from './components/Auth/action';
import { createClient } from '@/utils/supabase/server';
import { MapFilterItems } from './components/MapFilterItems';
import { ClientGreeting } from './client-greetings';

export default async function Home() {

  return (
    <>
      <div className='container mx-auto px-5 lg:px-10'>
        <MapFilterItems/>
        <ClientGreeting/>
      </div>
    </>
  );
}
