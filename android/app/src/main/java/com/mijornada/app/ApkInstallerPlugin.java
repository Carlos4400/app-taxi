package com.mijornada.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {

    @PluginMethod
    public void canInstallPackages(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) { // canRequestPackageInstalls was added in O (API 26), but we double-check for safety
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ret.put("value", getContext().getPackageManager().canRequestPackageInstalls());
            } else {
                ret.put("value", true);
            }
        } else {
            ret.put("value", true);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            getActivity().startActivity(intent);
            call.resolve();
        } else {
            call.reject("Not required on this Android version");
        }
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String urlString = call.getString("url");
        String fileName = call.getString("fileName");

        if (urlString == null || fileName == null) {
            call.reject("URL and fileName are required");
            return;
        }

        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    File file = new File(getContext().getCacheDir(), fileName);
                    if (file.exists()) {
                        file.delete();
                    }

                    URL url = new URL(urlString);
                    HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                    connection.setInstanceFollowRedirects(true);

                    int status = connection.getResponseCode();
                    int redirectCount = 0;
                    while (status == HttpURLConnection.HTTP_MOVED_TEMP || status == HttpURLConnection.HTTP_MOVED_PERM || status == 307 || status == 308) {
                        if (redirectCount > 5) {
                            throw new Exception("Too many redirects");
                        }
                        String newUrl = connection.getHeaderField("Location");
                        connection = (HttpURLConnection) new URL(newUrl).openConnection();
                        status = connection.getResponseCode();
                        redirectCount++;
                    }

                    if (status != HttpURLConnection.HTTP_OK) {
                        call.reject("Server returned HTTP " + status);
                        return;
                    }

                    try (InputStream input = new BufferedInputStream(connection.getInputStream());
                         FileOutputStream output = new FileOutputStream(file)) {

                        byte[] data = new byte[8192];
                        int count;
                        while ((count = input.read(data)) != -1) {
                            output.write(data, 0, count);
                        }
                    }

                    Uri apkUri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);
                    Intent intent = new Intent(Intent.ACTION_VIEW);
                    intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(intent);

                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    call.resolve(ret);

                } catch (Exception e) {
                    call.reject("Error downloading or installing APK: " + e.getMessage(), e);
                }
            }
        }).start();
    }
}
