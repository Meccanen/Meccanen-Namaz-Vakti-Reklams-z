package meccanen.namaz.vakti.v1;

import android.content.Context;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import meccanen.namaz.vakti.v1.widgets.WidgetCore;
import meccanen.namaz.vakti.v1.widgets.WidgetSyncWorker;

/**
 * JS tarafının vakit/tema/şehir verisini yerel widget'lara ilettiği köprü.
 * App.tsx scheduler kaydedildikten / tema veya dil değiştiğinde <code>update()</code> çağırır.
 */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        String payload = call.getString("payload");
        if (payload == null) { call.reject("payload required"); return; }
        Context ctx = getContext().getApplicationContext();
        WidgetCore.saveAndUpdate(ctx, payload);
        // Uygulama kapalıyken de verinin tazelenmesi için günlük işi garanti et.
        WidgetSyncWorker.schedule(ctx);
        JSObject res = new JSObject();
        res.put("ok", true);
        call.resolve(res);
    }
}