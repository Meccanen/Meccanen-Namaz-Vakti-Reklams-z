import { Capacitor } from "@capacitor/core";
import {
  AppUpdate,
  AppUpdateAvailability,
  FlexibleUpdateInstallStatus,
} from "@capawesome/capacitor-app-update";

/**
 * Play In-App Updates (flexible) — sessiz indirme.
 *
 * Akış:
 *  1. Uygulama açılışında (gecikmeli) Play'e "yeni sürüm var mı?" sorulur.
 *  2. Varsa ve güncelleme `STALE_DAYS` gündür bekliyorsa Play'in kendi onay
 *     penceresi gösterilir (Play Core kuralı: indirme onayı kullanıcıdan alınır).
 *  3. Kullanıcı onaylarsa indirme **arka planda** yapılır; uygulama kullanılmaya
 *     devam eder.
 *  4. İndirme bitince `onReady(true)` çağrılır; arayüz "Güncelleme hazır —
 *     yeniden başlat" satırını gösterir, dokununca `restartForUpdate()` uygulamayı
 *     yeni sürümle başlatır.
 *
 * Neden `STALE_DAYS` var: uygulama Play'de yayınlandığı an kullanıcıyı dürtmek
 * rahatsız edici. 3 gün beklemek "acele yok" hissini korur; kritik sürüm
 * gerekirse Play Console'daki "in-app update priority" ile ayrıca ele alınır.
 *
 * Sınırlar (AGENTS.md §16): yalnızca Play'den kurulmuş uygulamada çalışır;
 * elle kurulan APK'da ve web'de sessizce devre dışı kalır.
 */
const STALE_DAYS = 3;

/** Yeni sürüm indirildiğinde `onReady(true)` çağırır; durdurmak için fonksiyon döner. */
export function watchAppUpdate(onReady: (ready: boolean) => void): () => void {
  if (!Capacitor.isNativePlatform()) return () => {};

  let disposed = false;
  let listener: { remove: () => Promise<void> } | null = null;

  (async () => {
    try {
      const info = await AppUpdate.getAppUpdateInfo();
      if (disposed) return;

      // Önceki oturumda indirme bitmiş ama yeniden başlatılmamış: doğrudan göster.
      if (info.installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) {
        onReady(true);
        return;
      }
      if (info.updateAvailability !== AppUpdateAvailability.UPDATE_AVAILABLE) return;
      if (!info.flexibleUpdateAllowed) return;
      // Güncelleme birkaç gündür bekliyorsa sor (taze yayında kullanıcıyı dürtme).
      if ((info.clientVersionStalenessDays ?? 0) < STALE_DAYS) return;

      listener = await AppUpdate.addListener("onFlexibleUpdateStateChange", (state) => {
        if (disposed) return;
        if (state.installStatus === FlexibleUpdateInstallStatus.DOWNLOADED) onReady(true);
      });
      if (disposed) return;
      await AppUpdate.startFlexibleUpdate();
    } catch {
      // Play yok / elle kurulmuş APK / ağ yok: güncelleme kontrolü yapılmamış gibi davran.
    }
  })();

  return () => {
    disposed = true;
    listener?.remove().catch(() => {});
    listener = null;
  };
}

/** İndirilen güncellemeyi uygular: uygulama yeni sürümle yeniden başlar. */
export async function restartForUpdate(): Promise<void> {
  try {
    await AppUpdate.completeFlexibleUpdate();
  } catch {
    // Play yok / durum kayboldu: sessizce yok say (kullanıcı düğmeye basmış olsa da çökmesin).
  }
}
