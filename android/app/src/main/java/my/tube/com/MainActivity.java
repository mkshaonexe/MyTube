package my.tube.com;

import android.graphics.Bitmap;
import android.os.Bundle;
import android.net.Uri;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.CookieManager;
import android.content.Intent;
import com.getcapacitor.BridgeActivity;
import java.io.InputStream;
import java.io.ByteArrayInputStream;
import java.util.Arrays;
import java.util.List;

public class MainActivity extends BridgeActivity {
    
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
        
        // Load ad-block script from assets
        try {
            InputStream is = getAssets().open("noutube.js");
            byte[] buffer = new byte[is.available()];
            is.read(buffer);
            is.close();
            adBlockScript = new String(buffer);
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        // Enable cookies for YouTube login
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(getBridge().getWebView(), true);
        
        // Configure WebView for YouTube
        WebView webView = getBridge().getWebView();
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
        
        // Load YouTube
        webView.loadUrl("https://m.youtube.com");
    }
}
