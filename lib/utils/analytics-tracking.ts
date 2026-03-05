/**
 * Analytics Tracking Helper Functions
 * 
 * Fire-and-forget tracking functions for analytics events.
 * All functions are async and fail silently to avoid blocking user experience.
 */

/**
 * Track media view event when a user opens media in the lightbox
 * @param mediaId - The ID of the media item being viewed
 * @param profileId - The ID of the profile being viewed
 */
export async function trackMediaView(mediaId: string, profileId: string): Promise<void> {
  try {
    await fetch('/api/analytics/track-media-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_id: mediaId, profile_id: profileId })
    });
  } catch (error) {
    // Silent fail - don't break user experience
    console.error('Failed to track media view:', error);
  }
}

/**
 * Track social link click event when a user clicks on a social network link
 * @param socialNetwork - The name of the social network (e.g., "Instagram", "TikTok")
 * @param profileId - The ID of the profile being viewed
 */
export async function trackSocialClick(socialNetwork: string, profileId: string): Promise<void> {
  try {
    console.log('[trackSocialClick] Tracking click:', { socialNetwork, profileId });
    const response = await fetch('/api/analytics/track-social-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ social_network: socialNetwork, profile_id: profileId })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[trackSocialClick] API returned error:', errorData);
    } else {
      console.log('[trackSocialClick] Successfully tracked');
    }
  } catch (error) {
    // Silent fail - don't break user experience
    console.error('Failed to track social click:', error);
  }
}

/**
 * Track story view event when a user opens a story
 * @param storyId - The ID of the story being viewed
 */
export async function trackStoryView(storyId: string): Promise<void> {
  try {
    await fetch('/api/analytics/track-story-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ story_id: storyId })
    });
  } catch (error) {
    // Silent fail - don't break user experience
    console.error('Failed to track story view:', error);
  }
}
