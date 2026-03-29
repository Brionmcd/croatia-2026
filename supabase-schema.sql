-- ============================================================
-- Croatia Trip Planner — Supabase Schema + Seed Data
-- ============================================================
-- Run this in the Supabase SQL Editor to create all tables,
-- enable RLS, and seed the database with full trip data.
-- ============================================================

-- ============================================================
-- 1. SCHEMA: Create all tables
-- ============================================================

-- Trips
CREATE TABLE trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  access_code text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Families
CREATE TABLE families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name text NOT NULL,
  adults int NOT NULL DEFAULT 0,
  children int NOT NULL DEFAULT 0,
  children_ages int[],
  arrival_flight text,
  arrival_airport text,
  arrival_datetime timestamptz,
  departure_flight text,
  departure_datetime timestamptz,
  timezone text,
  contact_email text
);

-- Days
CREATE TABLE days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number int NOT NULL,
  date date NOT NULL,
  day_of_week text NOT NULL,
  location text NOT NULL,
  title text NOT NULL
);

-- Activities
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid NOT NULL REFERENCES days(id) ON DELETE CASCADE,
  time time,
  title text NOT NULL,
  description text,
  details text,
  total_cost_eur decimal,
  per_adult_cost decimal,
  per_child_cost decimal,
  cost_type text CHECK (cost_type IN ('flat_group', 'per_person', 'per_adult_child')),
  status text CHECK (status IN ('confirmed', 'pending_vote', 'tentative', 'cancelled')) DEFAULT 'confirmed',
  restrictions text,
  warning_flags text[],
  sort_order int DEFAULT 0
);

-- Decisions
CREATE TABLE decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  deadline timestamptz,
  status text CHECK (status IN ('open', 'decided', 'expired')) DEFAULT 'open',
  decided_option_id uuid
);

-- Decision Options
CREATE TABLE decision_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  cost_eur decimal,
  pros text,
  cons text
);

-- Votes
CREATE TABLE votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES decision_options(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  voted_at timestamptz DEFAULT now(),
  UNIQUE (decision_id, family_id)
);

-- Budget Items
CREATE TABLE budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  category text NOT NULL,
  description text NOT NULL,
  amount_eur decimal NOT NULL,
  is_confirmed boolean DEFAULT true,
  paid_to text,
  day_id uuid REFERENCES days(id) ON DELETE SET NULL
);

-- Questions
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  question text NOT NULL,
  asked_by_family_id uuid REFERENCES families(id) ON DELETE SET NULL,
  status text DEFAULT 'pending',
  answer text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Packing Items
CREATE TABLE packing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  item text NOT NULL,
  category text NOT NULL,
  for_activity text,
  notes text
);

-- Comments
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Restaurant Reservations
CREATE TABLE restaurant_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_id uuid REFERENCES days(id) ON DELETE SET NULL,
  restaurant_name text NOT NULL,
  time time,
  num_people int DEFAULT 16,
  booked_by_family_id uuid REFERENCES families(id) ON DELETE SET NULL,
  confirmation_status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Emergency Info
CREATE TABLE emergency_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  family_id uuid REFERENCES families(id) ON DELETE CASCADE,
  insurance_policy text,
  insurance_provider text,
  notes text
);

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================
-- Enable RLS on all tables. Add permissive policies since
-- auth is handled via access code in the application layer.

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE days ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_info ENABLE ROW LEVEL SECURITY;

-- Permissive policies: allow all operations for anonymous/authenticated
CREATE POLICY "Allow all on trips" ON trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on families" ON families FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on days" ON days FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on activities" ON activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on decisions" ON decisions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on decision_options" ON decision_options FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on votes" ON votes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on budget_items" ON budget_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on questions" ON questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on packing_items" ON packing_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on comments" ON comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on restaurant_reservations" ON restaurant_reservations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on emergency_info" ON emergency_info FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 3. SEED DATA
-- ============================================================

-- Fixed UUIDs for referencing
-- Trip
--   11111111-1111-1111-1111-111111111111
-- Families
--   aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa  (family placeholder - not used)
--   aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01  Dharia
--   aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02  McDonough
--   aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03  Sheth (Sanjay)
--   aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04  Sheth (Gargi)
-- Days
--   dddddddd-dddd-dddd-dddd-dddddddddd01  Day 1
--   dddddddd-dddd-dddd-dddd-dddddddddd02  Day 2
--   ... through dd09

-- -------------------------------------------------------
-- 3a. Trip
-- -------------------------------------------------------
INSERT INTO trips (id, name, access_code, start_date, end_date) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Croatia July 2026', 'CROATIA26', '2026-07-18', '2026-07-26');

-- -------------------------------------------------------
-- 3b. Families
-- -------------------------------------------------------
INSERT INTO families (id, trip_id, name, adults, children, children_ages, arrival_airport, timezone) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', '11111111-1111-1111-1111-111111111111',
   'Dharia', 2, 2, ARRAY[12, 14], 'Split (SPU)', 'Asia/Kolkata'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02', '11111111-1111-1111-1111-111111111111',
   'McDonough', 2, 2, ARRAY[10, 13], 'Zadar (ZAD)', 'Europe/Dublin'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03', '11111111-1111-1111-1111-111111111111',
   'Sheth (Sanjay)', 2, 3, ARRAY[8, 9, 16], 'Zadar (ZAD)', 'Asia/Kolkata'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04', '11111111-1111-1111-1111-111111111111',
   'Sheth (Gargi)', 3, 0, ARRAY[]::int[], 'Split (SPU)', 'Asia/Kolkata');

-- -------------------------------------------------------
-- 3c. Days
-- -------------------------------------------------------
INSERT INTO days (id, trip_id, day_number, date, day_of_week, location, title) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', '11111111-1111-1111-1111-111111111111',
   1, '2026-07-18', 'Saturday', 'Split', 'Arrivals & Check-in'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd02', '11111111-1111-1111-1111-111111111111',
   2, '2026-07-19', 'Sunday', 'Split', 'Gargi Arrives + Tuk-Tuk Tour'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd03', '11111111-1111-1111-1111-111111111111',
   3, '2026-07-20', 'Monday', 'Split', 'Hvar Speedboat Excursion'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd04', '11111111-1111-1111-1111-111111111111',
   4, '2026-07-21', 'Tuesday', 'Split', 'River Rafting Adventure'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd05', '11111111-1111-1111-1111-111111111111',
   5, '2026-07-22', 'Wednesday', 'Split to Dubrovnik', 'Transfer Day + Old Town Activity'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd06', '11111111-1111-1111-1111-111111111111',
   6, '2026-07-23', 'Thursday', 'Dubrovnik', 'Sipan Island + Cable Car'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd07', '11111111-1111-1111-1111-111111111111',
   7, '2026-07-24', 'Friday', 'Dubrovnik', 'ATV Quad Safari + Free Afternoon'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd08', '11111111-1111-1111-1111-111111111111',
   8, '2026-07-25', 'Saturday', 'Dubrovnik', '3 Families Depart'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd09', '11111111-1111-1111-1111-111111111111',
   9, '2026-07-26', 'Sunday', 'Dubrovnik', 'Gargi Departs');

-- -------------------------------------------------------
-- 3d. Activities
-- -------------------------------------------------------

-- Day 1: Arrivals
INSERT INTO activities (id, day_id, time, title, description, details, total_cost_eur, cost_type, status, sort_order) VALUES
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddd01', NULL,
   'Dharia Family — Split Airport Transfer',
   'Private transfer from Split Airport (SPU) to hotel',
   'Dharia family arrives via Split airport. Private car transfer to accommodation.',
   100.00, 'flat_group', 'confirmed', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddd01', NULL,
   'McDonough & Sheth (Sanjay) — Zadar to Split Transfer',
   'Private Sprinter van transfer from Zadar Airport to Split (approx 1h40m)',
   'McDonough and Sheth (Sanjay) families arrive via Zadar airport. Shared Sprinter van transfer to Split accommodation. Approx 1 hour 40 minutes drive.',
   265.00, 'flat_group', 'confirmed', 2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddd01', NULL,
   'Check-in & Settle',
   'Check into accommodation and settle in. Free evening.',
   'All families check into their respective hotels. Free evening to explore Split or rest after travel.',
   0, 'flat_group', 'confirmed', 3);

-- Day 2: Gargi Arrives + Tuk-Tuk
INSERT INTO activities (id, day_id, time, title, description, details, total_cost_eur, cost_type, status, sort_order) VALUES
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddd02', NULL,
   'Gargi Sheth Family — Split Airport Transfer',
   'Private transfer from Split Airport (SPU) to hotel',
   'Gargi Sheth family arrives into Split. Private car transfer to accommodation.',
   100.00, 'flat_group', 'confirmed', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddd02', '09:00',
   'Free Morning',
   'Explore Split at leisure. Diocletian''s Palace, Riva promenade, local markets.',
   'Suggestion: visit Diocletian''s Palace, walk the Riva waterfront promenade, explore Green Market for fresh produce and souvenirs.',
   0, 'flat_group', 'confirmed', 2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddd02', '17:00',
   'Split Tuk-Tuk Tour',
   'Guided tuk-tuk tour of Split for the whole group',
   'Group tuk-tuk tour covering Split highlights. Flat rate for the entire group of 16.',
   400.00, 'flat_group', 'confirmed', 3);

-- Day 3: Hvar Speedboat Excursion (UNDECIDED — boat choice)
INSERT INTO activities (id, day_id, time, title, description, details, total_cost_eur, cost_type, status, sort_order) VALUES
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddd03', '09:00',
   'Hvar Speedboat Excursion',
   'Full-day speedboat trip to Hvar island. 2 boats required for group of 16. Boat choice pending decision.',
   'Full-day excursion to Hvar and surrounding islands by speedboat. Two boats needed for the group. Choice between Axopar 28 (EUR 2,000 for 2 boats) and Saxdor 320 GTO (EUR 3,200 for 2 boats). Includes swimming stops, island exploration, and Hvar town visit.',
   NULL, 'flat_group', 'pending_vote', 1);

-- Day 4: River Rafting
INSERT INTO activities (id, day_id, time, title, description, details, total_cost_eur, per_adult_cost, per_child_cost, cost_type, status, restrictions, warning_flags, sort_order) VALUES
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddd04', '09:00',
   'River Rafting Adventure',
   'Half-day river rafting excursion. Suitable for families.',
   'Half-day guided river rafting. Price is per person: EUR 65/adult, EUR 55/child. Total for group of 9 adults + 7 children = EUR 970 approx. Includes equipment, guide, and transport to river.',
   970.00, 65.00, 55.00, 'per_adult_child', 'confirmed',
   'Minimum age to be confirmed with operator — need to accommodate children aged 8+',
   ARRAY['Confirm minimum age with operator (have 8 year old)'],
   1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddd04', '14:00',
   'Free Afternoon',
   'Relax or explore Split after rafting',
   'Free afternoon to rest, swim, or explore Split on your own.',
   0, NULL, NULL, 'flat_group', 'confirmed', NULL, NULL, 2);

-- Day 5: Transfer + Old Town Activity (UNDECIDED)
INSERT INTO activities (id, day_id, time, title, description, details, total_cost_eur, cost_type, status, sort_order) VALUES
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddd05', '09:00',
   'Split to Dubrovnik Transfer',
   'Private Sprinter van transfer from Split to Dubrovnik (approx 3-4 hours)',
   'Group transfer via private Sprinter van. Approx 3-4 hour drive along the coast. May include a brief stop in Ston or along the way.',
   650.00, 'flat_group', 'confirmed', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddd05', '15:00',
   'Dubrovnik Old Town Activity',
   'Afternoon activity in Dubrovnik Old Town. Choice pending decision: Treasure Hunt, Walking Tour, or E-vehicle Tour.',
   'Three options under consideration: (1) Treasure Hunt at EUR 400 flat, (2) Walking Tour at EUR 480 flat, (3) E-vehicle Tour at EUR 640 flat. All suitable for families with children.',
   NULL, 'flat_group', 'pending_vote', 2);

-- Day 6: Sipan Island + Lunch + Cable Car
INSERT INTO activities (id, day_id, time, title, description, details, total_cost_eur, cost_type, status, sort_order) VALUES
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddd06', '09:00',
   'Sipan Island Speedboat Excursion',
   'Full-day speedboat trip to Sipan Island in the Elafiti archipelago',
   'Private speedboat excursion to Sipan Island. Includes boat hire, fuel, and captain. Full day on the water with swimming, snorkeling, and island exploration.',
   4750.00, 'flat_group', 'confirmed', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddd06', '12:30',
   'Sare Family Restaurant Lunch',
   'Group lunch at Sare family restaurant on Sipan. Menu choice pending decision (3-course or 4-course).',
   'Traditional Dalmatian lunch at the Sare family restaurant. Choice between 3-course menu (EUR 110/person = EUR 1,760 total) or 4-course menu (EUR 130/person = EUR 2,080 total) for all 16 guests.',
   NULL, 'per_person', 'pending_vote', 2),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddd06', '18:30',
   'Dubrovnik Cable Car (Sunset)',
   'Cable car ride to Mount Srd for panoramic sunset views over Dubrovnik and the Adriatic',
   'Cable car to the top of Mount Srd. EUR 27 per person x 16 people = EUR 432. Timed for sunset. Confirm operating hours with Villa Escape. Stunning views of Old Town, Lokrum Island, and the coastline.',
   432.00, 'per_person', 'confirmed', 3);

-- Day 7: ATV Quad Safari + Free Afternoon
INSERT INTO activities (id, day_id, time, title, description, details, total_cost_eur, per_adult_cost, per_child_cost, cost_type, status, restrictions, warning_flags, sort_order) VALUES
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddd07', '09:00',
   'ATV Quad Safari',
   'Morning ATV quad safari through Dubrovnik countryside. Age restrictions may apply.',
   'ATV quad safari adventure in the hills above Dubrovnik. EUR 110 per person x 16 = EUR 1,760 total. Includes equipment, guide, and refreshments. Duration approx 3 hours.',
   1760.00, 110.00, 110.00, 'per_person', 'tentative',
   'Most ATV operators require minimum age 10+ for passengers, and 16+ or 18+ for drivers. We have children aged 8 and 9. Standard car license required (not motorcycle endorsement) — confirm with operator.',
   ARRAY['Age restriction: 8 and 9 year olds may not qualify', 'Confirm car license sufficient (not motorcycle endorsement)', 'Buggy tour may be needed as alternative'],
   1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddd07', '13:00',
   'Free Afternoon',
   'Free afternoon to explore Dubrovnik at leisure',
   'Explore Dubrovnik Old Town, visit the city walls walk, swim at Banje Beach, or relax.',
   0, NULL, NULL, 'flat_group', 'confirmed', NULL, NULL, 2);

-- Day 8: 3 Families Depart
INSERT INTO activities (id, day_id, time, title, description, details, total_cost_eur, cost_type, status, sort_order) VALUES
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddd08', NULL,
   'Departure Transfers — Dharia, McDonough, Sheth (Sanjay)',
   '3 families depart Dubrovnik. Airport transfers arranged.',
   'Three families depart. Shared and individual transfers to Dubrovnik airport. Total transfer cost EUR 300 for all 3 families.',
   300.00, 'flat_group', 'confirmed', 1),
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddd08', NULL,
   'Gargi Sheth — Free Day in Dubrovnik',
   'Gargi Sheth family has a free day in Dubrovnik before departing the next day.',
   'Explore Dubrovnik, visit Lokrum Island, walk the city walls, or relax at the beach.',
   0, 'flat_group', 'confirmed', 2);

-- Day 9: Gargi Departs
INSERT INTO activities (id, day_id, time, title, description, details, total_cost_eur, cost_type, status, sort_order) VALUES
  (gen_random_uuid(), 'dddddddd-dddd-dddd-dddd-dddddddddd09', NULL,
   'Gargi Sheth — Departure Transfer',
   'Gargi Sheth family departs Dubrovnik. Airport transfer arranged.',
   'Private transfer from Dubrovnik accommodation to Dubrovnik Airport (DBV).',
   100.00, 'flat_group', 'confirmed', 1);

-- -------------------------------------------------------
-- 3e. Decisions
-- -------------------------------------------------------

-- Decision 1: Hvar Speedboat choice
INSERT INTO decisions (id, trip_id, title, description, deadline, status) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', '11111111-1111-1111-1111-111111111111',
   'Hvar Speedboat — Which Boat?',
   'Choose between two boat options for the full-day Hvar speedboat excursion on July 20. We need 2 boats for the group of 16.',
   '2026-05-15T23:59:59Z', 'open');

INSERT INTO decision_options (id, decision_id, title, description, cost_eur, pros, cons) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccc01', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01',
   'Axopar 28 (x2)',
   'Two Axopar 28 speedboats. Well-regarded day boats, good for island hopping.',
   2000.00,
   'Significantly cheaper (EUR 1,200 savings). Axopar is a well-known brand for day boating. Proven and reliable.',
   'Smaller and potentially less comfortable than the Saxdor for a full day. Less shade/cover.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01',
   'Saxdor 320 GTO (x2)',
   'Two Saxdor 320 GTO speedboats. Larger, more premium day cruiser.',
   3200.00,
   'More spacious and comfortable for a full-day trip with children. Better shade and amenities. More premium experience.',
   'EUR 1,200 more expensive than Axopar option. Need to confirm availability for July 20.');

-- Decision 2: Dubrovnik Old Town activity
INSERT INTO decisions (id, trip_id, title, description, deadline, status) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', '11111111-1111-1111-1111-111111111111',
   'Dubrovnik Old Town — Which Activity?',
   'Choose an afternoon activity for the group after arriving in Dubrovnik on July 22. All options take place in the Old Town.',
   '2026-05-15T23:59:59Z', 'open');

INSERT INTO decision_options (id, decision_id, title, description, cost_eur, pros, cons) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccc03', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02',
   'Treasure Hunt',
   'Interactive treasure hunt through Dubrovnik Old Town. Fun for families and kids.',
   400.00,
   'Most affordable option. Interactive and engaging for children. Fun way to explore the Old Town as a group.',
   'May feel less informative/educational than a guided tour. Quality depends heavily on the operator.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc04', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02',
   'Walking Tour',
   'Guided walking tour of Dubrovnik Old Town with a local guide.',
   480.00,
   'Informative and educational. Learn the history and stories of the Old Town. Good introduction to Dubrovnik.',
   'Potentially tiring for younger children after a 3-4 hour transfer. Mid-range cost. Passive experience for kids.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc05', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02',
   'E-vehicle Tour',
   'Guided tour of Dubrovnik Old Town and surroundings via electric vehicles.',
   640.00,
   'Less walking — good after a long transfer day. Covers more ground. Fun for kids riding in e-vehicles. Unique experience.',
   'Most expensive option. Less intimate than walking. May not go inside narrow Old Town streets.');

-- Decision 3: Sipan lunch menu
INSERT INTO decisions (id, trip_id, title, description, deadline, status) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', '11111111-1111-1111-1111-111111111111',
   'Sipan Lunch — 3-Course or 4-Course?',
   'Choose the menu for the group lunch at Sare family restaurant on Sipan Island on July 23. Price is per person for all 16 guests.',
   '2026-06-01T23:59:59Z', 'open');

INSERT INTO decision_options (id, decision_id, title, description, cost_eur, pros, cons) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccc06', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03',
   '3-Course Menu',
   '3-course traditional Dalmatian lunch at EUR 110 per person (EUR 1,760 total for 16 guests).',
   1760.00,
   'More affordable (EUR 320 savings). Still a full, satisfying meal. Children may not eat a 4th course anyway.',
   'One fewer course — may feel like a missed opportunity at a special restaurant.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc07', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03',
   '4-Course Menu',
   '4-course traditional Dalmatian lunch at EUR 130 per person (EUR 2,080 total for 16 guests).',
   2080.00,
   'Fuller dining experience. Special occasion meal at a unique island restaurant. Additional course adds variety.',
   'EUR 320 more expensive. Young children may not finish 4 courses. Longer meal time.');

-- Decision 4: ATV age policy
INSERT INTO decisions (id, trip_id, title, description, deadline, status) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', '11111111-1111-1111-1111-111111111111',
   'ATV Quad Safari — Age Policy Resolution',
   'We have children aged 8 and 9. Most ATV operators require minimum age 10+ for passengers. We need to either confirm with the operator that our younger children can participate, or switch to a buggy tour alternative that accommodates ages 5+.',
   '2026-05-01T23:59:59Z', 'open');

INSERT INTO decision_options (id, decision_id, title, description, cost_eur, pros, cons) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccc08', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04',
   'Confirm ATV with Operator',
   'Ask Villa Escape to confirm with the ATV operator that children aged 8 and 9 can participate as passengers. Keep the ATV quad safari as planned.',
   1760.00,
   'Original plan stays intact. ATVs are a more exciting experience for older kids and adults. Already priced and planned.',
   'Risk of last-minute cancellation if operator says no. 8 and 9 year olds may find ATVs uncomfortable or scary.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc09', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04',
   'Switch to Buggy Tour',
   'Replace ATV quad safari with a buggy tour that accommodates younger children (typically age 5+). Buggies are enclosed and more comfortable for young passengers.',
   NULL,
   'Accommodates all children including 8 and 9 year olds. Buggies are enclosed and safer for young passengers. No age restriction risk.',
   'May be less thrilling for older kids and adults. Cost TBD — need quote from Villa Escape. Different experience from ATVs.');

-- -------------------------------------------------------
-- 3f. Questions for Villa Escape
-- -------------------------------------------------------
INSERT INTO questions (id, trip_id, question, status, created_at) VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'Please correct day-of-week errors throughout the cost sheet (July 22 is Wednesday not Monday; July 24 is Friday not Wednesday; July 25 is Saturday not Wednesday)',
   'pending', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'Confirm Saxdor 320 GTO availability for July 20',
   'pending', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'Confirm ATV operator minimum passenger age — we have children aged 8 and 9. If minimum is 10+, can you source a buggy tour alternative that accommodates younger passengers (5+)?',
   'pending', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'Confirm standard car license (not motorcycle endorsement) is sufficient for ATV driving',
   'pending', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'Is there a direct flight into Split airport available for the McDonough/Sheth party instead of Zadar? The 1h40m Zadar-to-Split transfer is a concern with children.',
   'pending', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'Provide specific restaurant recommendations for each dinner — we need to make reservations for 16 in peak July well in advance',
   'pending', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'Confirm cable car operating hours for a sunset visit on July 23',
   'pending', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'Fix the per-person cost split formula on the Zadar transfer (currently divides unevenly between adults and children — should be flat per-head)',
   'pending', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'Confirm river rafting operator minimum age accommodates children aged 8+',
   'pending', now()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'What is the entrance ticket cost for Dubrovnik cable car for children vs adults?',
   'pending', now());

-- -------------------------------------------------------
-- 3g. Budget Items (all confirmed costs)
-- -------------------------------------------------------
INSERT INTO budget_items (id, trip_id, category, description, amount_eur, is_confirmed, paid_to, day_id) VALUES
  -- Day 1 transfers
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'transfer', 'Dharia family — Split airport transfer', 100.00, true, 'villa_escape',
   'dddddddd-dddd-dddd-dddd-dddddddddd01'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'transfer', 'McDonough & Sheth (Sanjay) — Zadar to Split transfer', 265.00, true, 'villa_escape',
   'dddddddd-dddd-dddd-dddd-dddddddddd01'),

  -- Day 2
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'transfer', 'Gargi Sheth — Split airport transfer', 100.00, true, 'villa_escape',
   'dddddddd-dddd-dddd-dddd-dddddddddd02'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'activity', 'Split Tuk-Tuk Tour', 400.00, true, 'villa_escape',
   'dddddddd-dddd-dddd-dddd-dddddddddd02'),

  -- Day 4
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'activity', 'River Rafting (9 adults x EUR 65 + 7 children x EUR 55)', 970.00, true, 'villa_escape',
   'dddddddd-dddd-dddd-dddd-dddddddddd04'),

  -- Day 5
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'transfer', 'Split to Dubrovnik Sprinter transfer', 650.00, true, 'villa_escape',
   'dddddddd-dddd-dddd-dddd-dddddddddd05'),

  -- Day 6
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'activity', 'Sipan Island speedboat excursion', 4750.00, true, 'villa_escape',
   'dddddddd-dddd-dddd-dddd-dddddddddd06'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'activity', 'Dubrovnik Cable Car (EUR 27 x 16 people)', 432.00, true, 'on_site',
   'dddddddd-dddd-dddd-dddd-dddddddddd06'),

  -- Day 7
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'activity', 'ATV Quad Safari (EUR 110 x 16 people)', 1760.00, false, 'villa_escape',
   'dddddddd-dddd-dddd-dddd-dddddddddd07'),

  -- Day 8
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'transfer', '3-family departure transfers from Dubrovnik', 300.00, true, 'villa_escape',
   'dddddddd-dddd-dddd-dddd-dddddddddd08'),

  -- Day 9
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'transfer', 'Gargi Sheth — Dubrovnik departure transfer', 100.00, true, 'villa_escape',
   'dddddddd-dddd-dddd-dddd-dddddddddd09'),

  -- Pending decision items (not confirmed — estimates)
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'activity', 'Hvar Speedboat — Axopar 28 option (pending decision)', 2000.00, false, 'villa_escape',
   'dddddddd-dddd-dddd-dddd-dddddddddd03'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'activity', 'Hvar Speedboat — Saxdor 320 GTO option (pending decision)', 3200.00, false, 'villa_escape',
   'dddddddd-dddd-dddd-dddd-dddddddddd03'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'activity', 'Dubrovnik Old Town — Treasure Hunt option (pending decision)', 400.00, false, 'villa_escape',
   'dddddddd-dddd-dddd-dddd-dddddddddd05'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'activity', 'Dubrovnik Old Town — Walking Tour option (pending decision)', 480.00, false, 'villa_escape',
   'dddddddd-dddd-dddd-dddd-dddddddddd05'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'activity', 'Dubrovnik Old Town — E-vehicle Tour option (pending decision)', 640.00, false, 'villa_escape',
   'dddddddd-dddd-dddd-dddd-dddddddddd05'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'activity', 'Sipan lunch — 3-course option (pending decision)', 1760.00, false, 'villa_escape',
   'dddddddd-dddd-dddd-dddd-dddddddddd06'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111',
   'activity', 'Sipan lunch — 4-course option (pending decision)', 2080.00, false, 'villa_escape',
   'dddddddd-dddd-dddd-dddd-dddddddddd06');

-- -------------------------------------------------------
-- 3h. Packing Items
-- -------------------------------------------------------

-- Essential
INSERT INTO packing_items (trip_id, item, category, for_activity, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Passport', 'essential', NULL, 'Ensure valid for at least 6 months beyond travel dates'),
  ('11111111-1111-1111-1111-111111111111', 'Travel insurance documents', 'essential', NULL, 'Bring printed copy and save digital copy on phone'),
  ('11111111-1111-1111-1111-111111111111', 'EUR cash', 'essential', NULL, 'For entrance fees, tips, small purchases. Croatia uses EUR.'),
  ('11111111-1111-1111-1111-111111111111', 'Credit cards', 'essential', NULL, 'Visa/Mastercard widely accepted. Notify bank of travel dates.'),
  ('11111111-1111-1111-1111-111111111111', 'Phone charger', 'essential', NULL, NULL),
  ('11111111-1111-1111-1111-111111111111', 'Power adapter (EU Type C/F)', 'essential', NULL, 'Croatia uses European standard plugs — Type C and Type F');

-- Activity-specific
INSERT INTO packing_items (trip_id, item, category, for_activity, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Water shoes', 'activity_specific', 'Speedboat excursions', 'For getting on/off boats at rocky shores and swimming stops'),
  ('11111111-1111-1111-1111-111111111111', 'Closed-toe shoes', 'activity_specific', 'ATV Quad Safari', 'Required for ATV/buggy tour — no sandals or flip-flops'),
  ('11111111-1111-1111-1111-111111111111', 'Swimwear', 'activity_specific', 'Speedboats / beaches', 'Multiple sets recommended — lots of water activities'),
  ('11111111-1111-1111-1111-111111111111', 'Reef-safe sunscreen', 'activity_specific', 'All water activities', 'SPF 50+. Reef-safe to protect marine environment.'),
  ('11111111-1111-1111-1111-111111111111', 'Motion sickness medication', 'activity_specific', 'Speedboat excursions', 'Dramamine or equivalent. Especially for children prone to motion sickness.'),
  ('11111111-1111-1111-1111-111111111111', 'Light rain jacket', 'activity_specific', 'River rafting / general', 'Packable rain jacket — July is mostly dry but occasional showers');

-- Comfort
INSERT INTO packing_items (trip_id, item, category, for_activity, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Hat', 'comfort', NULL, 'Wide-brimmed hat for sun protection. July temps 28-33C.'),
  ('11111111-1111-1111-1111-111111111111', 'Sunglasses', 'comfort', NULL, 'Polarized recommended for water glare on boat trips'),
  ('11111111-1111-1111-1111-111111111111', 'Reusable water bottle', 'comfort', NULL, 'Stay hydrated — refill stations available in most areas'),
  ('11111111-1111-1111-1111-111111111111', 'Light layers for evenings', 'comfort', NULL, 'Evenings can be cooler near the coast. Light cardigan or long-sleeve shirt.');

-- Documents
INSERT INTO packing_items (trip_id, item, category, for_activity, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Hotel confirmations', 'documents', NULL, 'Print and save digital copies of all hotel booking confirmations'),
  ('11111111-1111-1111-1111-111111111111', 'Flight itineraries', 'documents', NULL, 'Print and save digital copies of all flight bookings'),
  ('11111111-1111-1111-1111-111111111111', 'Emergency contacts list', 'documents', NULL, 'Local emergency numbers, embassy contacts, travel insurance hotline, group contacts');

-- ============================================================
-- Done! Schema created and seeded.
-- ============================================================
