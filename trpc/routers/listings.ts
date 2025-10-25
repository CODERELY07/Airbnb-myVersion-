  // server/routers/home.ts
  // TODO:: It can insert now just follow the tutorial at 2:07:03
  // but we're fixing this in our own next is we need after adding category go to the description
  import { z } from 'zod';

  import { TRPCError } from '@trpc/server';

  import { baseProcedure, createTRPCRouter } from '../init';
  import { createClient } from '@/utils/supabase/server';
  import { addToFavorite } from '@/lib/supabase/listings';
  import { revalidatePath } from 'next/cache';
  import path from 'path';


  export const homeRouter = createTRPCRouter({
    createListing: baseProcedure
      .input(
        z.object({
          userId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { userId } = input;
        const supabase = await createClient();

        // Find the most recent home for this user
        const { data: existingListings, error: fetchError } = await supabase
          .from('listings')
          .select('*')
          .eq('userId', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
      
        if (!existingListings) {
      
          const { data: newListings, error: createError } = await supabase
            .from('listings')
            .insert({ userId })
            .select()
            .single();

          if (createError || !newListings) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to create Listings',
            });
          }

        
        return {id: newListings.id, type: 'structure'};
        }else{
          if (
            !existingListings.addedCategory &&
            !existingListings.addedDescription &&
            !existingListings.addedLocation
          ) {
            return {id: existingListings.id, type: 'structure'};
          }

          if (existingListings.addedCategory && !existingListings.addedDescription) {
            return {id: existingListings.id, type: 'description'};
          }

          if (
            existingListings.addedCategory &&
            existingListings.addedDescription &&
            !existingListings.addedLocation
          ) {
            return {id: existingListings.id, type: 'address'};
          }

          const { data: newListings, error: createError } = await supabase
            .from('listings')
            .insert({ userId })
            .select()
            .single();

          if (createError || !newListings) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to create Listings',
            });
          }

        
        return {id: newListings.id, type: 'structure'};

        }
        
      
    
      }),

    createDescription: baseProcedure.input(
        z.object({
          title: z.string(),
          description: z.string(),
          price: z.string(),
          bedrooms: z.string(),
          bathrooms: z.string(),
          guests: z.string(),
          listingId: z.string(),
          photo: z.string(), 
        })
      )
      .mutation(async ({ input }) => {
        const supabase = await createClient();
        const {
          title,
          description,
          price,
          bedrooms,
          bathrooms,
          guests,
          listingId,
          photo,
        } = input;

        const { error } = await supabase
          .from("listings")
          .update(
            {
              title,
              description,
              price: Number(price),
              bedrooms,
              bathrooms,
              guests,
              photo,
              addedDescription: true,
            }
          )
          .eq("id", listingId);

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }
      }),

      createLocation: baseProcedure.input(
        z.object({
          listingId: z.string(),
          countryValue: z.string(),
        })
      ).mutation(async ({input}) => {
          const supabase = await createClient();
          const {countryValue, listingId} = input;
          const {error} = await supabase.from('listings').update({
            country:countryValue, addedLocation: 'true'
          }).eq('id', listingId)

          if(error){
            throw new Error('Error: ' , error);
          }
      }),

      
    });

  export const CategoryRouter = createTRPCRouter({
    createCategory: baseProcedure
      .input(
        z.object({
          userId: z.string(),
          listingId: z.string(),
          categoryName: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const supabase = await createClient();
        const { userId, listingId, categoryName } = input;
        const {error } = await supabase.from('listings').update({
          userId, categoryName, addedCategory: 'true', user_id: userId
        }).eq('id', listingId);

        if(error){
          throw new Error('Error: ' , error);
        }

        
      }),
  });

  export const ListingsRouter = createTRPCRouter({
    fetchListings: baseProcedure.input(
      z.object({
        searchParams: z.string().optional(), 
        userId: z.string().optional(), 
      })
    ).query(async ({input}) => {
     
      const {searchParams} = input;
      const supabase = await createClient();
      
      let query = supabase
        .from('listings')
        .select(`*, favorites(*)`)
        .eq('addedCategory', true)
        .eq('addedDescription', true)
        .eq('addedLocation', true)
        
        
      if (searchParams) {
        query = query.eq('categoryName', searchParams);
      }

      const {data, error} = await query;
      //  console.log(JSON.stringify(data));
      return data;
    }),
    
    fetchFavListings: baseProcedure.input(
      z.object({
        userId: z.string(), 
      })
    ).query(async ({input}) => {
     
      const {userId} = input;
      const supabase = await createClient();
      
      let query = supabase
        .from('favorites')
        .select(`*, listings(*)`)
        .eq('userId', userId)

      const {data, error} = await query;
      // console.log(data);
      return data;
    }),

    getListingData: baseProcedure.input(
      z.object({
        listingId: z.string(), 
      })
    ).query(async ({input}) => {
     
      const {listingId} = input;
      const supabase = await createClient();
      
      const {data, error} = await supabase
        .from('listings')
        .select(`*, users(*)`)
        .eq('id', listingId).single()

      const listing = data;
      const user = data?.users;

      // console.log("users", user)
      // const user = await supabase.auth.getUser();
      // const user = await supabase.from('')
      return {listing, user};
    }),

    addToFavorite: baseProcedure.input(
      z.object({
        listingId : z.string(),
        pathName: z.string(),
        userId: z.string(),
      })
    ).mutation(async ({ input }) => {
        const supabase = await createClient();
        const {listingId, pathName, userId} = input
        const {data, error} = await supabase.from('favorites').insert({
          listingId,
          userId
        }).select();

        if(error){
          console.log("data", error) 
        }

        if(data){
          revalidatePath(pathName);
        }
        
    }),
    removeFromFavorite: baseProcedure.input(
      z.object({
        favoriteId: z.string(),
        pathName: z.string(),
      })
    ).mutation(async ({ input }) => {
        const supabase = await createClient();
        const {favoriteId, pathName} = input
        const {data, error} = await supabase.from('favorites').delete().eq('id', favoriteId).select();

       if (error) {
          console.error("Error removing favorite:", error);
          throw new Error(error.message);
        }

        if (data) {
          revalidatePath(pathName);
        }

        return data;
    })
  })