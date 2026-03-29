import { supabase } from './supabase'
import type {
  Trip,
  Family,
  Day,
  Activity,
  Decision,
  DecisionOption,
  Vote,
  BudgetItem,
  Question,
  PackingItem,
  Comment,
  RestaurantReservation,
} from '@/types/database'

// --- Trips ---

export async function getTripByAccessCode(code: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('access_code', code)
    .single()

  if (error) {
    console.error('Error fetching trip by access code:', error.message)
    return null
  }
  return data
}

// --- Days ---

export async function getDays(tripId: string): Promise<Day[]> {
  const { data, error } = await supabase
    .from('days')
    .select('*')
    .eq('trip_id', tripId)
    .order('day_number', { ascending: true })

  if (error) {
    console.error('Error fetching days:', error.message)
    return []
  }
  return data ?? []
}

// --- Activities ---

export async function getActivities(dayId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('day_id', dayId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching activities:', error.message)
    return []
  }
  return data ?? []
}

export async function getActivitiesForTrip(tripId: string): Promise<Activity[]> {
  // Fetch all days for the trip, then all activities for those days
  const days = await getDays(tripId)
  if (days.length === 0) return []

  const dayIds = days.map((d) => d.id)
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .in('day_id', dayIds)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching activities for trip:', error.message)
    return []
  }
  return data ?? []
}

// --- Decisions ---

export async function getDecisions(tripId: string): Promise<Decision[]> {
  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('trip_id', tripId)
    .order('deadline', { ascending: true })

  if (error) {
    console.error('Error fetching decisions:', error.message)
    return []
  }
  return data ?? []
}

export async function getDecisionOptions(decisionId: string): Promise<DecisionOption[]> {
  const { data, error } = await supabase
    .from('decision_options')
    .select('*')
    .eq('decision_id', decisionId)

  if (error) {
    console.error('Error fetching decision options:', error.message)
    return []
  }
  return data ?? []
}

// --- Votes ---

export async function getVotes(decisionId: string): Promise<Vote[]> {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('decision_id', decisionId)

  if (error) {
    console.error('Error fetching votes:', error.message)
    return []
  }
  return data ?? []
}

export async function castVote(
  decisionId: string,
  optionId: string,
  familyId: string
): Promise<Vote | null> {
  // Upsert: if this family already voted on this decision, update their vote
  // First, remove any existing vote from this family for this decision
  await supabase
    .from('votes')
    .delete()
    .eq('decision_id', decisionId)
    .eq('family_id', familyId)

  const { data, error } = await supabase
    .from('votes')
    .insert({
      decision_id: decisionId,
      option_id: optionId,
      family_id: familyId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error casting vote:', error.message)
    return null
  }
  return data
}

// --- Families ---

export async function getFamilies(tripId: string): Promise<Family[]> {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('trip_id', tripId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching families:', error.message)
    return []
  }
  return data ?? []
}

// --- Budget Items ---

export async function getBudgetItems(tripId: string): Promise<BudgetItem[]> {
  const { data, error } = await supabase
    .from('budget_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('category', { ascending: true })

  if (error) {
    console.error('Error fetching budget items:', error.message)
    return []
  }
  return data ?? []
}

// --- Questions ---

export async function getQuestions(tripId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching questions:', error.message)
    return []
  }
  return data ?? []
}

export async function addQuestion(
  tripId: string,
  question: string,
  familyId?: string
): Promise<Question | null> {
  const { data, error } = await supabase
    .from('questions')
    .insert({
      trip_id: tripId,
      question,
      asked_by_family_id: familyId ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding question:', error.message)
    return null
  }
  return data
}

export async function updateQuestionStatus(
  id: string,
  status: string,
  answer?: string
): Promise<Question | null> {
  const updateData: Record<string, unknown> = { status }
  if (answer !== undefined) {
    updateData.answer = answer
  }
  if (status === 'resolved') {
    updateData.resolved_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('questions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating question status:', error.message)
    return null
  }
  return data
}

// --- Packing Items ---

export async function getPackingItems(tripId: string): Promise<PackingItem[]> {
  const { data, error } = await supabase
    .from('packing_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('category', { ascending: true })

  if (error) {
    console.error('Error fetching packing items:', error.message)
    return []
  }
  return data ?? []
}

// --- Comments ---

export async function getComments(
  entityType: 'activity' | 'decision' | 'question',
  entityId: string
): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching comments:', error.message)
    return []
  }
  return data ?? []
}

export async function addComment(
  entityType: 'activity' | 'decision' | 'question',
  entityId: string,
  familyId: string,
  content: string
): Promise<Comment | null> {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      entity_type: entityType as 'activity' | 'decision' | 'question',
      entity_id: entityId,
      family_id: familyId,
      content,
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding comment:', error.message)
    return null
  }
  return data
}

// --- Restaurant Reservations ---

export async function getRestaurantReservations(
  tripId: string
): Promise<RestaurantReservation[]> {
  const { data, error } = await supabase
    .from('restaurant_reservations')
    .select('*')
    .eq('trip_id', tripId)
    .order('time', { ascending: true })

  if (error) {
    console.error('Error fetching restaurant reservations:', error.message)
    return []
  }
  return data ?? []
}
