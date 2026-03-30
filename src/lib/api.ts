/**
 * API layer — connected to live Supabase.
 * To switch back to demo mode, change './data' to './demo-data'.
 */
export {
  getTripByAccessCode,
  getDays,
  getActivities,
  getActivitiesForTrip,
  getDecisions,
  getDecisionOptions,
  getVotes,
  castVote,
  removeVote,
  getFamilies,
  getBudgetItems,
  getQuestions,
  addQuestion,
  updateQuestionStatus,
  getPackingItems,
  getComments,
  addComment,
  getRestaurantReservations,
} from './data'
