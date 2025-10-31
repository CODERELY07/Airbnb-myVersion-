  import { z } from 'zod';

  import { TRPCError } from '@trpc/server';

  import { baseProcedure, createTRPCRouter } from '../init';
  import { createClient } from '@/utils/supabase/server';
  import { addToFavorite, createReservation } from '@/lib/supabase/listings';
  import { revalidatePath } from 'next/cache';
  import path from 'path';
import { create } from 'domain';
import { getBarangayName, getMunicipalityName, getProvinceName, getRegionName } from '@/app/lib/locaitonHelpers';


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
      
      const {searchParams, userId} = input;
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
  searchListings: baseProcedure
  .input(
    z.object({
      destination: z.string().optional(),
      checkIn: z.string().optional(),
      checkOut: z.string().optional(),
      guests: z.number().optional(),
      bedrooms: z.number().optional(),
      bathrooms: z.number().optional(),
      filter: z.string().optional(),
    })
  )
  .query(async ({ input }) => {
    const supabase = await createClient();


    let query = supabase.from('listings').select('*');

    if (input.destination) {
      query = query.ilike('provinceCode', `%${input.destination}%`);
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

    const requestedStart = new Date(input.checkIn);
    const requestedEnd = new Date(input.checkOut);

    const { data: allReservations, error: reservationsError } = await supabase
      .from('reservation')
      .select('listingId, startDate, endDate');

    if (reservationsError) throw new Error(reservationsError.message);

    // Filter out listings that have overlapping reservations
    const availableListings = allListings?.filter((listing) => {
      const reservationsForListing = allReservations?.filter(
        (r) => r.listingId === listing.id
      );

      const hasConflict = reservationsForListing?.some((reservation) => {
        const reservationStart = new Date(reservation.startDate);
        const reservationEnd = new Date(reservation.endDate);

        return (
          (requestedStart >= reservationStart && requestedStart <= reservationEnd) ||
          (requestedEnd >= reservationStart && requestedEnd <= reservationEnd) ||
          (requestedStart <= reservationStart && requestedEnd >= reservationEnd)
        );
      });

      return !hasConflict;
    });

    return availableListings ?? [];
  }),
  
  // Add these mutations to your ListingsRouter

updateListing: baseProcedure
  .input(
    z.object({
      listingId: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      price: z.string().optional(),
      bedrooms: z.string().optional(),
      bathrooms: z.string().optional(),
      guests: z.string().optional(),
      photo: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const supabase = await createClient();
    const { listingId, ...updateData } = input;

    // Filter out undefined values
    const filteredData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined)
    );

    // Convert price to number if present
    // if (filteredData.price) {
    //   filteredData.price = Number(filteredData.price);
    // }

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

    // Delete the image from storage if it exists
    if (listing.photo) {
      const { error: storageError } = await supabase.storage
        .from("images")
        .remove([listing.photo]);

      // Continue even if image deletion fails
      if (storageError) {
        console.error("Failed to delete image:", storageError);
      }
    }

    // Delete the listing
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
