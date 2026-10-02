#!/bin/bash
# Generate all demo AI images for DreamForge AI landing page
# Outputs to /home/z/my-project/public/gallery/

OUT_DIR="/home/z/my-project/public/gallery"
mkdir -p "$OUT_DIR"

echo "Starting image generation for DreamForge AI..."

# Helper: run generation in background
gen() {
  local name="$1"
  local size="$2"
  local prompt="$3"
  z-ai image -p "$prompt" -o "$OUT_DIR/$name.png" -s "$size" > "/tmp/gen-$name.log" 2>&1 &
  echo "Started: $name (pid $!)"
}

# 1. Hero generation result — cinematic futuristic city (16:9 landscape)
gen "hero-result" "1344x768" \
  "A futuristic city floating above the clouds at sunset, cinematic lighting, ultra-detailed architecture, atmospheric fog, realistic reflections, dramatic sky, volumetric lighting, high-end cinematic photography, ultra detailed, 8k"

# 2. Cinematic gallery — different scene
gen "gallery-cinematic" "1344x768" \
  "Cinematic wide shot of a lone astronaut standing on an alien desert planet, twin suns setting, dramatic atmospheric haze, volumetric god rays, ultra detailed sci-fi concept art, film still, 8k"

# 3. Portrait — editorial studio
gen "gallery-portrait" "864x1152" \
  "Editorial studio portrait of a striking woman with freckles, dramatic side lighting, realistic skin texture and pores, soft gradient background, high fashion photography, shot on Hasselblad, ultra detailed, 8k"

# 4. Fantasy — floating kingdom
gen "gallery-fantasy" "864x1152" \
  "Ancient fantasy kingdom floating above the clouds at dawn, golden temples, cascading waterfalls falling into the sky, ethereal mist, epic fantasy concept art, intricate details, painterly cinematic lighting, 8k"

# 5. Product — perfume bottle
gen "gallery-product" "1024x1024" \
  "Premium luxury perfume bottle on a polished marble surface, soft studio lighting, subtle reflections, water droplets, minimal beige background, high-end commercial product photography, ultra detailed, 8k"

# 6. Architecture — futuristic desert house
gen "gallery-architecture" "1344x768" \
  "Minimalist futuristic house in a vast desert at golden hour, clean geometric concrete architecture, large glass windows, infinity pool reflecting the sky, sharp shadows, architectural photography, ultra detailed, 8k"

# 7. 3D character
gen "gallery-3d" "1024x1024" \
  "Stylized 3D character of a young adventurer with a hood, large expressive eyes, Pixar-quality rendering, soft cinematic lighting, detailed textures, octane render, 8k"

# 8. Anime — cinematic scene
gen "gallery-anime" "1344x768" \
  "Detailed anime cinematic scene of a girl with flowing hair standing on a rooftop at sunset, neon city skyline in the background, vibrant sky, dramatic clouds, Makoto Shinkai style, ultra detailed, 8k"

# 9. Abstract — experimental composition
gen "gallery-abstract" "1024x1024" \
  "Experimental abstract 3D composition, flowing iridescent ribbons of color, violet pink and blue gradient, glass and chrome materials, octane render, soft studio lighting, ultra detailed, 8k"

# 10. Cinematic showcase background — extra wide
gen "cinematic-bg" "1440x720" \
  "Epic cinematic landscape of a futuristic megacity at dusk, towering skyscrapers with neon lights, flying vehicles, atmospheric haze, dramatic sky with vibrant clouds, blade runner aesthetic, ultra wide cinematic shot, 8k"

echo ""
echo "All image generations started. Waiting for completion..."
wait
echo ""
echo "All done. Files in $OUT_DIR:"
ls -lh "$OUT_DIR"
