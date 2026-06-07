package com.mijornada.app;

import android.Manifest;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.ScanFilter;
import android.companion.AssociationInfo;
import android.companion.AssociationRequest;
import android.companion.BluetoothDeviceFilter;
import android.companion.BluetoothLeDeviceFilter;
import android.companion.CompanionDeviceManager;
import android.content.Context;
import android.content.Intent;
import android.content.IntentSender;
import android.content.pm.PackageManager;
import android.os.Build;
import java.util.Set;
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
    public void listPairedWatches(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.reject("Companion Device Manager requiere Android 8 o superior");
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !"granted".equals(getPermissionState("bluetooth").toString())) {
            requestPermissionForAlias("bluetooth", call, "listPairedWatchesPermissionCallback");
            return;
        }
        resolvePairedWatches(call);
    }

    @PermissionCallback
    private void listPairedWatchesPermissionCallback(PluginCall call) {
        if ("granted".equals(getPermissionState("bluetooth").toString())) {
            resolvePairedWatches(call);
        } else {
            call.reject("Permiso Bluetooth denegado");
        }
    }

    private void resolvePairedWatches(PluginCall call) {
        JSArray connected = new JSArray();
        JSArray remembered = new JSArray();
        try {
            BluetoothManager btManager = (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
            BluetoothAdapter adapter = btManager != null ? btManager.getAdapter() : null;
            if (adapter == null || !adapter.isEnabled()) {
                JSObject result = new JSObject();
                result.put("watches", connected);
                result.put("remembered", remembered);
                result.put("bluetoothEnabled", false);
                call.resolve(result);
                return;
            }
            Set<BluetoothDevice> bonded = adapter.getBondedDevices();
            if (bonded != null) {
                java.util.regex.Pattern namePattern = java.util.regex.Pattern.compile(".*(Xiaomi|Watch|Wear|Mi Band|Amazfit).*", java.util.regex.Pattern.CASE_INSENSITIVE);
                for (BluetoothDevice device : bonded) {
                    String name = device.getName();
                    if (name == null) continue;
                    if (!namePattern.matcher(name).matches()) continue;
                    boolean isConnected = checkDeviceConnected(device, btManager);
                    JSObject item = new JSObject();
                    item.put("name", name);
                    item.put("address", device.getAddress());
                    item.put("connected", isConnected);
                    if (isConnected) {
                        connected.put(item);
                    } else {
                        remembered.put(item);
                    }
                }
            }
        } catch (SecurityException e) {
            call.reject("Permiso Bluetooth denegado: " + e.getMessage());
            return;
        } catch (Exception e) {
            call.reject("Error al listar relojes emparejados: " + e.getClass().getSimpleName() + ": " + e.getMessage());
            return;
        }
        JSObject result = new JSObject();
        result.put("watches", connected);
        result.put("remembered", remembered);
        result.put("bluetoothEnabled", true);
        call.resolve(result);
    }

    private boolean checkDeviceConnected(BluetoothDevice device, BluetoothManager manager) {
        try {
            java.lang.reflect.Method m = device.getClass().getDeclaredMethod("isConnected");
            m.setAccessible(true);
            Object result = m.invoke(device);
            if (result instanceof Boolean) {
                return (Boolean) result;
            }
        } catch (Exception ignored) {
        }
        try {
            int state = manager.getConnectionState(device, android.bluetooth.BluetoothProfile.GATT);
            if (state == android.bluetooth.BluetoothProfile.STATE_CONNECTED) {
                return true;
            }
        } catch (Exception ignored) {
        }
        return false;
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
        String targetAddress = call != null ? call.getString("targetAddress", "") : "";
        boolean hasTarget = targetAddress != null && !targetAddress.isEmpty() && BluetoothAdapter.checkBluetoothAddress(targetAddress);

        AssociationRequest.Builder requestBuilder = new AssociationRequest.Builder()
            .setSingleDevice(hasTarget);
        if (hasTarget) {
            ScanFilter scanFilter = new ScanFilter.Builder()
                .setDeviceAddress(targetAddress)
                .build();
            BluetoothLeDeviceFilter leFilter = new BluetoothLeDeviceFilter.Builder()
                .setScanFilter(scanFilter)
                .build();
            requestBuilder.addDeviceFilter(leFilter);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            requestBuilder.setDeviceProfile(AssociationRequest.DEVICE_PROFILE_WATCH);
        } else if (!hasTarget) {
            BluetoothDeviceFilter filter = new BluetoothDeviceFilter.Builder()
                .setNamePattern(Pattern.compile(".*(Xiaomi|Watch|Wear).*", Pattern.CASE_INSENSITIVE))
                .build();
            requestBuilder.addDeviceFilter(filter);
        }
        AssociationRequest request = requestBuilder.build();

        try {
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
        } catch (Exception e) {
            call.reject("Fallo al iniciar la asociacion: " + e.getClass().getSimpleName() + ": " + e.getMessage());
        }
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
        } catch (Exception e) {
            call.reject("El selector de reloj no esta disponible en este dispositivo: " + e.getClass().getSimpleName() + ": " + e.getMessage());
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
