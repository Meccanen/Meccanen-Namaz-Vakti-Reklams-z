package meccanen.namaz.vakti.v1.widgets;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * 1) WidgetCore tarafından programlanan exact alarmları (vakit geçişleri + gece yarısı)
 * 2) boot, tarih/saat/dilim değişikliği, uygulama güncellemesi
 * aldığında widget'ları tazeler, günlük WorkManager işini kurar ve gerekiyorsa
 * hemen bir kez veri tazeleme isteği gönderir.
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
                Intent.ACTION_TIMEZONE_CHANGED.equals(action) ||
                Intent.ACTION_MY_PACKAGE_REPLACED.equals(action);

        if (!relevant) return;

        try {
            // refreshAll zaten alarmları (dakika-başı + vakit geçişleri) yeniden kurar.
            WidgetCore.refreshAll(context);
        } catch (Exception ignored) {
            // widget verisi yoksa sessizce geç
        }

        // Periyodik iş her cihazda bir kez kurulur. Alarm dışı olaylarda veri
        // günlerce bayatlamış olabilir; hemen bir kez de tazele.
        if (!WidgetCore.ACTION_REFRESH.equals(action)) {
            WidgetSyncWorker.schedule(context);
            WidgetSyncWorker.scheduleNow(context);
        }
    }
}
