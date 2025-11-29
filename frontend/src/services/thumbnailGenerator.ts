/**
 * Thumbnail generation service
 * Calls backend API to generate temporary thumbnails for story options (not stored)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ThumbnailOptions {
  title: string;
  summary: string;
  theme: string;
}

/**
 * Generate a thumbnail image for a story option via backend
 * Returns an image URL that can be used directly in img src
 */
export async function generateStoryThumbnail(options: ThumbnailOptions): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/story/generate-thumbnail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: options.title,
        summary: options.summary,
      }),
    });

    if (!response.ok) {
      console.error('Thumbnail generation failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data.thumbnail_url || null;
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    return null;
  }
}

/**
 * Generate thumbnails for multiple story options in parallel
 * Returns a map of option ID to thumbnail URL
 */
export async function generateStoryThumbnails(
  options: Array<ThumbnailOptions & { id: string }>
): Promise<Map<string, string | null>> {
  const thumbnailMap = new Map<string, string | null>();

  // Generate all thumbnails in parallel
  const promises = options.map(async (option) => {
    const thumbnail = await generateStoryThumbnail(option);
    thumbnailMap.set(option.id, thumbnail);
  });

  await Promise.all(promises);

  return thumbnailMap;
}
