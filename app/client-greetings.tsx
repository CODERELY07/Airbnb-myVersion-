// 'use client';

// import { trpc } from "@/trpc/client";

// // <-- hooks can only be used in client components

// export function ClientGreeting() {
//   const greeting = trpc.greetings.getSession.useQuery({ text : "hello"});

//   if (!greeting.data) return <div>Loading...</div>;
//   return <div>{greeting.data.greeting}</div>;
// }