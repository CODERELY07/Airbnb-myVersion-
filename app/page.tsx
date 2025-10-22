import { connection } from 'next/server';
import { MapFilterItems } from './components/MapFilterItems';

export default async function Home() {
  await connection()

  return (
    <>
      <div className='container mx-auto px-5 lg:px-10'>
        <MapFilterItems/>
      </div>
    </>
  );
}
