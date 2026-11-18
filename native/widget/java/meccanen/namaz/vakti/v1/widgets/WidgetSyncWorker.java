package meccanen.namaz.vakti.v1.widgets;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.ExistingWorkPolicy;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONObject;

import java.util.concurrent.TimeUnit;

/**
 * Uygulama hiç açılmasa bile widget verisini tazeleyen günlük iş.
 *
 * Kayıtlı payload'daki şehir/tema/dil/konum/metot ayarları okunur,
 * {@link WidgetPayloadBuilder} ile ileri tarihli (30 güne kadar) yeni payload
 * üretilir ve {@link WidgetCore#saveFromWorker} ile yazılır. Ağ yoksa veya
 * "Matematiksel (Offline)" metodu seçiliyse builder native astronomik hesaba düşer.
 */
public class WidgetSyncWorker extends Worker {

    private static final String TAG = "WidgetSyncWorker";
    private static final String UNIQUE_PERIODIC = "mpw_sync_daily";
    private static final String UNIQUE_NOW = "mpw_sync_now";

    public WidgetSyncWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context ctx = getApplicationContext();
        try {
            String saved = WidgetCore.savedPayload(ctx);
            if (saved == null) return Result.success(); // widget hiç kurulmamış

            JSONObject cfg;
            try {
                cfg = new JSONObject(saved);
            } catch (Exception e) {
                // bozuk payload: yeni veri üretmenin anlamı yok, JS tekrar yazacak
                return Result.success();
            }

            // Konum yoksa (eski sürümden kalan payload) yapacak bir şey yok;
            // uygulama bir sonraki açılışında lat/lng ile yazar.
            double lat = cfg.optDouble("lat", Double.NaN);
            double lng = cfg.optDouble("lng", Double.NaN);
            if (Double.isNaN(lat) || Double.isNaN(lng)) return Result.success();

            JSONObject built = WidgetPayloadBuilder.build(cfg, WidgetCore.MAX_DAYS);
            if (built == null) return Result.retry();

            WidgetCore.saveFromWorker(ctx, built.toString());
            return Result.success();
        } catch (Exception e) {
            Log.w(TAG, "senkronizasyon başarısız", e);
            return Result.retry();
        }
    }

    /** Günlük periyodik işi (varsa dokunmadan) kurar. */
    public static void schedule(Context context) {
        try {
            // Ağ kısıtı BİLEREK yok: cihaz çevrimdışıyken de iş çalışsın ve
            // WidgetPayloadBuilder native astronomik hesaba düşerek veriyi tazelesin.
            PeriodicWorkRequest request =
                    new PeriodicWorkRequest.Builder(WidgetSyncWorker.class, 1, TimeUnit.DAYS)
                            .setInitialDelay(15, TimeUnit.MINUTES)
                            .addTag("widget-sync")
                            .build();

            WorkManager.getInstance(context.getApplicationContext())
                    .enqueueUniquePeriodicWork(UNIQUE_PERIODIC,
                            ExistingPeriodicWorkPolicy.KEEP, request);
        } catch (Exception e) {
            // WorkManager yoksa/başlatılamadıysa alarm zinciri ve updatePeriod yedeği devrede
            Log.w(TAG, "periyodik iş kurulamadı", e);
        }
    }

    /**
     * Hemen bir kez tazeleme isteği (boot, uygulama güncellemesi, saat dilimi değişikliği).
     * Ağ yoksa native hesap kullanılır; aynı istek varsa yenisi eklenmez.
     */
    public static void scheduleNow(Context context) {
        try {
            OneTimeWorkRequest request =
                    new OneTimeWorkRequest.Builder(WidgetSyncWorker.class)
                            .addTag("widget-sync-now")
                            .build();

            WorkManager.getInstance(context.getApplicationContext())
                    .enqueueUniqueWork(UNIQUE_NOW, ExistingWorkPolicy.KEEP, request);
        } catch (Exception e) {
            Log.w(TAG, "anlık iş kurulamadı", e);
        }
    }
}
