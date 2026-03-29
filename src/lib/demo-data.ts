/**
 * Demo data module — returns hardcoded seed data so the app works
 * without a live Supabase connection. Votes, comments, and new
 * questions are stored in module-scoped arrays and persist for the
 * duration of the server/client session.
 */
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

// ============================================================
// Constants — UUIDs match supabase-schema.sql seed data
// ============================================================

const TRIP_ID = '11111111-1111-1111-1111-111111111111'

// ============================================================
// Static seed data
// ============================================================

const trip: Trip = {
  id: TRIP_ID,
  name: 'Croatia July 2026',
  access_code: 'CROATIA26',
  start_date: '2026-07-18',
  end_date: '2026-07-26',
  created_at: '2026-01-01T00:00:00.000Z',
}

const families: Family[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
    trip_id: TRIP_ID,
    name: 'Dharia',
    adults: 2,
    children: 2,
    children_ages: [12, 14],
    arrival_flight: 'TBD',
    arrival_airport: 'Split (SPU)',
    arrival_datetime: '2026-07-18T10:00:00+02:00',
    departure_flight: 'TBD',
    departure_datetime: '2026-07-25T14:00:00+02:00',
    timezone: 'Asia/Kolkata',
    contact_email: null,
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',
    trip_id: TRIP_ID,
    name: 'McDonough',
    adults: 2,
    children: 2,
    children_ages: [10, 13],
    arrival_flight: 'TBD',
    arrival_airport: 'Zadar (ZAD)',
    arrival_datetime: '2026-07-18T12:30:00+02:00',
    departure_flight: 'TBD',
    departure_datetime: '2026-07-25T16:00:00+02:00',
    timezone: 'Europe/Dublin',
    contact_email: null,
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03',
    trip_id: TRIP_ID,
    name: 'Sheth (Sanjay)',
    adults: 2,
    children: 3,
    children_ages: [8, 9, 16],
    arrival_flight: 'TBD',
    arrival_airport: 'Zadar (ZAD)',
    arrival_datetime: '2026-07-18T12:30:00+02:00',
    departure_flight: 'TBD',
    departure_datetime: '2026-07-25T16:00:00+02:00',
    timezone: 'Asia/Kolkata',
    contact_email: null,
  },
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04',
    trip_id: TRIP_ID,
    name: 'Sheth (Gargi)',
    adults: 3,
    children: 0,
    children_ages: [],
    arrival_flight: 'TBD',
    arrival_airport: 'Split (SPU)',
    arrival_datetime: '2026-07-19T09:00:00+02:00',
    departure_flight: 'TBD',
    departure_datetime: '2026-07-26T12:00:00+02:00',
    timezone: 'Asia/Kolkata',
    contact_email: null,
  },
]

const days: Day[] = [
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd01', trip_id: TRIP_ID, day_number: 1, date: '2026-07-18', day_of_week: 'Saturday', location: 'Split', title: 'Arrivals & Check-in' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd02', trip_id: TRIP_ID, day_number: 2, date: '2026-07-19', day_of_week: 'Sunday', location: 'Split', title: 'Gargi Arrives + Tuk-Tuk Tour' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd03', trip_id: TRIP_ID, day_number: 3, date: '2026-07-20', day_of_week: 'Monday', location: 'Split', title: 'Hvar Speedboat Excursion' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd04', trip_id: TRIP_ID, day_number: 4, date: '2026-07-21', day_of_week: 'Tuesday', location: 'Split', title: 'River Rafting Adventure' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd05', trip_id: TRIP_ID, day_number: 5, date: '2026-07-22', day_of_week: 'Wednesday', location: 'Split to Dubrovnik', title: 'Transfer Day + Old Town Activity' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd06', trip_id: TRIP_ID, day_number: 6, date: '2026-07-23', day_of_week: 'Thursday', location: 'Dubrovnik', title: 'Sipan Island + Cable Car' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd07', trip_id: TRIP_ID, day_number: 7, date: '2026-07-24', day_of_week: 'Friday', location: 'Dubrovnik', title: 'ATV Quad Safari + Free Afternoon' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd08', trip_id: TRIP_ID, day_number: 8, date: '2026-07-25', day_of_week: 'Saturday', location: 'Dubrovnik', title: '3 Families Depart' },
  { id: 'dddddddd-dddd-dddd-dddd-dddddddddd09', trip_id: TRIP_ID, day_number: 9, date: '2026-07-26', day_of_week: 'Sunday', location: 'Dubrovnik', title: 'Gargi Departs' },
]

let actIdCounter = 1
function actId(): string {
  return `acacacac-acac-acac-acac-acacacac${String(actIdCounter++).padStart(4, '0')}`
}

const activities: Activity[] = [
  // Day 1
  { id: actId(), day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd01', time: null, title: 'Dharia Family — Split Airport Transfer', description: 'Private transfer from Split Airport (SPU) to hotel', details: 'Dharia family arrives via Split airport. Private car transfer to accommodation.', total_cost_eur: 100, per_adult_cost: null, per_child_cost: null, cost_type: 'flat_group', status: 'confirmed', restrictions: null, warning_flags: [], sort_order: 1 },
  { id: actId(), day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd01', time: null, title: 'McDonough & Sheth (Sanjay) — Zadar to Split Transfer', description: 'Private Sprinter van transfer from Zadar Airport to Split (approx 1h40m)', details: 'McDonough and Sheth (Sanjay) families arrive via Zadar airport. Shared Sprinter van transfer to Split accommodation. Approx 1 hour 40 minutes drive.', total_cost_eur: 265, per_adult_cost: null, per_child_cost: null, cost_type: 'flat_group', status: 'confirmed', restrictions: null, warning_flags: [], sort_order: 2 },
  { id: actId(), day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd01', time: null, title: 'Check-in & Settle', description: 'Check into accommodation and settle in. Free evening.', details: 'All families check into their respective hotels. Free evening to explore Split or rest after travel.', total_cost_eur: 0, per_adult_cost: null, per_child_cost: null, cost_type: 'flat_group', status: 'confirmed', restrictions: null, warning_flags: [], sort_order: 3 },
  // Day 2
  { id: actId(), day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd02', time: null, title: 'Gargi Sheth Family — Split Airport Transfer', description: 'Private transfer from Split Airport (SPU) to hotel', details: 'Gargi Sheth family arrives into Split. Private car transfer to accommodation.', total_cost_eur: 100, per_adult_cost: null, per_child_cost: null, cost_type: 'flat_group', status: 'confirmed', restrictions: null, warning_flags: [], sort_order: 1 },
  { id: actId(), day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd02', time: '09:00', title: 'Free Morning', description: "Explore Split at leisure. Diocletian's Palace, Riva promenade, local markets.", details: "Suggestion: visit Diocletian's Palace, walk the Riva waterfront promenade, explore Green Market for fresh produce and souvenirs.", total_cost_eur: 0, per_adult_cost: null, per_child_cost: null, cost_type: 'flat_group', status: 'confirmed', restrictions: null, warning_flags: [], sort_order: 2 },
  { id: actId(), day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd02', time: '17:00', title: 'Split Tuk-Tuk Tour', description: 'Guided tuk-tuk tour of Split for the whole group', details: 'Group tuk-tuk tour covering Split highlights. Flat rate for the entire group of 16.', total_cost_eur: 400, per_adult_cost: null, per_child_cost: null, cost_type: 'flat_group', status: 'confirmed', restrictions: null, warning_flags: [], sort_order: 3 },
  // Day 3
  { id: actId(), day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd03', time: '09:00', title: 'Hvar Speedboat Excursion', description: 'Full-day speedboat trip to Hvar island. 2 boats required for group of 16. Boat choice pending decision.', details: 'Full-day excursion to Hvar and surrounding islands by speedboat. Two boats needed for the group. Choice between Axopar 28 (EUR 2,000 for 2 boats) and Saxdor 320 GTO (EUR 3,200 for 2 boats). Includes swimming stops, island exploration, and Hvar town visit.', total_cost_eur: null, per_adult_cost: null, per_child_cost: null, cost_type: 'flat_group', status: 'pending_vote', restrictions: null, warning_flags: [], sort_order: 1 },
  // Day 4
  { id: actId(), day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd04', time: '09:00', title: 'River Rafting Adventure', description: 'Half-day river rafting excursion. Suitable for families.', details: 'Half-day guided river rafting. Price is per person: EUR 65/adult, EUR 55/child. Total for group of 9 adults + 7 children = EUR 970 approx. Includes equipment, guide, and transport to river.', total_cost_eur: 970, per_adult_cost: 65, per_child_cost: 55, cost_type: 'per_adult_child', status: 'confirmed', restrictions: 'Minimum age to be confirmed with operator — need to accommodate children aged 8+', warning_flags: ['Confirm minimum age with operator (have 8 year old)'], sort_order: 1 },
  { id: actId(), day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd04', time: '14:00', title: 'Free Afternoon', description: 'Relax or explore Split after rafting', details: 'Free afternoon to rest, swim, or explore Split on your own.', total_cost_eur: 0, per_adult_cost: null, per_child_cost: null, cost_type: 'flat_group', status: 'confirmed', restrictions: null, warning_flags: [], sort_order: 2 },
  // Day 5
  { id: actId(), day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd05', time: '09:00', title: 'Split to Dubrovnik Transfer', description: 'Private Sprinter van transfer from Split to Dubrovnik (approx 3-4 hours)', details: 'Group transfer via private Sprinter van. Approx 3-4 hour drive along the coast. May include a brief stop in Ston or along the way.', total_cost_eur: 650, per_adult_cost: null, per_child_cost: null, cost_type: 'flat_group', status: 'confirmed', restrictions: null, warning_flags: [], sort_order: 1 },
  { id: actId(), day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd05', time: '15:00', title: 'Dubrovnik Old Town Activity', description: 'Afternoon activity in Dubrovnik Old Town. Choice pending decision: Treasure Hunt, Walking Tour, or E-vehicle Tour.', details: 'Three options under consideration: (1) Treasure Hunt at EUR 400 flat, (2) Walking Tour at EUR 480 flat, (3) E-vehicle Tour at EUR 640 flat. All suitable for families with children.', total_cost_eur: null, per_adult_cost: null, per_child_cost: null, cost_type: 'flat_group', status: 'pending_vote', restrictions: null, warning_flags: [], sort_order: 2 },
  // Day 6
  { id: actId(), day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd06', time: '09:00', title: 'Sipan Island Speedboat Excursion', description: 'Full-day speedboat trip to Sipan Island in the Elafiti archipelago', details: 'Private speedboat excursion to Sipan Island. Includes boat hire, fuel, and captain. Full day on the water with swimming, snorkeling, and island exploration.', total_cost_eur: 4750, per_adult_cost: null, per_child_cost: null, cost_type: 'flat_group', status: 'confirmed', restrictions: null, warning_flags: [], sort_order: 1 },
  { id: actId(), day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd06', time: '12:30', title: 'Sare Family Restaurant Lunch', description: 'Group lunch at Sare family restaurant on Sipan. Menu choice pending decision (3-course or 4-course).', details: 'Traditional Dalmatian lunch at the Sare family restaurant. Choice between 3-course menu (EUR 110/person = EUR 1,760 total) or 4-course menu (EUR 130/person = EUR 2,080 total) for all 16 guests.', total_cost_eur: null, per_adult_cost: null, per_child_cost: null, cost_type: 'per_person', status: 'pending_vote', restrictions: null, warning_flags: [], sort_order: 2 },
  { id: actId(), day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd06', time: '18:30', title: 'Dubrovnik Cable Car (Sunset)', description: 'Cable car ride to Mount Srd for panoramic sunset views over Dubrovnik and the Adriatic', details: 'Cable car to the top of Mount Srd. EUR 27 per person x 16 people = EUR 432. Timed for sunset. Confirm operating hours with Villa Escape. Stunning views of Old Town, Lokrum Island, and the coastline.', total_cost_eur: 432, per_adult_cost: null, per_child_cost: null, cost_type: 'per_person', status: 'confirmed', restrictions: null, warning_flags: [], sort_order: 3 },
  // Day 7
  { id: actId(), day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd07', time: '09:00', title: 'ATV Quad Safari', description: 'Morning ATV quad safari through Dubrovnik countryside. Age restrictions may apply.', details: 'ATV quad safari adventure in the hills above Dubrovnik. EUR 110 per person x 16 = EUR 1,760 total. Includes equipment, guide, and refreshments. Duration approx 3 hours.', total_cost_eur: 1760, per_adult_cost: 110, per_child_cost: 110, cost_type: 'per_person', status: 'tentative', restrictions: 'Most ATV operators require minimum age 10+ for passengers, and 16+ or 18+ for drivers. We have children aged 8 and 9. Standard car license required (not motorcycle endorsement) — confirm with operator.', warning_flags: ['Age restriction: 8 and 9 year olds may not qualify', 'Confirm car license sufficient (not motorcycle endorsement)', 'Buggy tour may be needed as alternative'], sort_order: 1 },
  { id: actId(), day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd07', time: '13:00', title: 'Free Afternoon', description: 'Free afternoon to explore Dubrovnik at leisure', details: 'Explore Dubrovnik Old Town, visit the city walls walk, swim at Banje Beach, or relax.', total_cost_eur: 0, per_adult_cost: null, per_child_cost: null, cost_type: 'flat_group', status: 'confirmed', restrictions: null, warning_flags: [], sort_order: 2 },
  // Day 8
  { id: actId(), day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd08', time: null, title: 'Departure Transfers — Dharia, McDonough, Sheth (Sanjay)', description: '3 families depart Dubrovnik. Airport transfers arranged.', details: 'Three families depart. Shared and individual transfers to Dubrovnik airport. Total transfer cost EUR 300 for all 3 families.', total_cost_eur: 300, per_adult_cost: null, per_child_cost: null, cost_type: 'flat_group', status: 'confirmed', restrictions: null, warning_flags: [], sort_order: 1 },
  { id: actId(), day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd08', time: null, title: 'Gargi Sheth — Free Day in Dubrovnik', description: 'Gargi Sheth family has a free day in Dubrovnik before departing the next day.', details: 'Explore Dubrovnik, visit Lokrum Island, walk the city walls, or relax at the beach.', total_cost_eur: 0, per_adult_cost: null, per_child_cost: null, cost_type: 'flat_group', status: 'confirmed', restrictions: null, warning_flags: [], sort_order: 2 },
  // Day 9
  { id: actId(), day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd09', time: null, title: 'Gargi Sheth — Departure Transfer', description: 'Gargi Sheth family departs Dubrovnik. Airport transfer arranged.', details: 'Private transfer from Dubrovnik accommodation to Dubrovnik Airport (DBV).', total_cost_eur: 100, per_adult_cost: null, per_child_cost: null, cost_type: 'flat_group', status: 'confirmed', restrictions: null, warning_flags: [], sort_order: 1 },
]

const decisions: Decision[] = [
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', trip_id: TRIP_ID, title: 'Hvar Speedboat — Which Boat?', description: 'Choose between two boat options for the full-day Hvar speedboat excursion on July 20. We need 2 boats for the group of 16.', deadline: '2026-05-15T23:59:59Z', status: 'open', decided_option_id: null },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', trip_id: TRIP_ID, title: 'Dubrovnik Old Town — Which Activity?', description: 'Choose an afternoon activity for the group after arriving in Dubrovnik on July 22. All options take place in the Old Town.', deadline: '2026-05-15T23:59:59Z', status: 'open', decided_option_id: null },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', trip_id: TRIP_ID, title: 'Sipan Lunch — 3-Course or 4-Course?', description: 'Choose the menu for the group lunch at Sare family restaurant on Sipan Island on July 23. Price is per person for all 16 guests.', deadline: '2026-06-01T23:59:59Z', status: 'open', decided_option_id: null },
  { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', trip_id: TRIP_ID, title: 'ATV Quad Safari — Age Policy Resolution', description: 'We have children aged 8 and 9. Most ATV operators require minimum age 10+ for passengers. We need to either confirm with the operator that our younger children can participate, or switch to a buggy tour alternative that accommodates ages 5+.', deadline: '2026-05-01T23:59:59Z', status: 'open', decided_option_id: null },
]

const decisionOptions: DecisionOption[] = [
  // Hvar boat
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc01', decision_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', title: 'Axopar 28 (x2)', description: 'Two Axopar 28 speedboats. Well-regarded day boats, good for island hopping.', cost_eur: 2000, pros: 'Significantly cheaper (EUR 1,200 savings). Axopar is a well-known brand for day boating. Proven and reliable.', cons: 'Smaller and potentially less comfortable than the Saxdor for a full day. Less shade/cover.' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc02', decision_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', title: 'Saxdor 320 GTO (x2)', description: 'Two Saxdor 320 GTO speedboats. Larger, more premium day cruiser.', cost_eur: 3200, pros: 'More spacious and comfortable for a full-day trip with children. Better shade and amenities. More premium experience.', cons: 'EUR 1,200 more expensive than Axopar option. Need to confirm availability for July 20.' },
  // Old Town activity
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc03', decision_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', title: 'Treasure Hunt', description: 'Interactive treasure hunt through Dubrovnik Old Town. Fun for families and kids.', cost_eur: 400, pros: 'Most affordable option. Interactive and engaging for children. Fun way to explore the Old Town as a group.', cons: 'May feel less informative/educational than a guided tour. Quality depends heavily on the operator.' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc04', decision_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', title: 'Walking Tour', description: 'Guided walking tour of Dubrovnik Old Town with a local guide.', cost_eur: 480, pros: 'Informative and educational. Learn the history and stories of the Old Town. Good introduction to Dubrovnik.', cons: 'Potentially tiring for younger children after a 3-4 hour transfer. Mid-range cost. Passive experience for kids.' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc05', decision_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', title: 'E-vehicle Tour', description: 'Guided tour of Dubrovnik Old Town and surroundings via electric vehicles.', cost_eur: 640, pros: 'Less walking — good after a long transfer day. Covers more ground. Fun for kids riding in e-vehicles. Unique experience.', cons: 'Most expensive option. Less intimate than walking. May not go inside narrow Old Town streets.' },
  // Sipan lunch
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc06', decision_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', title: '3-Course Menu', description: '3-course traditional Dalmatian lunch at EUR 110 per person (EUR 1,760 total for 16 guests).', cost_eur: 1760, pros: 'More affordable (EUR 320 savings). Still a full, satisfying meal. Children may not eat a 4th course anyway.', cons: 'One fewer course — may feel like a missed opportunity at a special restaurant.' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc07', decision_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', title: '4-Course Menu', description: '4-course traditional Dalmatian lunch at EUR 130 per person (EUR 2,080 total for 16 guests).', cost_eur: 2080, pros: 'Fuller dining experience. Special occasion meal at a unique island restaurant. Additional course adds variety.', cons: 'EUR 320 more expensive. Young children may not finish 4 courses. Longer meal time.' },
  // ATV age
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc08', decision_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', title: 'Confirm ATV with Operator', description: 'Ask Villa Escape to confirm with the ATV operator that children aged 8 and 9 can participate as passengers. Keep the ATV quad safari as planned.', cost_eur: 1760, pros: 'Original plan stays intact. ATVs are a more exciting experience for older kids and adults. Already priced and planned.', cons: 'Risk of last-minute cancellation if operator says no. 8 and 9 year olds may find ATVs uncomfortable or scary.' },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccc09', decision_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', title: 'Switch to Buggy Tour', description: 'Replace ATV quad safari with a buggy tour that accommodates younger children (typically age 5+). Buggies are enclosed and more comfortable for young passengers.', cost_eur: null, pros: 'Accommodates all children including 8 and 9 year olds. Buggies are enclosed and safer for young passengers. No age restriction risk.', cons: 'May be less thrilling for older kids and adults. Cost TBD — need quote from Villa Escape. Different experience from ATVs.' },
]

let budgetIdCounter = 1
function budgetId(): string {
  return `eeeeeeee-eeee-eeee-eeee-eeeeeeee${String(budgetIdCounter++).padStart(4, '0')}`
}

const budgetItems: BudgetItem[] = [
  // Day 1 transfers
  { id: budgetId(), trip_id: TRIP_ID, category: 'transfer', description: 'Dharia family — Split airport transfer', amount_eur: 100, is_confirmed: true, paid_to: 'villa_escape', day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd01' },
  { id: budgetId(), trip_id: TRIP_ID, category: 'transfer', description: 'McDonough & Sheth (Sanjay) — Zadar to Split transfer', amount_eur: 265, is_confirmed: true, paid_to: 'villa_escape', day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd01' },
  // Day 2
  { id: budgetId(), trip_id: TRIP_ID, category: 'transfer', description: 'Gargi Sheth — Split airport transfer', amount_eur: 100, is_confirmed: true, paid_to: 'villa_escape', day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd02' },
  { id: budgetId(), trip_id: TRIP_ID, category: 'activity', description: 'Split Tuk-Tuk Tour', amount_eur: 400, is_confirmed: true, paid_to: 'villa_escape', day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd02' },
  // Day 4
  { id: budgetId(), trip_id: TRIP_ID, category: 'activity', description: 'River Rafting (9 adults x EUR 65 + 7 children x EUR 55)', amount_eur: 970, is_confirmed: true, paid_to: 'villa_escape', day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd04' },
  // Day 5
  { id: budgetId(), trip_id: TRIP_ID, category: 'transfer', description: 'Split to Dubrovnik Sprinter transfer', amount_eur: 650, is_confirmed: true, paid_to: 'villa_escape', day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd05' },
  // Day 6
  { id: budgetId(), trip_id: TRIP_ID, category: 'activity', description: 'Sipan Island speedboat excursion', amount_eur: 4750, is_confirmed: true, paid_to: 'villa_escape', day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd06' },
  { id: budgetId(), trip_id: TRIP_ID, category: 'activity', description: 'Dubrovnik Cable Car (EUR 27 x 16 people)', amount_eur: 432, is_confirmed: true, paid_to: 'on_site', day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd06' },
  // Day 7
  { id: budgetId(), trip_id: TRIP_ID, category: 'activity', description: 'ATV Quad Safari (EUR 110 x 16 people)', amount_eur: 1760, is_confirmed: false, paid_to: 'villa_escape', day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd07' },
  // Day 8
  { id: budgetId(), trip_id: TRIP_ID, category: 'transfer', description: '3-family departure transfers from Dubrovnik', amount_eur: 300, is_confirmed: true, paid_to: 'villa_escape', day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd08' },
  // Day 9
  { id: budgetId(), trip_id: TRIP_ID, category: 'transfer', description: 'Gargi Sheth — Dubrovnik departure transfer', amount_eur: 100, is_confirmed: true, paid_to: 'villa_escape', day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd09' },
  // Pending decision items
  { id: budgetId(), trip_id: TRIP_ID, category: 'activity', description: 'Hvar Speedboat — Axopar 28 option (pending decision)', amount_eur: 2000, is_confirmed: false, paid_to: 'villa_escape', day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd03' },
  { id: budgetId(), trip_id: TRIP_ID, category: 'activity', description: 'Hvar Speedboat — Saxdor 320 GTO option (pending decision)', amount_eur: 3200, is_confirmed: false, paid_to: 'villa_escape', day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd03' },
  { id: budgetId(), trip_id: TRIP_ID, category: 'activity', description: 'Dubrovnik Old Town — Treasure Hunt option (pending decision)', amount_eur: 400, is_confirmed: false, paid_to: 'villa_escape', day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd05' },
  { id: budgetId(), trip_id: TRIP_ID, category: 'activity', description: 'Dubrovnik Old Town — Walking Tour option (pending decision)', amount_eur: 480, is_confirmed: false, paid_to: 'villa_escape', day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd05' },
  { id: budgetId(), trip_id: TRIP_ID, category: 'activity', description: 'Dubrovnik Old Town — E-vehicle Tour option (pending decision)', amount_eur: 640, is_confirmed: false, paid_to: 'villa_escape', day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd05' },
  { id: budgetId(), trip_id: TRIP_ID, category: 'activity', description: 'Sipan lunch — 3-course option (pending decision)', amount_eur: 1760, is_confirmed: false, paid_to: 'villa_escape', day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd06' },
  { id: budgetId(), trip_id: TRIP_ID, category: 'activity', description: 'Sipan lunch — 4-course option (pending decision)', amount_eur: 2080, is_confirmed: false, paid_to: 'villa_escape', day_id: 'dddddddd-dddd-dddd-dddd-dddddddddd06' },
]

let qIdCounter = 1
function qId(): string {
  return `ffffffff-ffff-ffff-ffff-ffffffff${String(qIdCounter++).padStart(4, '0')}`
}

const now = new Date().toISOString()

const seedQuestions: Question[] = [
  { id: qId(), trip_id: TRIP_ID, question: 'Please correct day-of-week errors throughout the cost sheet (July 22 is Wednesday not Monday; July 24 is Friday not Wednesday; July 25 is Saturday not Wednesday)', asked_by_family_id: null, status: 'pending', answer: null, created_at: now, resolved_at: null },
  { id: qId(), trip_id: TRIP_ID, question: 'Confirm Saxdor 320 GTO availability for July 20', asked_by_family_id: null, status: 'pending', answer: null, created_at: now, resolved_at: null },
  { id: qId(), trip_id: TRIP_ID, question: 'Confirm ATV operator minimum passenger age — we have children aged 8 and 9. If minimum is 10+, can you source a buggy tour alternative that accommodates younger passengers (5+)?', asked_by_family_id: null, status: 'pending', answer: null, created_at: now, resolved_at: null },
  { id: qId(), trip_id: TRIP_ID, question: 'Confirm standard car license (not motorcycle endorsement) is sufficient for ATV driving', asked_by_family_id: null, status: 'pending', answer: null, created_at: now, resolved_at: null },
  { id: qId(), trip_id: TRIP_ID, question: 'Is there a direct flight into Split airport available for the McDonough/Sheth party instead of Zadar? The 1h40m Zadar-to-Split transfer is a concern with children.', asked_by_family_id: null, status: 'pending', answer: null, created_at: now, resolved_at: null },
  { id: qId(), trip_id: TRIP_ID, question: 'Provide specific restaurant recommendations for each dinner — we need to make reservations for 16 in peak July well in advance', asked_by_family_id: null, status: 'pending', answer: null, created_at: now, resolved_at: null },
  { id: qId(), trip_id: TRIP_ID, question: 'Confirm cable car operating hours for a sunset visit on July 23', asked_by_family_id: null, status: 'pending', answer: null, created_at: now, resolved_at: null },
  { id: qId(), trip_id: TRIP_ID, question: 'Fix the per-person cost split formula on the Zadar transfer (currently divides unevenly between adults and children — should be flat per-head)', asked_by_family_id: null, status: 'pending', answer: null, created_at: now, resolved_at: null },
  { id: qId(), trip_id: TRIP_ID, question: 'Confirm river rafting operator minimum age accommodates children aged 8+', asked_by_family_id: null, status: 'pending', answer: null, created_at: now, resolved_at: null },
  { id: qId(), trip_id: TRIP_ID, question: 'What is the entrance ticket cost for Dubrovnik cable car for children vs adults?', asked_by_family_id: null, status: 'pending', answer: null, created_at: now, resolved_at: null },
]

let packIdCounter = 1
function packId(): string {
  return `dddddddd-aaaa-bbbb-cccc-dddddddd${String(packIdCounter++).padStart(4, '0')}`
}

const packingItems: PackingItem[] = [
  // Essential
  { id: packId(), trip_id: TRIP_ID, item: 'Passport', category: 'essential', for_activity: null, notes: 'Ensure valid for at least 6 months beyond travel dates' },
  { id: packId(), trip_id: TRIP_ID, item: 'Travel insurance documents', category: 'essential', for_activity: null, notes: 'Bring printed copy and save digital copy on phone' },
  { id: packId(), trip_id: TRIP_ID, item: 'EUR cash', category: 'essential', for_activity: null, notes: 'For entrance fees, tips, small purchases. Croatia uses EUR.' },
  { id: packId(), trip_id: TRIP_ID, item: 'Credit cards', category: 'essential', for_activity: null, notes: 'Visa/Mastercard widely accepted. Notify bank of travel dates.' },
  { id: packId(), trip_id: TRIP_ID, item: 'Phone charger', category: 'essential', for_activity: null, notes: null },
  { id: packId(), trip_id: TRIP_ID, item: 'Power adapter (EU Type C/F)', category: 'essential', for_activity: null, notes: 'Croatia uses European standard plugs — Type C and Type F' },
  // Activity-specific
  { id: packId(), trip_id: TRIP_ID, item: 'Water shoes', category: 'activity_specific', for_activity: 'Speedboat excursions', notes: 'For getting on/off boats at rocky shores and swimming stops' },
  { id: packId(), trip_id: TRIP_ID, item: 'Closed-toe shoes', category: 'activity_specific', for_activity: 'ATV Quad Safari', notes: 'Required for ATV/buggy tour — no sandals or flip-flops' },
  { id: packId(), trip_id: TRIP_ID, item: 'Swimwear', category: 'activity_specific', for_activity: 'Speedboats / beaches', notes: 'Multiple sets recommended — lots of water activities' },
  { id: packId(), trip_id: TRIP_ID, item: 'Reef-safe sunscreen', category: 'activity_specific', for_activity: 'All water activities', notes: 'SPF 50+. Reef-safe to protect marine environment.' },
  { id: packId(), trip_id: TRIP_ID, item: 'Motion sickness medication', category: 'activity_specific', for_activity: 'Speedboat excursions', notes: 'Dramamine or equivalent. Especially for children prone to motion sickness.' },
  { id: packId(), trip_id: TRIP_ID, item: 'Light rain jacket', category: 'activity_specific', for_activity: 'River rafting / general', notes: 'Packable rain jacket — July is mostly dry but occasional showers' },
  // Comfort
  { id: packId(), trip_id: TRIP_ID, item: 'Hat', category: 'comfort', for_activity: null, notes: 'Wide-brimmed hat for sun protection. July temps 28-33C.' },
  { id: packId(), trip_id: TRIP_ID, item: 'Sunglasses', category: 'comfort', for_activity: null, notes: 'Polarized recommended for water glare on boat trips' },
  { id: packId(), trip_id: TRIP_ID, item: 'Reusable water bottle', category: 'comfort', for_activity: null, notes: 'Stay hydrated — refill stations available in most areas' },
  { id: packId(), trip_id: TRIP_ID, item: 'Light layers for evenings', category: 'comfort', for_activity: null, notes: 'Evenings can be cooler near the coast. Light cardigan or long-sleeve shirt.' },
  // Documents
  { id: packId(), trip_id: TRIP_ID, item: 'Hotel confirmations', category: 'documents', for_activity: null, notes: 'Print and save digital copies of all hotel booking confirmations' },
  { id: packId(), trip_id: TRIP_ID, item: 'Flight itineraries', category: 'documents', for_activity: null, notes: 'Print and save digital copies of all flight bookings' },
  { id: packId(), trip_id: TRIP_ID, item: 'Emergency contacts list', category: 'documents', for_activity: null, notes: 'Local emergency numbers, embassy contacts, travel insurance hotline, group contacts' },
]

// ============================================================
// Mutable in-memory stores
// ============================================================

const votesStore: Vote[] = []
const commentsStore: Comment[] = []
const questionsStore: Question[] = [...seedQuestions]

let idSeq = 1000
function randomId(): string {
  return `00000000-0000-0000-0000-${String(idSeq++).padStart(12, '0')}`
}

// ============================================================
// Exported functions — matching data.ts signatures
// ============================================================

export async function getTripByAccessCode(code: string): Promise<Trip | null> {
  if (code.toUpperCase() === 'CROATIA26') return { ...trip }
  return null
}

export async function getDays(tripId: string): Promise<Day[]> {
  if (tripId !== TRIP_ID) return []
  return [...days].sort((a, b) => a.day_number - b.day_number)
}

export async function getActivities(dayId: string): Promise<Activity[]> {
  return activities
    .filter((a) => a.day_id === dayId)
    .sort((a, b) => a.sort_order - b.sort_order)
}

export async function getActivitiesForTrip(tripId: string): Promise<Activity[]> {
  if (tripId !== TRIP_ID) return []
  const dayIds = new Set(days.map((d) => d.id))
  return activities
    .filter((a) => dayIds.has(a.day_id))
    .sort((a, b) => a.sort_order - b.sort_order)
}

export async function getDecisions(tripId: string): Promise<Decision[]> {
  if (tripId !== TRIP_ID) return []
  return [...decisions].sort((a, b) => {
    if (!a.deadline) return 1
    if (!b.deadline) return -1
    return a.deadline.localeCompare(b.deadline)
  })
}

export async function getDecisionOptions(decisionId: string): Promise<DecisionOption[]> {
  return decisionOptions.filter((o) => o.decision_id === decisionId)
}

export async function getVotes(decisionId: string): Promise<Vote[]> {
  return votesStore.filter((v) => v.decision_id === decisionId)
}

export async function castVote(
  decisionId: string,
  optionId: string,
  familyId: string
): Promise<Vote | null> {
  // Remove existing vote from this family for this decision
  const idx = votesStore.findIndex(
    (v) => v.decision_id === decisionId && v.family_id === familyId
  )
  if (idx !== -1) votesStore.splice(idx, 1)

  const vote: Vote = {
    id: randomId(),
    decision_id: decisionId,
    option_id: optionId,
    family_id: familyId,
    voted_at: new Date().toISOString(),
  }
  votesStore.push(vote)
  return vote
}

export async function getFamilies(tripId: string): Promise<Family[]> {
  if (tripId !== TRIP_ID) return []
  return [...families].sort((a, b) => a.name.localeCompare(b.name))
}

export async function getBudgetItems(tripId: string): Promise<BudgetItem[]> {
  if (tripId !== TRIP_ID) return []
  return [...budgetItems].sort((a, b) => a.category.localeCompare(b.category))
}

export async function getQuestions(tripId: string): Promise<Question[]> {
  if (tripId !== TRIP_ID) return []
  return [...questionsStore].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export async function addQuestion(
  tripId: string,
  question: string,
  familyId?: string
): Promise<Question | null> {
  const q: Question = {
    id: randomId(),
    trip_id: tripId,
    question,
    asked_by_family_id: familyId ?? null,
    status: 'pending',
    answer: null,
    created_at: new Date().toISOString(),
    resolved_at: null,
  }
  questionsStore.push(q)
  return q
}

export async function updateQuestionStatus(
  id: string,
  status: string,
  answer?: string
): Promise<Question | null> {
  const q = questionsStore.find((q) => q.id === id)
  if (!q) return null
  q.status = status as Question['status']
  if (answer !== undefined) q.answer = answer
  if (status === 'resolved') q.resolved_at = new Date().toISOString()
  return { ...q }
}

export async function getPackingItems(tripId: string): Promise<PackingItem[]> {
  if (tripId !== TRIP_ID) return []
  return [...packingItems].sort((a, b) => a.category.localeCompare(b.category))
}

export async function getComments(
  entityType: 'activity' | 'decision' | 'question',
  entityId: string
): Promise<Comment[]> {
  return commentsStore
    .filter((c) => c.entity_type === entityType && c.entity_id === entityId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export async function addComment(
  entityType: 'activity' | 'decision' | 'question',
  entityId: string,
  familyId: string,
  content: string
): Promise<Comment | null> {
  const comment: Comment = {
    id: randomId(),
    entity_type: entityType,
    entity_id: entityId,
    family_id: familyId,
    content,
    created_at: new Date().toISOString(),
  }
  commentsStore.push(comment)
  return comment
}

export async function getRestaurantReservations(
  _tripId: string
): Promise<RestaurantReservation[]> {
  return []
}
