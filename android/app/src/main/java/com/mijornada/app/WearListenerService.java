package com.mijornada.app;

import com.google.android.gms.wearable.DataEvent;
import com.google.android.gms.wearable.DataEventBuffer;
import com.google.android.gms.wearable.DataMapItem;
import com.google.android.gms.wearable.WearableListenerService;
import com.mijornada.app.watch.WearCommandWorker;

public class WearListenerService extends WearableListenerService {

    @Override
    public void onDataChanged(DataEventBuffer dataEvents) {
        try {
            for (DataEvent event : dataEvents) {
                if (event.getType() != DataEvent.TYPE_CHANGED) {
                    continue;
                }
                String path = event.getDataItem().getUri().getPath();
                if (path == null || !path.startsWith("/watch-command/")) {
                    continue;
                }

                String commandJson = DataMapItem.fromDataItem(event.getDataItem())
                    .getDataMap()
                    .getString("command");
                if (commandJson == null || commandJson.trim().isEmpty()) {
                    continue;
                }

                String nodeId = event.getDataItem().getUri().getHost();
                String operationId = path.substring("/watch-command/".length());
                WearCommandWorker.enqueue(this, commandJson, nodeId, operationId);
            }
        } finally {
            dataEvents.close();
        }
    }

}
