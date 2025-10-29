  import { z } from 'zod';

  import { TRPCError } from '@trpc/server';

  import { baseProcedure, createTRPCRouter } from '../init';
  import { createClient } from '@/utils/supabase/server';
  import { addToFavorite, createReservation } from '@/lib/supabase/listings';
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
    }),

    createReservation: baseProcedure.input(
      z.object({
        userId: z.string(),
        listingId: z.string(),
        startDate: z.string(),
        endDate : z.string()
      })
    ).mutation(async ({ input }) => {
        const { userId, listingId, startDate, endDate } = input;
        const supabase = await createClient();

        const { data: existingReservations, error: fetchError } = await supabase
          .from("reservation")
          .select("*")
          .eq("listingId", listingId).eq('userId', userId)

        if (fetchError) {
          console.error("Error checking existing reservations:", fetchError);
          throw new Error("Unable to verify reservation availability");
        }

        if (existingReservations && existingReservations.length > 0) {
          throw new Error("You already book this listings check your reservationa nd try again...");
        }

        const { data, error } = await supabase.from("reservation").insert([
          { userId, listingId, startDate, endDate },
        ]);

        if (error) {
          console.error("Error inserting reservation:", error);
          throw new Error("Unable to create reservation.");
        }
    }),

  // for calendar reservation
  fetchReservation: baseProcedure.input(
    z.object({
      listingId: z.string(),
    })
  )
  .query(async ({input}) => {
    const supabase = await createClient();
    const {listingId} = input;
    const { data, error } = await supabase.from('reservation').select('*').eq('listingId', listingId);

    if (error) {
      console.error('Error fetching reservations:', error);
      throw new Error('Failed to fetch reservations');
    }

    return data;
  }),
  
  getReservationListings: baseProcedure.input(
      z.object({
        userId: z.string(),
      })
    ).query(async ({input}) => {
      const supabase = await createClient();
      const {userId} = input; 
      const {data, error} = await supabase.from('reservation').select('*, users(*), listings(*)').eq('userId', userId);

      return data;
  }),

})