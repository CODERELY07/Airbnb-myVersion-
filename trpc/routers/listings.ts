  import { z } from 'zod';

  import { TRPCError } from '@trpc/server';

  import { baseProcedure, createTRPCRouter } from '../init';
  import { createClient } from '@/utils/supabase/server';
  import { revalidatePath } from 'next/cache';
import { getProvinceName } from '@/app/lib/locaitonHelpers';
import { activeReservationFilter, DAY_PATTERN, manilaMidnight } from '@/lib/utils';
import { listingDetailsSchema } from '@/lib/validation';


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
        listingDetailsSchema.extend({
          listingId: z.string().uuid(),
          photo: z.string().min(1),
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
              price,
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
          regionCode: z.string(),
          provinceCode: z.string(),
          munCityCode: z.string(),
          barangayCode: z.string(),
        })
      ).mutation(async ({input}) => {
          const supabase = await createClient();
          const {regionCode, listingId, provinceCode , munCityCode, barangayCode} = input;
          const {error} = await supabase.from('listings').update({
            barangayCode,regionCode,provinceCode,munCityCode, addedLocation: 'true'
          }).eq('id', listingId)

          if(error){
            throw new Error(error.message);
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
          throw new Error(error.message);
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
      
      const {searchParams, userId} = input;
      const supabase = await createClient();
      
      let query = supabase
        .from('listings')
        .select(`*, favorites(*)`)
        .eq('addedCategory', true)
        .eq('addedDescription', true)
        .eq('addedLocation', true)
        // stable order (oldest first), so editing a listing doesn't move it
        .order('created_at', { ascending: true })

      if (searchParams) {
        query = query.eq('categoryName', searchParams);
      }

      if(userId){
        query = query.eq('userId', userId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? []; 
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
          // console.log("data", error) 
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

  // for calendar reservation
  fetchReservation: baseProcedure.input(
    z.object({
      listingId: z.string(),
    })
  )
  .query(async ({input}) => {
    const supabase = await createClient();
    const {listingId} = input;
    // public view: dates only, no guest info
    const { data, error } = await supabase
      .from('reservation_dates')
      .select('startDate, endDate')
      .eq('listingId', listingId)
      .or(activeReservationFilter());

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
      const {data, error} = await supabase.from('reservation').select('*, users(*), listings(*)').eq('userId', userId).eq('isPaid', true);

      return data;
  }),
  // Paid bookings of the logged-in host's listings (user from the session, not from input)
  getHostBookings: baseProcedure.query(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const { data, error } = await supabase
      .from('reservation')
      .select('id, "startDate", "endDate", nights, "totalPrice", created_at, users(full_name, avatar_url), listings!inner(id, title, photo, "userId")')
      .eq('listings.userId', user.id)
      .eq('isPaid', true)
      .order('startDate', { ascending: true });

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return data ?? [];
  }),

  searchListings: baseProcedure
  .input(
    z.object({
      destination: z.string().regex(/^\d{3}$/).optional(), // PSGC province code
      checkIn: z.string().regex(DAY_PATTERN).optional(),
      checkOut: z.string().regex(DAY_PATTERN).optional(),
      guests: z.number().optional(),
      bedrooms: z.number().optional(),
      bathrooms: z.number().optional(),
      filter: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    const supabase = await createClient();


    let query = supabase
      .from('listings')
      .select('*, favorites(*)')
      .eq('addedCategory', true)
      .eq('addedDescription', true)
      .eq('addedLocation', true)
      .order('created_at', { ascending: true });

    if (input.destination) {
      query = query.eq('provinceCode', input.destination);
    }
    if (input.guests) {
      query = query.gte('guests', input.guests);
    }
    if (input.bedrooms) {
      query = query.gte('bedrooms', input.bedrooms);
    }
    if (input.bathrooms) {
      query = query.gte('bathrooms', input.bathrooms);
    }


    const { data: allListings, error: listingsError } = await query;
    if (listingsError) throw new Error(listingsError.message);

  
    if (!input.checkIn || !input.checkOut) {
      return allListings;
    }

    // Only load reservations that overlap the requested dates
    const { data: bookedReservations, error: reservationsError } = await supabase
      .from('reservation_dates')
      .select('listingId')
      // overlap = starts before my checkout and ends after my check-in (same-day turnover allowed)
      .lt('startDate', manilaMidnight(input.checkOut).toISOString())
      .gt('endDate', manilaMidnight(input.checkIn).toISOString())
      .or(activeReservationFilter());

    if (reservationsError) throw new Error(reservationsError.message);

    // Filter out listings that have overlapping reservations
    const bookedIds = new Set(bookedReservations?.map((r) => r.listingId));
    const availableListings = allListings?.filter((listing) => !bookedIds.has(listing.id));

    return availableListings ?? [];
  }),
  
  // Add these mutations to your ListingsRouter

updateListing: baseProcedure
  .input(
    z.object({
      listingId: z.string().uuid(),
      photo: z.string().min(1).optional(),
    }).extend(listingDetailsSchema.partial().shape)
  )
  .mutation(async ({ input }) => {
    const supabase = await createClient();
    const { listingId, ...updateData } = input;

    // Filter out undefined values
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined)
    );

    const { error } = await supabase
      .from("listings")
      .update(filteredData)
      .eq("id", listingId);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }
  }),

updateLocation: baseProcedure
  .input(
    z.object({
      listingId: z.string(),
      regionCode: z.string(),
      provinceCode: z.string(),
      munCityCode: z.string(),
      barangayCode: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const supabase = await createClient();
    const { listingId, regionCode, provinceCode, munCityCode, barangayCode } = input;

    const { error } = await supabase
      .from("listings")
      .update({
        barangayCode,
        regionCode,
        provinceCode,
        munCityCode,
      })
      .eq("id", listingId);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }
  }),

deleteListing: baseProcedure
  .input(
    z.object({
      listingId: z.string(),
      userId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const supabase = await createClient();
    const { listingId, userId } = input;

  
    const { data: listing, error: fetchError } = await supabase
      .from("listings")
      .select("userId, photo")
      .eq("id", listingId)
      .eq('userId', userId)
      .single();

    if (fetchError || !listing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Listing not found",
      });
    }

    if (listing.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not authorized to delete this listing",
      });
    }

    // Guests who already paid must not lose their booking
    const { data: upcoming, error: bookingsError } = await supabase
      .from("reservation_dates")
      .select("listingId")
      .eq("listingId", listingId)
      .eq("isPaid", true)
      .gt("endDate", new Date().toISOString())
      .limit(1);

    if (bookingsError) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: bookingsError.message });
    }

    if (upcoming && upcoming.length > 0) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "This listing has upcoming paid bookings, so it can't be deleted yet.",
      });
    }

    // Delete the listing first, then its photo (a leftover photo is harmless, a missing one isn't)
    const { error: deleteError } = await supabase
      .from("listings")
      .delete()
      .eq("id", listingId).eq('userId', userId);

    if (deleteError) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: deleteError.message,
      });
    }

    if (listing.photo) {
      const { error: storageError } = await supabase.storage.from("images").remove([listing.photo]);
      if (storageError) console.error("Failed to delete image:", storageError);
    }
  }),

// Add to CategoryRouter
updateCategory: baseProcedure
  .input(
    z.object({
      listingId: z.string(),
      categoryName: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const supabase = await createClient();
    const { listingId, categoryName } = input;

    const { error } = await supabase
      .from("listings")
      .update({
        categoryName,
      })
      .eq("id", listingId);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }
  }),
})

export const locationRouter = createTRPCRouter({
  listUnique: baseProcedure.query(async () => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("listings")
    .select("regionCode, provinceCode, munCityCode, barangayCode")
    .not("regionCode", "is", null)
    .not("provinceCode", "is", null);

  if (error) throw new Error(error.message);

  const uniqueData = Array.from(
    new Map(
      data.map((item) => [
        `${item.regionCode}-${item.provinceCode}-${item.munCityCode}-${item.barangayCode}`,
        item,
      ])
    ).values()
  );


  const readable = uniqueData.map((item) => ({
    provinceCode: item.provinceCode, 
    provinceName: getProvinceName(item.regionCode, item.provinceCode),
  }));

  return readable;
  }),

});
