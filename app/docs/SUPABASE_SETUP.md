# Supabase Setup for Reviews

This guide walks you through setting up Supabase for the Popcorns app to enable **multi-user review syncing**.

## Prerequisites

- A Supabase account ([sign up free at supabase.com](https://supabase.com))
- The Popcorns app project

## Step 1: Create a Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click **"New project"**
3. Fill in:
   - **Name**: `popcorns` (or any name you prefer)
   - **Database Password**: Choose a strong password (save it somewhere safe)
   - **Region**: Select the closest region to your users
4. Click **"Create new project"** and wait for it to initialize (~2 minutes)

## Step 2: Run the Database Migration

1. In your Supabase project dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Copy the contents of `supabase/migrations/002_reviews.sql` from this repo
4. Paste it into the SQL editor
5. Click **"Run"** or press `Ctrl/Cmd + Enter`
6. You should see: `Success. No rows returned`

This creates the `reviews` table with:
- UUID primary key
- Movie ID, rating, text, user ID
- Indexes for fast queries
- Row Level Security enabled (allows all operations for now)

## Step 3: Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** (gear icon) → **API**
2. Under **"Project API keys"**, find:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public** key (starts with `eyJhbG...`)
3. Copy both values

## Step 4: Configure the App

1. In the Popcorns app root directory, create a `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Save the file

## Step 5: Verify the Connection

1. Start the app:
   ```bash
   npm start
   ```

2. Check the console logs. You should see:
   ```
   ✅ Supabase: Connected
   ```

   If you see this instead:
   ```
   ⚠️ Supabase: Not configured (using local storage only)
   ```
   Then double-check your `.env` file and restart the app.

## Step 6: Test Review Syncing

1. Open the app and navigate to any movie
2. Scroll down to **"User Reviews"**
3. Click **"+ Add Review"**
4. Rate the movie and write a review
5. Click **"Submit Review"**
6. Check the Supabase dashboard:
   - Go to **Table Editor** → `reviews`
   - You should see your review!

7. **(Optional)** Test multi-device sync:
   - Install the app on a second device/emulator
   - Use the same `.env` credentials
   - Navigate to the same movie
   - You should see the review from the first device!

## How It Works

### Data Flow

**Saving a review:**
1. User submits review → Saved to **Supabase** (primary)
2. Also cached in **AsyncStorage** (local backup)
3. Reviews reload from Supabase

**Loading reviews:**
1. Fetch all reviews for movie from **Supabase**
2. Cache in AsyncStorage for offline access
3. If Supabase fails, fall back to cached reviews

### User Identification

Since we don't have authentication yet, each device gets a **unique device ID**:
- Generated on first launch
- Stored in AsyncStorage (`@popcorns:device_id`)
- Used as `user_id` when saving reviews
- Reviews from your device show a **"Your Review"** badge

### Offline Support

The app works even when offline:
- Reviews are cached locally
- If Supabase is unavailable, reviews save to AsyncStorage only
- A warning alert shows: *"Review saved locally. Cloud sync unavailable."*

## Troubleshooting

### "Supabase: Not configured"
- Check that `.env` file exists in the project root
- Verify `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set
- Restart the Metro bundler (`npm start`)

### "Failed to save review"
- Check your internet connection
- Verify the `reviews` table was created (run the migration SQL)
- Check the Supabase logs: Dashboard → Logs → Errors

### Reviews not syncing between devices
- Ensure both devices have the same Supabase credentials in `.env`
- Check that Row Level Security policies are set (migration handles this)
- Verify the `reviews` table exists in the Supabase dashboard

### "Column 'movie_id' does not exist"
- The migration didn't run successfully
- Go to SQL Editor and run `supabase/migrations/002_reviews.sql` again

## Security Notes

⚠️ **Important:** The current setup uses **anon key** and allows all operations without authentication. This is fine for development and MVP, but for production you should:

1. **Add authentication** (Supabase Auth)
2. **Restrict RLS policies** to allow users to only edit their own reviews
3. **Rate limit** review submissions to prevent spam

Example production RLS policy:
```sql
-- Only allow users to insert their own reviews
CREATE POLICY "Users can insert own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Only allow users to update/delete their own reviews
CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid()::text = user_id);
```

## Next Steps

- ✅ Reviews sync across devices
- 🔜 Add user authentication (Supabase Auth)
- 🔜 Add review upvotes/downvotes
- 🔜 Add review reporting (moderation)
- 🔜 Add review sorting (newest, highest rated, etc.)

---

**Questions?** Check the [Supabase docs](https://supabase.com/docs) or open an issue!
