import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "generated-images";

function getSupabaseStorage() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function uploadGeneratedImage(
  userId: string,
  prefix: string,
  image: Buffer,
): Promise<string> {
  const storage = getSupabaseStorage();
  const objectPath = `${userId}/${prefix}_${Date.now()}_${randomUUID()}.png`;
  const { error } = await storage.storage.from(BUCKET).upload(objectPath, image, {
    cacheControl: "31536000",
    contentType: "image/png",
    upsert: false,
  });

  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  return `/api/images?path=${encodeURIComponent(objectPath)}`;
}

export function getStoredImagePath(imageUrl: string): string | null {
  let image: URL;
  try {
    image = new URL(imageUrl, "http://localhost");
  } catch {
    return null;
  }

  if (image.origin === "http://localhost" && image.pathname === "/api/images") {
    return image.searchParams.get("path");
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) return null;

  const project = new URL(supabaseUrl);
  const publicPrefix = `/storage/v1/object/public/${BUCKET}/`;

  if (image.origin !== project.origin || !image.pathname.startsWith(publicPrefix)) {
    return null;
  }

  return decodeURIComponent(image.pathname.slice(publicPrefix.length));
}

function assertOwnedObjectPath(userId: string, objectPath: string): void {
  const segments = objectPath.split("/");
  if (
    !objectPath.startsWith(`${userId}/`) ||
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error("Image not found.");
  }
}

export async function downloadGeneratedImage(
  userId: string,
  objectPath: string,
): Promise<Blob> {
  assertOwnedObjectPath(userId, objectPath);
  const { data, error } = await getSupabaseStorage()
    .storage.from(BUCKET)
    .download(objectPath);

  if (error) {
    throw new Error(`Supabase Storage download failed: ${error.message}`);
  }

  return data;
}

export async function deleteGeneratedImage(
  imageUrl: string,
  userId: string,
): Promise<void> {
  const objectPath = getStoredImagePath(imageUrl);
  if (!objectPath) return;
  assertOwnedObjectPath(userId, objectPath);

  const { error } = await getSupabaseStorage()
    .storage.from(BUCKET)
    .remove([objectPath]);

  if (error) {
    throw new Error(`Supabase Storage delete failed: ${error.message}`);
  }
}

export function getImageRouteUrl(imageUrl: string, userId: string): string {
  const objectPath = getStoredImagePath(imageUrl);
  if (!objectPath || !objectPath.startsWith(`${userId}/`)) return imageUrl;
  return `/api/images?path=${encodeURIComponent(objectPath)}`;
}