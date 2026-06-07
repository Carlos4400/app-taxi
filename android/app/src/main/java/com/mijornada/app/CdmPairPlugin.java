package com.mijornada.app;

import android.Manifest;
import android.app.Activity;
import android.companion.AssociationInfo;
import android.companion.AssociationRequest;
import android.companion.BluetoothDeviceFilter;
import android.companion.CompanionDeviceManager;
import android.content.Context;
import android.content.Intent;
import android.content.IntentSender;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.annotation.RequiresApi;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.regex.Pattern;

@CapacitorPlugin(
    name = "CdmPair",
    permissions = {
        @Permission(alias = "bluetooth", strings = { Manifest.permission.BLUETOOTH_CONNECT })
    }
)
public class CdmPairPlugin extends Plugin {
    private static final int ASSOCIATION_REQUEST_CODE = 9401;

    @PluginMethod
    public void pair(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.reject("Companion Device Manager requiere Android 8 o superior");
            return;
        }
        if (!getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_COMPANION_DEVICE_SETUP)) {
            call.reject("Companion Device Manager no disponible");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !"granted".equals(getPermissionState("bluetooth").toString())) {
            requestPermissionForAlias("bluetooth", call, "bluetoothPermissionCallback");
            return;
        }

        startAssociation(call);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.reject("Companion Device Manager requiere Android 8 o superior");
            return;
        }
        CompanionDeviceManager manager = manager();
        JSArray associations = new JSArray();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            for (AssociationInfo info : manager.getMyAssociations()) {
                JSObject item = new JSObject();
                item.put("id", info.getId());
                item.put("displayName", info.getDisplayName());
                item.put("deviceProfile", info.getDeviceProfile());
                associations.put(item);
            }
        } else {
            for (String address : manager.getAssociations()) {
                associations.put(address);
            }
        }
        JSObject result = new JSObject();
        result.put("associated", associations.length() > 0);
        result.put("associations", associations);
        call.resolve(result);
    }

    @PluginMethod
    public void disassociate(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.reject("Companion Device Manager requiere Android 8 o superior");
            return;
        }
        CompanionDeviceManager manager = manager();
        int removed = 0;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                for (AssociationInfo info : manager.getMyAssociations()) {
                    manager.disassociate(info.getId());
                    removed++;
                }
            } else {
                for (String address : manager.getAssociations()) {
                    manager.disassociate(address);
                    removed++;
                }
            }
        } catch (Exception e) {
            call.reject("No se pudo desasociar el reloj: " + e.getMessage());
            return;
        }
        JSObject result = new JSObject();
        result.put("associated", false);
        result.put("removed", removed);
        call.resolve(result);
    }

    @PermissionCallback
    private void bluetoothPermissionCallback(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.reject("Companion Device Manager requiere Android 8 o superior");
            return;
        }
        if ("granted".equals(getPermissionState("bluetooth").toString())) {
            startAssociation(call);
        } else {
            call.reject("Permiso Bluetooth denegado");
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private void startAssociation(PluginCall call) {
        AssociationRequest.Builder requestBuilder = new AssociationRequest.Builder()
            .setSingleDevice(false);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            requestBuilder.setDeviceProfile(AssociationRequest.DEVICE_PROFILE_WATCH);
        } else {
            BluetoothDeviceFilter filter = new BluetoothDeviceFilter.Builder()
                .setNamePattern(Pattern.compile(".*(Xiaomi|Watch|Wear).*", Pattern.CASE_INSENSITIVE))
                .build();
            requestBuilder.addDeviceFilter(filter);
        }
        AssociationRequest request = requestBuilder.build();

        saveCall(call);
        manager().associate(request, new CompanionDeviceManager.Callback() {
            @Override
            public void onAssociationPending(IntentSender intentSender) {
                launchChooser(intentSender, call);
            }

            @Override
            public void onDeviceFound(IntentSender intentSender) {
                launchChooser(intentSender, call);
            }

            @Override
            public void onAssociationCreated(AssociationInfo associationInfo) {
                JSObject result = new JSObject();
                result.put("associated", true);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    result.put("id", associationInfo.getId());
                    result.put("displayName", associationInfo.getDisplayName());
                }
                call.resolve(result);
            }

            @Override
            public void onFailure(CharSequence error) {
                call.reject(error == null ? "No se pudo asociar el reloj" : error.toString());
            }
        }, null);
    }

    private void launchChooser(IntentSender intentSender, PluginCall call) {
        try {
            getActivity().startIntentSenderForResult(
                intentSender,
                ASSOCIATION_REQUEST_CODE,
                null,
                0,
                0,
                0
            );
        } catch (IntentSender.SendIntentException e) {
            call.reject("No se pudo abrir el selector de reloj: " + e.getMessage());
        }
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        if (requestCode != ASSOCIATION_REQUEST_CODE) return;
        PluginCall call = getSavedCall();
        if (call == null) return;
        if (resultCode == Activity.RESULT_OK) {
            JSObject result = new JSObject();
            result.put("associated", true);
            call.resolve(result);
        } else {
            call.reject("Asociacion cancelada");
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private CompanionDeviceManager manager() {
        return (CompanionDeviceManager) getContext().getSystemService(Context.COMPANION_DEVICE_SERVICE);
    }
}
