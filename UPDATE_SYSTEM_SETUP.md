# MyTube App Update System Setup

## Step 1: Get Supabase Anon Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (tosodvjvzifveabjqitb)
3. Go to **Settings** → **API**
4. Copy the **anon public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Step 2: Run SQL in Supabase

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and paste the contents of `supabase-setup.sql`
3. Click **Run**

## Step 3: Update the Anon Key in Code

Open `android/app/src/main/java/my/tube/com/MainActivity.java`

Find this line:
```java
private static final String SUPABASE_ANON_KEY = ""; // Will be set from build config
```

Replace with your actual anon key:
```java
private static final String SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ACTUAL_KEY_HERE";
```

## Step 4: Update Download URL in Supabase

After you upload your APK to your website, update the `download_url` in the `app_versions` table:

```sql
UPDATE app_versions 
SET download_url = 'https://your-actual-website.com/downloads/mytube.apk'
WHERE version_code = 1;
```

## How to Release a New Version

### 1. Increment Version in Code

In `MainActivity.java`, update:
```java
private static final int APP_VERSION_CODE = 2;  // Increment this
private static final String APP_VERSION_NAME = "1.1.0";  // Update version name
```

### 2. Build New APK
```bash
cd android
./gradlew.bat assembleDebug
```

### 3. Upload APK to Your Website

### 4. Add New Version to Supabase

Run this SQL in Supabase SQL Editor:
```sql
INSERT INTO app_versions (version_code, version_name, download_url, release_notes, is_mandatory, min_supported_version)
VALUES (
    2,                                                    -- New version code
    '1.1.0',                                              -- Version name
    'https://your-website.com/downloads/mytube-v1.1.0.apk', -- Download URL
    'Bug fixes and new features',                         -- Release notes
    false,                                                -- Set true to force immediate update
    1                                                     -- Minimum version that can still work
);
```

## Update Behavior

| Scenario | Behavior |
|----------|----------|
| New version available, `is_mandatory = false` | Shows dismissible dialog, forces after 1 day |
| New version available, `is_mandatory = true` | Forces update immediately, blocks app |
| Current version < `min_supported_version` | Forces update immediately, blocks app |
| No new version | App works normally |

## Testing

To test the update system:

1. Set `APP_VERSION_CODE = 0` in MainActivity.java
2. Build and install the app
3. Insert a version with `version_code = 1` in Supabase
4. Open the app - you should see the update dialog

## Troubleshooting

- **Update dialog not showing**: Check that the anon key is correct
- **Network error**: Make sure the device has internet
- **Supabase error**: Check RLS policies are set up correctly
