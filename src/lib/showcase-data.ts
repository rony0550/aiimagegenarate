export interface ShowcaseImage {
  id: string;
  src: string;
  category: string;
  title: string;
  prompt: string;
  /** Span hints for masonry layout (large/regular) */
  span?: "tall" | "wide" | "regular";
}

export const SHOWCASE_IMAGES: ShowcaseImage[] = [
  {
    id: "cinematic",
    src: "/gallery/hero-result.png",
    category: "Cinematic",
    title: "Floating City at Sunset",
    prompt:
      "A futuristic city floating above the clouds at sunset, cinematic lighting, ultra-detailed architecture, atmospheric fog.",
    span: "wide",
  },
  {
    id: "portrait",
    src: "/gallery/gallery-portrait.png",
    category: "Portrait",
    title: "Editorial Freckles",
    prompt:
      "Editorial studio portrait with realistic skin texture, dramatic side lighting, soft gradient background.",
    span: "tall",
  },
  {
    id: "fantasy",
    src: "/gallery/gallery-fantasy.png",
    category: "Fantasy",
    title: "Kingdom Above the Clouds",
    prompt:
      "Ancient fantasy kingdom floating above the clouds at dawn, golden temples, cascading waterfalls.",
  },
  {
    id: "product",
    src: "/gallery/gallery-product.png",
    category: "Product",
    title: "Marble & Perfume",
    prompt:
      "Premium luxury perfume bottle on a polished marble surface, soft studio lighting, water droplets.",
  },
  {
    id: "architecture",
    src: "/gallery/gallery-architecture.png",
    category: "Architecture",
    title: "Desert Minimalism",
    prompt:
      "Minimalist futuristic house in a vast desert at golden hour, concrete architecture, infinity pool.",
    span: "wide",
  },
  {
    id: "3d",
    src: "/gallery/gallery-3d.png",
    category: "3D",
    title: "The Hooded Adventurer",
    prompt:
      "Stylized 3D character of a young adventurer with a hood, Pixar-quality rendering, soft cinematic lighting.",
  },
  {
    id: "anime",
    src: "/gallery/gallery-anime.png",
    category: "Anime",
    title: "Rooftop at Sunset",
    prompt:
      "Detailed anime scene of a girl with flowing hair on a rooftop at sunset, neon city skyline.",
    span: "wide",
  },
  {
    id: "abstract",
    src: "/gallery/gallery-abstract.png",
    category: "Abstract",
    title: "Iridescent Ribbons",
    prompt:
      "Experimental abstract 3D composition, flowing iridescent ribbons of color, glass and chrome materials.",
    span: "tall",
  },
];

export const CINEMATIC_BG = "/gallery/cinematic-bg.png";
