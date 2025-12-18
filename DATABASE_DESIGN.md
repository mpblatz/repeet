# Database Design - Three-List Structure

## Core Concept

Problems flow through three states:
```
QUEUED → ACTIVE → MASTERED
(Queue)  (Review)  (Trophy Case)
```

---

## Tables Overview

### 1. **problems** (Main table)
Stores all problems with their current state and scheduling info.

### 2. **attempts** (History table)
Records every practice session - when you attempted a problem and how you rated it.

### 3. **user_settings** (Config table)
User preferences and audit tracking.

---

## Detailed Schema

### **problems** Table

| Column | Type | Purpose | Example |
|--------|------|---------|---------|
| `id` | UUID | Unique identifier | `550e8400-...` |
| `user_id` | UUID | Owner of problem | `auth.uid()` |
| `problem_name` | TEXT | Display name | "Two Sum" |
| `problem_link` | TEXT | LeetCode URL | "https://..." |
| `difficulty` | TEXT | Easy/Medium/Hard | "Easy" |
| **`status`** | **TEXT** | **Which list** | **'queued'**, **'active'**, or **'mastered'** |
| `queue_position` | INT | Order in queue | 1, 2, 3... (NULL if not queued) |
| `next_review_date` | DATE | When to practice next | "2025-12-20" (NULL if queued) |
| `attempt_count` | INT | Times attempted | 0, 1, 2, 3... |
| `consecutive_fives` | INT | Mastery tracking | 0, 1, 2 (2 = mastered) |
| `last_rating` | INT | Most recent rating | 1-5 |
| `created_at` | TIMESTAMP | When added | "2025-12-16 10:30" |
| `mastered_at` | TIMESTAMP | When mastered | "2025-12-20 15:45" (NULL until mastered) |
| `source` | TEXT | Where from | "neetcode150", "grind75", "custom" |
| `topic` | TEXT | Category | "arrays", "trees", "dp" |

**Key Insight:** `status` determines which list a problem appears in:
- `'queued'` → Queue list
- `'active'` → Review list (has been attempted, not mastered)
- `'mastered'` → Mastered list

### **attempts** Table

| Column | Type | Purpose | Example |
|--------|------|---------|---------|
| `id` | UUID | Unique identifier | `660e8400-...` |
| `problem_id` | UUID | Which problem | References `problems.id` |
| `rating` | INT | Your self-rating | 1-5 |
| `attempted_at` | TIMESTAMP | When practiced | "2025-12-16 14:30" |
| `notes` | TEXT | Optional notes | "Used two pointers" |
| `time_spent_minutes` | INT | Duration | 45 |

**Example:** If you practice "Two Sum" three times, you'd have 3 rows in this table.

### **user_settings** Table

| Column | Type | Purpose | Example |
|--------|------|---------|---------|
| `user_id` | UUID | User | `auth.uid()` |
| `last_audit_date` | DATE | Last audit check | "2025-12-16" |
| `audit_problem_id` | UUID | Today's audit | References `problems.id` |
| `daily_goal` | INT | Target per day | 3 |
| `enable_audits` | BOOLEAN | Audit on/off | true |

---

## State Transitions

### Adding a New Problem (Status: `queued`)
```sql
INSERT INTO problems (
  user_id, 
  problem_name, 
  difficulty, 
  status, 
  queue_position
) VALUES (
  auth.uid(),
  'Two Sum',
  'Easy',
  'queued',
  50  -- Last in queue
);
```

**Result:**
- `status` = 'queued'
- `queue_position` = 50
- `next_review_date` = NULL
- `attempt_count` = 0

### First Attempt (Status: `queued` → `active`)

**User solves problem, rates it 2:**

```sql
-- 1. Add attempt record
INSERT INTO attempts (problem_id, rating)
VALUES ('550e8400-...', 2);

-- 2. Update problem
UPDATE problems 
SET 
  status = 'active',
  queue_position = NULL,
  next_review_date = CURRENT_DATE + 2,  -- Rating of 2 = review in 2 days
  attempt_count = 1,
  last_rating = 2,
  consecutive_fives = 0
WHERE id = '550e8400-...';
```

**Result:**
- Problem moves from Queue → Review
- Scheduled for 2 days from now
- No longer has a queue_position

### Second Attempt (Status: `active`, rating: 4)

```sql
-- 1. Add attempt
INSERT INTO attempts (problem_id, rating)
VALUES ('550e8400-...', 4);

-- 2. Update problem
UPDATE problems
SET
  next_review_date = CURRENT_DATE + 4,  -- Rating of 4 = review in 4 days
  attempt_count = 2,
  last_rating = 4,
  consecutive_fives = 0  -- Not a 5, reset
WHERE id = '550e8400-...';
```

**Result:**
- Stays in Review
- Rescheduled 4 days out
- consecutive_fives reset to 0

### Third Attempt (Status: `active` → `active`, rating: 5)

```sql
-- First 5
UPDATE problems
SET
  next_review_date = CURRENT_DATE + 5,
  attempt_count = 3,
  last_rating = 5,
  consecutive_fives = 1  -- First 5!
WHERE id = '550e8400-...';
```

**Result:**
- Still in Review (need 2 consecutive fives)
- When due next time, will be marked as "mastery attempt" (★)

### Fourth Attempt (Status: `active` → `mastered`, rating: 5)

```sql
-- Second consecutive 5 = MASTERED!
UPDATE problems
SET
  status = 'mastered',
  next_review_date = NULL,  -- No longer scheduled
  attempt_count = 4,
  last_rating = 5,
  consecutive_fives = 2,
  mastered_at = NOW()
WHERE id = '550e8400-...';
```

**Result:**
- Problem moves to Mastered list
- No longer appears in Review
- Can be randomly audited

---

## Example Queries

### Get Queue (Next Up)
```sql
SELECT * FROM problems
WHERE user_id = auth.uid() 
  AND status = 'queued'
ORDER BY queue_position;
```

**Returns:** All problems you haven't attempted yet, in order.

### Get Review (Due Today)
```sql
SELECT 
  p.*,
  a.attempted_at as last_attempt,
  a.rating as last_rating_detail
FROM problems p
LEFT JOIN LATERAL (
  SELECT attempted_at, rating
  FROM attempts
  WHERE problem_id = p.id
  ORDER BY attempted_at DESC
  LIMIT 1
) a ON true
WHERE p.user_id = auth.uid()
  AND p.status = 'active'
  AND p.next_review_date <= CURRENT_DATE
ORDER BY p.next_review_date, p.last_rating;
```

**Returns:** Problems due today, sorted by:
1. Earliest next_review_date
2. Lowest last_rating (struggling problems first)

### Get Mastered
```sql
SELECT * FROM problems
WHERE user_id = auth.uid()
  AND status = 'mastered'
ORDER BY mastered_at DESC;
```

**Returns:** Your trophy case, newest first.

### Get Problem with Full History
```sql
SELECT 
  p.*,
  json_agg(
    json_build_object(
      'rating', a.rating,
      'attempted_at', a.attempted_at,
      'notes', a.notes
    ) ORDER BY a.attempted_at
  ) as attempt_history
FROM problems p
LEFT JOIN attempts a ON p.id = a.problem_id
WHERE p.id = '550e8400-...'
GROUP BY p.id;
```

**Returns:** Problem with all attempts in chronological order.

---

## Bulk Import (Loading Neetcode 150)

```sql
-- Generate queue positions automatically
WITH next_position AS (
  SELECT COALESCE(MAX(queue_position), 0) + 1 as start_pos
  FROM problems
  WHERE user_id = auth.uid()
)
INSERT INTO problems (
  user_id,
  problem_name,
  difficulty,
  problem_link,
  status,
  queue_position,
  source
)
SELECT
  auth.uid(),
  problem_name,
  difficulty,
  problem_link,
  'queued',
  ROW_NUMBER() OVER () + (SELECT start_pos FROM next_position) - 1,
  'neetcode150'
FROM unnest(
  ARRAY['Two Sum', 'Valid Parentheses', 'Merge Two Sorted Lists', ...],
  ARRAY['Easy', 'Easy', 'Easy', ...],
  ARRAY['https://...', 'https://...', 'https://...', ...]
) AS t(problem_name, difficulty, problem_link);
```

This adds 150 problems to the end of your queue in one query.

---

## Stats Queries

### Problems by Status
```sql
SELECT 
  status,
  COUNT(*) as count
FROM problems
WHERE user_id = auth.uid()
GROUP BY status;
```

**Result:**
```
queued  | 47
active  | 12
mastered| 8
```

### Average Rating Over Time
```sql
SELECT 
  DATE(attempted_at) as date,
  AVG(rating)::NUMERIC(3,2) as avg_rating,
  COUNT(*) as attempts
FROM attempts a
JOIN problems p ON a.problem_id = p.id
WHERE p.user_id = auth.uid()
  AND attempted_at >= CURRENT_DATE - 30
GROUP BY DATE(attempted_at)
ORDER BY date;
```

### Mastery Rate by Difficulty
```sql
SELECT 
  difficulty,
  COUNT(*) FILTER (WHERE status = 'mastered') as mastered,
  COUNT(*) as total,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'mastered') / COUNT(*),
    1
  ) as mastery_percentage
FROM problems
WHERE user_id = auth.uid()
  AND status IN ('active', 'mastered')
GROUP BY difficulty;
```

**Result:**
```
Easy  | 8  | 10 | 80.0%
Medium| 2  | 15 | 13.3%
Hard  | 0  | 5  | 0.0%
```

---

## Key Design Decisions

1. **Single `status` field** instead of boolean flags
   - Cleaner: one source of truth
   - Easier to query: `WHERE status = 'active'`
   - Prevents invalid states (can't be queued AND mastered)

2. **`queue_position` is nullable**
   - NULL when not in queue (active or mastered)
   - Allows gaps (easier reordering)

3. **Separate `attempts` table**
   - Full history preserved
   - Can add features like notes, time tracking
   - Easy to calculate stats

4. **`next_review_date` is a DATE, not TIMESTAMP**
   - Reviews are day-based, not hour-based
   - Simpler comparisons: `<= CURRENT_DATE`

5. **Denormalized fields** (`last_rating`, `attempt_count`)
   - Trade: slight redundancy for much faster queries
   - Don't need to join `attempts` for list views
   - Updated via triggers or application code

---

This structure makes the three-list mental model crystal clear in the database!
