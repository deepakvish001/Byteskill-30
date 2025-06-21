import type { createClient } from "@/lib/supabase/server"
import { siteConfig } from "@/lib/site-config"
import type { Database } from "@/lib/types"

type ReputationEvent = Database["public"]["Enums"]["reputation_event_type"]

/**
 * Awards reputation points to a user for a specific event.
 * This function calls the PostgreSQL function `add_reputation_event_and_update_score`
 * to ensure the operation is atomic (both logging the event and updating the score).
 *
 * @param supabase - An existing Supabase server client instance.
 * @param userId - The ID of the user to award reputation to.
 * @param event - The type of event that occurred.
 * @param entityId - Optional: The ID of the entity related to the event (e.g., comment ID, post ID).
 * @returns An object indicating success or failure.
 */
export async function awardReputation(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  event: ReputationEvent,
  entityId?: string,
): Promise<{ success: boolean; error?: string }> {
  const points = siteConfig.reputation.points[event]

  if (typeof points === "undefined") {
    console.warn(`Reputation event "${event}" has no defined point value. Skipping.`)
    return { success: false, error: "Invalid reputation event." }
  }

  // Don't award 0 points.
  if (points === 0) {
    return { success: true }
  }

  const { error } = await supabase.rpc("add_reputation_event_and_update_score", {
    p_user_id: userId,
    p_event_type: event,
    p_points: points,
    p_entity_id: entityId,
  })

  if (error) {
    console.error(`Error awarding reputation for event "${event}" to user ${userId}:`, error)
    // Don't expose detailed DB errors to the client.
    return { success: false, error: "Failed to update reputation." }
  }

  console.log(`Awarded ${points} reputation points to user ${userId} for event: ${event}`)
  return { success: true }
}
