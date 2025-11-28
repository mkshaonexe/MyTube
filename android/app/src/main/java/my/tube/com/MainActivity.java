package my.tube.com;

import android.graphics.Bitmap;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.net.Uri;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.CookieManager;
import android.content.Intent;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import java.io.InputStream;
import java.io.ByteArrayInputStream;
import java.util.Arrays;
import java.util.List;

import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.Manifest;
import android.app.AlertDialog;
import android.content.SharedPreferences;
import android.os.AsyncTask;
import android.util.Log;
import android.widget.Toast;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends BridgeActivity {
    
    private static final String TAG = "MyTube";
    private static final int PERMISSION_REQUEST_CODE = 123;
    
    // App version - INCREMENT THIS when releasing new version
    private static final int APP_VERSION_CODE = 0; // TESTING: Set to 0 to test update dialog
    private static final String APP_VERSION_NAME = "0.0.1"; // TESTING
    
    // Supabase config
    private static final String SUPABASE_URL = "https://tosodvjvzifveabjqitb.supabase.co";
    private static final String SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvc29kdmp2emlmdmVhYmpxaXRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNzI0NDUsImV4cCI6MjA3OTg0ODQ0NX0.Nos_xupW0n7LbEY_f1BHL7WaJu9-QWDdfARAQ1zhMGg";
    
    // Update settings
    private static final int FORCE_UPDATE_DAYS = 1;
    private static final String PREFS_NAME = "MyTubePrefs";
    private static final String PREF_UPDATE_FIRST_SEEN = "update_first_seen";
    
    private boolean isBlocked = false;
    private boolean youtubeLoaded = false;
    private WebView webView;

    // Hosts to block (ads)
    private static final List<String> BLOCK_HOSTS = Arrays.asList(
        "www.googletagmanager.com",
        "googleads.g.doubleclick.net",
        "pagead2.googlesyndication.com",
        "ad.doubleclick.net",
        "static.doubleclick.net",
        "m.doubleclick.net",
        "mediavisor.doubleclick.net",
        "www.google-analytics.com",
        "www.googleadservices.com",
        "tpc.googlesyndication.com",
        "cdn.googletoolservices.com",
        "ade.googlesyndication.com",
        "fundingchoicesmessages.google.com"
    );
    
    // Hosts allowed to load in WebView
    private static final List<String> VIEW_HOSTS = Arrays.asList(
        "youtube.com",
        "youtu.be",
        "m.youtube.com",
        "www.youtube.com",
        "music.youtube.com"
    );
    
    private String adBlockScript = "";
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.d(TAG, "onCreate started - Version: " + APP_VERSION_CODE);
        
        // Request notification permission for Android 13+
        requestNotificationPermission();
        
        // Setup status bar - NOT fullscreen, show status bar properly
        setupStatusBar();
        
        // Load ad-block script from assets
        try {
            InputStream is = getAssets().open("noutube.js");
            byte[] buffer = new byte[is.available()];
            is.read(buffer);
            is.close();
            adBlockScript = new String(buffer);
        } catch (Exception e) {
            Log.e(TAG, "Error loading ad-block script", e);
        }
        
        // Enable cookies for YouTube login
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(getBridge().getWebView(), true);
        
        // Configure WebView for YouTube
        webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        // Set user agent to mobile (remove webview indicator)
        String userAgent = settings.getUserAgentString();
        settings.setUserAgentString(userAgent.replace("; wv", ""));
        
        // Custom WebViewClient to block ads and inject script
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                // Inject ad-block script early
                if (!adBlockScript.isEmpty()) {
                    view.evaluateJavascript(adBlockScript, null);
                }
            }
            
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // Re-inject to ensure it's loaded
                if (!adBlockScript.isEmpty()) {
                    view.evaluateJavascript(adBlockScript, null);
                }
            }
            
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                String host = request.getUrl().getHost();
                if (host != null) {
                    for (String blockedHost : BLOCK_HOSTS) {
                        if (host.contains(blockedHost)) {
                            // Block by returning empty response
                            return new WebResourceResponse("text/plain", "utf-8", 
                                new ByteArrayInputStream(new byte[0]));
                        }
                    }
                }
                return super.shouldInterceptRequest(view, request);
            }
            
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String host = uri.getHost();
                
                // Allow YouTube and Google auth
                if (host != null) {
                    for (String viewHost : VIEW_HOSTS) {
                        if (host.endsWith(viewHost)) {
                            return false;
                        }
                    }
                    if (host.startsWith("accounts.google.") || 
                        host.startsWith("gds.google.") ||
                        host.endsWith(".google.com")) {
                        return false;
                    }
                }
                
                // Open other URLs in external browser
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                startActivity(intent);
                return true;
            }
        });
        
        // Check for updates FIRST, then load YouTube
        Log.d(TAG, "Starting update check...");
        checkForUpdates();
    }
    
    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= 33) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                Log.d(TAG, "Requesting notification permission");
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, PERMISSION_REQUEST_CODE);
            } else {
                Log.d(TAG, "Notification permission already granted");
            }
        }
    }
    
    private void loadYouTube() {
        if (!youtubeLoaded && !isBlocked) {
            youtubeLoaded = true;
            Log.d(TAG, "Loading YouTube...");
            runOnUiThread(() -> {
                webView.loadUrl("https://m.youtube.com");
            });
        }
    }
    
    private void checkForUpdates() {
        new AsyncTask<Void, Void, JSONObject>() {
            @Override
            protected JSONObject doInBackground(Void... voids) {
                try {
                    String apiUrl = SUPABASE_URL + "/rest/v1/app_versions?select=*&order=version_code.desc&limit=1";
                    Log.d(TAG, "Checking updates from: " + apiUrl);
                    
                    URL url = new URL(apiUrl);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setRequestProperty("apikey", SUPABASE_ANON_KEY);
                    conn.setRequestProperty("Authorization", "Bearer " + SUPABASE_ANON_KEY);
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setConnectTimeout(10000);
                    conn.setReadTimeout(10000);
                    
                    int responseCode = conn.getResponseCode();
                    Log.d(TAG, "Update check response code: " + responseCode);
                    
                    if (responseCode == HttpURLConnection.HTTP_OK) {
                        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                        StringBuilder response = new StringBuilder();
                        String line;
                        while ((line = reader.readLine()) != null) {
                            response.append(line);
                        }
                        reader.close();
                        
                        Log.d(TAG, "Update check response: " + response.toString());
                        
                        JSONArray jsonArray = new JSONArray(response.toString());
                        if (jsonArray.length() > 0) {
                            return jsonArray.getJSONObject(0);
                        }
                    } else {
                        Log.e(TAG, "Update check failed with code: " + responseCode);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Update check error", e);
                }
                return null;
            }
            
            @Override
            protected void onPostExecute(JSONObject latestVersion) {
                if (latestVersion != null) {
                    Log.d(TAG, "Got latest version: " + latestVersion.toString());
                    handleUpdateCheck(latestVersion);
                } else {
                    Log.d(TAG, "No update info found, loading YouTube");
                    loadYouTube();
                }
            }
        }.execute();
    }
    
    private void handleUpdateCheck(JSONObject latestVersion) {
        try {
            int latestVersionCode = latestVersion.getInt("version_code");
            String latestVersionName = latestVersion.getString("version_name");
            String downloadUrl = latestVersion.getString("download_url");
            String releaseNotes = latestVersion.optString("release_notes", "");
            boolean isMandatory = latestVersion.optBoolean("is_mandatory", false);
            int minSupportedVersion = latestVersion.optInt("min_supported_version", 1);
            
            Log.d(TAG, "Current version: " + APP_VERSION_CODE + ", Latest: " + latestVersionCode + ", Min: " + minSupportedVersion);
            
            // Check if current version is below minimum supported
            if (APP_VERSION_CODE < minSupportedVersion) {
                Log.d(TAG, "Version below minimum, forcing update");
                showForceUpdateDialog(latestVersionName, downloadUrl, releaseNotes, true);
                return;
            }
            
            // Check if there's a newer version
            if (latestVersionCode > APP_VERSION_CODE) {
                Log.d(TAG, "Newer version available");
                SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
                long firstSeen = prefs.getLong(PREF_UPDATE_FIRST_SEEN, 0);
                
                if (firstSeen == 0) {
                    // First time seeing this update
                    prefs.edit().putLong(PREF_UPDATE_FIRST_SEEN, System.currentTimeMillis()).apply();
                    firstSeen = System.currentTimeMillis();
                }
                
                // Calculate days since first seen
                long daysSinceFirstSeen = (System.currentTimeMillis() - firstSeen) / (1000 * 60 * 60 * 24);
                
                // Force update if mandatory OR if grace period expired
                if (isMandatory || daysSinceFirstSeen >= FORCE_UPDATE_DAYS) {
                    Log.d(TAG, "Forcing update - mandatory: " + isMandatory + ", days: " + daysSinceFirstSeen);
                    showForceUpdateDialog(latestVersionName, downloadUrl, releaseNotes, true);
                } else {
                    int daysRemaining = (int) (FORCE_UPDATE_DAYS - daysSinceFirstSeen);
                    Log.d(TAG, "Showing optional update dialog, days remaining: " + daysRemaining);
                    showUpdateDialog(latestVersionName, downloadUrl, releaseNotes, daysRemaining);
                }
            } else {
                // No update needed, clear stored data and load YouTube
                Log.d(TAG, "No update needed, loading YouTube");
                getSharedPreferences(PREFS_NAME, MODE_PRIVATE).edit().remove(PREF_UPDATE_FIRST_SEEN).apply();
                loadYouTube();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error handling update check", e);
            loadYouTube(); // Load YouTube on error
        }
    }
    
    private void showUpdateDialog(String version, String downloadUrl, String releaseNotes, int daysRemaining) {
        runOnUiThread(() -> {
            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            builder.setTitle("🔄 Update Available");
            builder.setMessage("Version " + version + " is available!\n\n" + 
                              releaseNotes + "\n\n" +
                              "⚠️ Update required in " + daysRemaining + " day(s)");
            builder.setCancelable(false);
            builder.setPositiveButton("Update Now", (dialog, which) -> {
                openDownloadUrl(downloadUrl);
                loadYouTube(); // Load YouTube after opening download
            });
            builder.setNegativeButton("Later", (dialog, which) -> {
                dialog.dismiss();
                loadYouTube(); // Load YouTube when user clicks Later
            });
            builder.show();
        });
    }
    
    private void showForceUpdateDialog(String version, String downloadUrl, String releaseNotes, boolean blocking) {
        isBlocked = blocking;
        runOnUiThread(() -> {
            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            builder.setTitle("⚠️ Update Required");
            builder.setMessage("Version " + version + " is required to continue using MyTube.\n\n" + 
                              releaseNotes + "\n\n" +
                              "Please download and install the latest version.");
            builder.setCancelable(false);
            builder.setPositiveButton("Download Update", (dialog, which) -> {
                openDownloadUrl(downloadUrl);
                // Show dialog again after they come back
                if (isBlocked) {
                    showForceUpdateDialog(version, downloadUrl, releaseNotes, true);
                }
            });
            builder.show();
        });
    }
    
    private void openDownloadUrl(String url) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(intent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    @Override
    public void onResume() {
        super.onResume();
        setupStatusBar();
        // Request notification permission every time if not granted
        requestNotificationPermission();
    }

    private void setupStatusBar() {
        Window window = getWindow();
        View decorView = window.getDecorView();
        
        // Force window background to be black
        window.setBackgroundDrawableResource(android.R.color.black);
        
        // Clear any fullscreen and translucent flags
        window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        window.clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
        
        // IMPORTANT: Disable edge-to-edge / fit system windows properly
        WindowCompat.setDecorFitsSystemWindows(window, true);
        
        // Force status bar to be visible and dark
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.BLACK); // Force solid black
            window.setNavigationBarColor(Color.BLACK); // Force navigation bar black too
        }
        
        // Make status bar icons light (white) for dark background - using both methods
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            int flags = decorView.getSystemUiVisibility();
            // Remove light status bar flag to make icons white
            flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            decorView.setSystemUiVisibility(flags);
        }
        
        // Also use WindowInsetsController for newer Android versions
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decorView);
        if (controller != null) {
            controller.setAppearanceLightStatusBars(false); // false = white icons on dark background
            controller.setAppearanceLightNavigationBars(false); // false = white buttons on dark background
        }
        
        // Apply window insets to WebView to push content below status bar
        View rootView = findViewById(android.R.id.content);
        if (rootView != null) {
            rootView.setBackgroundColor(Color.BLACK); // Ensure root is black
            ViewCompat.setOnApplyWindowInsetsListener(rootView, (v, windowInsets) -> {
                Insets insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
                v.setPadding(insets.left, insets.top, insets.right, insets.bottom);
                return WindowInsetsCompat.CONSUMED;
            });
        }
    }
}
