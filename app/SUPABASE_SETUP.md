# Supabase Setup Guide

## Overview
Popcorns uses Supabase for cloud-based watchlist persistence and multi-device sync. This is **optional** — the app works fine in local-only mode using AsyncStorage.

## Why Supabase?
- ✅ **Persistent across reinstalls** - Don't lose your watchlist when you delete the app
- ✅ **Multi-device sync** - Access your watchlist on multiple devices
- ✅ **Automatic backup** - Your data is safely stored in the cloud
- ✅ **Free tier** - Supabase offers a generous free tier (500MB database, 50k monthly active users)

## Setup Instructions

### 1. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and sign up (free)
2. Click "New Project"
3. Choose your organization and project name
4. Set a secure database password (save this!)
5. Select a region close to your users
6. Wait 1-2 minutes for project to initialize

### 2. Create the Database Table
1. In your Supabase project, go to **SQL Editor**
2. Click "New Query"
3. Paste this SQL and click "Run":

```sql
-- Create watchlist table
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  movie_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT,
  poster_path TEXT,
  vote_average REAL,
  release_date TEXT,
  overview TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('normal', 'super')),
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, movie_id, media_type)
);

-- Enable Row Level Security
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
-- (We use device IDs instead of auth, so we allow all access)
CREATE POLICY "Enable all access for all users" 
  ON watchlist 
  FOR ALL 
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);
```

### 3. Get Your API Credentials
1. Go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public** key (under "Project API keys")

### 4. Configure the App
1. Copy `.env.example` to `.env` in the project root:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. **Important:** Never commit `.env` to git! (Already in `.gitignore`)

### 5. Restart the App
```bash
# Stop the dev server and restart
npm start
```

## Testing the Integration

### Check Logs
When you start the app, you should see:
```
✅ Supabase: Connected
🚀 Starting watchlist migration to Supabase...
✅ Migrated X items to Supabase
```

If not configured:
```
⚠️ Supabase: Not configured (using local storage only)
```

### Test Sync
1. Add a movie to your watchlist
2. Go to Supabase dashboard → **Table Editor** → **watchlist**
3. You should see your movie appear!

### Test Multi-Device Sync
1. Install the app on a second device
2. Add the **same** Supabase credentials to that device
3. Your watchlist should sync automatically!

## How It Works

### Device ID
Each device gets a unique ID (stored in AsyncStorage). This ID is used as `user_id` in Supabase.

### Automatic Sync
- **On app launch**: Downloads remote watchlist, merges with local, uploads changes
- **On add/remove**: Immediately syncs the change to Supabase
- **On pull-to-refresh**: Triggers a full sync

### Offline Mode
The app works perfectly offline! Changes are stored locally and will sync next time you're online.

### Migration
Existing watchlist items are automatically migrated to Supabase on first run.

## Troubleshooting

### "Supabase not configured"
- Check that `.env` file exists and has both variables set
- Restart the Expo dev server after adding credentials
- Make sure variable names start with `EXPO_PUBLIC_`

### Items not syncing
- Check console logs for error messages
- Verify your Supabase table was created correctly
- Check Row Level Security policies are active
- Try pull-to-refresh in the Watchlist tab

### Duplicate items
The app automatically deduplicates based on `movie_id` + `media_type` combination.

### Reset Everything
```typescript
// In the app console or code:
import { clearWatchlist } from './lib/watchlist';
import { resetDeviceId } from './lib/deviceId';

await clearWatchlist();
await resetDeviceId();
```

Then restart the app.

## Security Notes

### API Key Safety
The `anon` key is safe to expose in client-side code. It's designed for public use.

### Row Level Security
We use a permissive policy (`USING (true)`) because:
- No user authentication (yet)
- Device IDs provide isolation
- Watchlist data isn't sensitive

For production apps with auth, you'd want:
```sql
CREATE POLICY "Users can only access their own data" 
  ON watchlist 
  FOR ALL 
  USING (auth.uid() = user_id);
```

### Data Privacy
- Watchlist data is private to each device ID
- No personal information is stored
- Movie data comes from TMDB (public API)

## Cost Considerations

### Supabase Free Tier
- 500MB database storage
- 50,000 monthly active users
- 2GB bandwidth/month
- Unlimited API requests

### Estimated Usage
- Each watchlist item: ~500 bytes
- 1000 items = 0.5MB
- API calls: ~10 per app launch
- **Typical user**: Well within free tier

## Future Enhancements
- [ ] User authentication (email/social login)
- [ ] Shared watchlists (friends/family)
- [ ] Offline queue for sync operations
- [ ] Conflict resolution UI
- [ ] Export/import watchlist
- [ ] Analytics (most popular movies)

## Support
If you run into issues:
1. Check console logs
2. Verify Supabase dashboard shows your table
3. Try a clean reinstall of the app
4. Check Supabase status page: https://status.supabase.com

## Related Files
- `lib/supabase.ts` - Supabase client configuration
- `lib/deviceId.ts` - Device ID management
- `lib/watchlist.ts` - Sync logic implementation
- `.env.example` - Template for credentials
