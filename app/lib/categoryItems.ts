import {
  Flame,
  Gem,
  House,
  Landmark,
  Leaf,
  Mountain,
  Sailboat,
  Shapes,
  Star,
  Umbrella,
  Waves,
  WavesLadder,
  Wheat,
  type LucideIcon,
} from "lucide-react";

interface CategoryItem {
  id: number;
  // stored in listings.categoryName, keep these values stable
  name: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const categoryItems: CategoryItem[] = [
  { id: 0, name: "beach", title: "Beach", description: "A short walk to the beach.", icon: Umbrella },
  { id: 1, name: "trending", title: "Trending", description: "One of the most viewed stays right now.", icon: Flame },
  { id: 2, name: "beachfront", title: "Beachfront", description: "Right on the sand, with the sea at the door.", icon: Waves },
  { id: 3, name: "erathhome", title: "Earth Home", description: "Built with natural, local materials.", icon: Leaf },
  { id: 4, name: "luxe", title: "Luxe", description: "Premium finishes and extra comfort.", icon: Gem },
  { id: 5, name: "amazingView", title: "Amazing View", description: "A view worth waking up early for.", icon: Mountain },
  { id: 6, name: "design", title: "Design", description: "Thoughtful architecture and interiors.", icon: Shapes },
  { id: 7, name: "pool", title: "Pool", description: "Has a pool for guests.", icon: WavesLadder },
  { id: 8, name: "tiny", title: "Tiny Home", description: "Small footprint, big character.", icon: House },
  { id: 9, name: "historic", title: "Historic Home", description: "A home with history and heritage.", icon: Landmark },
  { id: 10, name: "countryside", title: "Countryside", description: "Quiet stays away from the city.", icon: Wheat },
  { id: 11, name: "omg", title: "WOW!", description: "Truly one of a kind.", icon: Star },
  { id: 12, name: "surfing", title: "Surfing", description: "Close to a good surf break.", icon: Sailboat },
];

export function getCategory(name?: string | null) {
  return categoryItems.find((item) => item.name === name);
}
