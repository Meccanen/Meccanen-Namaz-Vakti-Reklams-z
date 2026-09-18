package meccanen.namaz.vakti.v1.widgets;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * 1) WidgetCore tarafından programlanan exact alarmları (vakit geçişleri + gece yarısı)
 * 2) boot, tarih/saat/dilim değişikliği
 * aldığında widget'ları tazeler ve bir sonraki günün alarmlarını yeniden kurar.
 */
public class WidgetRefreshReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent == null ? null : intent.getAction();

        boolean relevant =
                WidgetCore.ACTION_REFRESH.equals(action) ||
                Intent.ACTION_BOOT_COMPLETED.equals(action) ||
                Intent.ACTION_DATE_CHANGED.equals(action) ||
                Intent.ACTION_TIME_CHANGED.equals(action) ||
                Intent.ACTION_TIMEZONE_CHANGED.equals(action);

        if (!relevant) return;

        try {
            WidgetCore.refreshAll(context);
            WidgetCore.scheduleRefreshAlarms(context);
        } catch (Exception ignored) {
            // widget verisi yoksa sessizce geç
        }
    }
}