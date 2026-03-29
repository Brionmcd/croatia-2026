/**
 * API layer — currently uses demo data. When Supabase is configured,
 * change the import below from './demo-data' to './data'.
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
  getFamilies,
  getBudgetItems,
  getQuestions,
  addQuestion,
  updateQuestionStatus,
  getPackingItems,
  getComments,
  addComment,
  getRestaurantReservations,
} from './demo-data'
