#!/bin/bash
# Sequential image generation to avoid rate limits
OUT_DIR="/home/z/my-project/public/gallery"
mkdir -p "$OUT_DIR"

gen() {
  local name="$1"
  local size="$2"
  local prompt="$3"
  if [ -f "$OUT_DIR/$name.png" ]; then
    echo "SKIP $name (already exists)"
    return
  fi
  echo "Generating $name..."
  for attempt in 1 2 3; do
    if z-ai image -p "$prompt" -o "$OUT_DIR/$name.png" -s "$size" 2>&1 | tail -2; then
      if [ -f "$OUT_DIR/$name.png" ]; then
        echo "  ✓ $name done"
        break
      fi
    fi
    echo "  retry $attempt for $name in 8s..."
    sleep 8
  done
  sleep 4
}

gen "hero-result" "1344x768" \
  "A futuristic city floating above the clouds at sunset, cinematic lighting, ultra-detailed architecture, atmospheric fog, realistic reflections, dramatic sky, volumetric lighting, high-end cinematic photography, ultra detailed, 8k"

gen "gallery-portrait" "864x1152" \
  "Editorial studio portrait of a striking woman with freckles, dramatic side lighting, realistic skin texture and pores, soft gradient background, high fashion photography, shot on Hasselblad, ultra detailed, 8k"

gen "gallery-product" "1024x1024" \
  "Premium luxury perfume bottle on a polished marble surface, soft studio lighting, subtle reflections, water droplets, minimal beige background, high-end commercial product photography, ultra detailed, 8k"

gen "gallery-architecture" "1344x768" \
  "Minimalist futuristic house in a vast desert at golden hour, clean geometric concrete architecture, large glass windows, infinity pool reflecting the sky, sharp shadows, architectural photography, ultra detailed, 8k"

gen "gallery-3d" "1024x1024" \
  "Stylized 3D character of a young adventurer with a hood, large expressive eyes, Pixar-quality rendering, soft cinematic lighting, detailed textures, octane render, 8k"

gen "gallery-anime" "1344x768" \
  "Detailed anime cinematic scene of a girl with flowing hair standing on a rooftop at sunset, neon city skyline in the background, vibrant sky, dramatic clouds, Makoto Shinkai style, ultra detailed, 8k"

gen "gallery-abstract" "1024x1024" \
  "Experimental abstract 3D composition, flowing iridescent ribbons of color, violet pink and blue gradient, glass and chrome materials, octane render, soft studio lighting, ultra detailed, 8k"

gen "cinematic-bg" "1440x720" \
  "Epic cinematic landscape of a futuristic megacity at dusk, towering skyscrapers with neon lights, flying vehicles, atmospheric haze, dramatic sky with vibrant clouds, blade runner aesthetic, ultra wide cinematic shot, 8k"

echo ""
echo "Final files:"
ls -lh "$OUT_DIR"
