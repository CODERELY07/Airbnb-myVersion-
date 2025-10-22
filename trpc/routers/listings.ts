// server/routers/home.ts
// TODO:: It can insert now just follow the tutorial at 2:07:03
// but we're fixing this in our own next is we need after adding category go to the description
import { z } from 'zod';

import { TRPCError } from '@trpc/server';

import { baseProcedure, createTRPCRouter } from '../init';
import { createClient } from '@/utils/supabase/server';


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

      if(existingListings){
        return {id: existingListings.id, type: 'structure'};
      }
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch Listings data',
        });
        
      }

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
      }
     

      // Check completion status and redirect accordingly
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
        userId, categoryName, addedCategory: 'true'
      }).eq('id', listingId);

      if(error){
        throw new Error('Error: ' , error);
      }

      
    }),
});