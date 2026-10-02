// Quick test: can ZAI.create() generate an image WITHOUT an explicit ZAI_API_KEY?
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";

async function main() {
  console.log("ZAI_API_KEY env:", process.env.ZAI_API_KEY ? "(set)" : "(empty)");
  console.log("Creating ZAI instance...");
  const zai = await ZAI.create();
  console.log("✓ ZAI instance created");

  console.log("Generating test image...");
  const response = await zai.images.generations.create({
    prompt: "a small red apple on a white table, product photo",
    size: "1024x1024",
  });

  const base64 = response.data?.[0]?.base64;
  if (!base64) {
    console.error("✗ No image returned");
    process.exit(1);
  }

  fs.writeFileSync("/home/z/my-project/scripts/test-real-gen.png", Buffer.from(base64, "base64"));
  console.log("✓ Image saved to /home/z/my-project/scripts/test-real-gen.png");
  console.log("  Size:", Buffer.from(base64, "base64").length, "bytes");
}

main().catch((e) => {
  console.error("✗ Error:", e.message);
  process.exit(1);
});
