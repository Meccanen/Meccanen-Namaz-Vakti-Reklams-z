import json, os, glob

# QiblaSensor plugin'i: ham manyetometre + ivmeölçerden (OS füzyonunu kullanmadan)
# yön üretir. Bazı cihazlarda (MTK + QMC6308) rotation-vector füzyonu büyük
# dönüşlerden sonra yaw'ı ~180° kaydırıyor; getRotationMatrix(mag, acc) durumsuz
# olduğu için bu kaymadan etkilenmez.

with open("capacitor.config.json") as f:
    cfg = json.load(f)
app_id = cfg["appId"]
pkg_path = app_id.replace(".", "/")
java_dir = f"android/app/src/main/java/{pkg_path}"
if not os.path.isdir(java_dir):
    raise SystemExit(f">>> HATA: {java_dir} bulunamadı, appId ({app_id}) doğru mu?")

PLUGIN = r'''package __PKG__;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Ham manyetometre + ivmeolçerden yön (heading) üretir.
 *
 * Neden gerekli: bazı cihazlarda (ör. MTK + QMC6308) OS'un rotation-vector füzyonu
 * büyük dönüşlerden sonra yaw'ı 180°'den fazla kaydırıyor ve ekran döngüsüne kadar
 * düzelmiyor. WebView manyetometreye erişemediği için bu kayma JS tarafında tespit
 * edilemez; SensorManager.getRotationMatrix(mag, acc) ise durumsuz bir hesaptır ve
 * füzyonun yaw hatasından etkilenmez.
 */
@CapacitorPlugin(name = "QiblaSensor")
public class QiblaSensorPlugin extends Plugin implements SensorEventListener {

    private SensorManager sensorManager;
    private float[] accValues = null;
    private float[] magValues = null;
    private boolean registered = false;

    @Override
    public void load() {
        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
    }

    private void ensureRegistered() {
        if (registered || sensorManager == null) return;
        Sensor acc = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        Sensor mag = sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
        if (acc != null) sensorManager.registerListener(this, acc, SensorManager.SENSOR_DELAY_GAME);
        if (mag != null) sensorManager.registerListener(this, mag, SensorManager.SENSOR_DELAY_GAME);
        registered = (acc != null && mag != null);
    }

    private void unregister() {
        if (sensorManager != null && registered) sensorManager.unregisterListener(this);
        registered = false;
        accValues = null;
        magValues = null;
    }

    @PluginMethod
    public void start(PluginCall call) {
        ensureRegistered();
        JSObject res = new JSObject();
        res.put("ok", registered);
        call.resolve(res);
    }

    /** Dinleyicileri bırakır (pil tasarrufu); pusula kapatıldığında JS tarafı çağırır. */
    @PluginMethod
    public void stop(PluginCall call) {
        unregister();
        call.resolve();
    }

    @PluginMethod
    public void getHeading(PluginCall call) {
        ensureRegistered();
        JSObject res = new JSObject();

        if (accValues == null || magValues == null) {
            res.put("ok", false);
            call.resolve(res);
            return;
        }

        double ax = accValues[0], ay = accValues[1], az = accValues[2];
        double aLen = Math.sqrt(ax * ax + ay * ay + az * az);
        if (aLen < 1e-3) {
            res.put("ok", false);
            call.resolve(res);
            return;
        }
        double ux = ax / aLen, uy = ay / aLen, uz = az / aLen;

        double mx = magValues[0], my = magValues[1], mz = magValues[2];

        // east = normalize(mag x up)
        double ex = my * uz - mz * uy;
        double ey = mz * ux - mx * uz;
        double ez = mx * uy - my * ux;
        double eLen = Math.sqrt(ex * ex + ey * ey + ez * ez);
        if (eLen < 1e-3) {
            res.put("ok", false);
            call.resolve(res);
            return;
        }
        ex /= eLen; ey /= eLen; ez /= eLen;

        // north = up x east
        double nx = uy * ez - uz * ey;
        double ny = uz * ex - ux * ez;
        double nz = ux * ey - uy * ex;

        // Üst kenar (y) yatay izdüşümü
        double dY = uy;
        double yx = -ux * dY, yy = 1 - uy * dY, yz = -uz * dY;
        double yMag = Math.sqrt(yx * yx + yy * yy + yz * yz);

        // Arka yüz (ekran normalinin tersi, -z) yatay izdüşümü
        double dZ = uz;
        double zx = ux * dZ, zy = uy * dZ, zz = -(1 - uz * dZ);
        double zMag = Math.sqrt(zx * zx + zy * zy + zz * zz);

        double east, north;
        if (yMag >= zMag) {
            east = yx * ex + yy * ey + yz * ez;
            north = yx * nx + yy * ny + yz * nz;
        } else {
            east = zx * ex + zy * ey + zz * ez;
            north = zx * nx + zy * ny + zz * nz;
        }

        double deg = Math.toDegrees(Math.atan2(east, north));
        if (deg < 0) deg += 360;

        res.put("ok", true);
        res.put("heading", deg);
        res.put("total", Math.sqrt(mx * mx + my * my + mz * mz));
        call.resolve(res);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
            accValues = event.values.clone();
        } else if (event.sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD) {
            magValues = event.values.clone();
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // gerekmiyor
    }

    @Override
    public void handleOnDestroy() {
        unregister();
        super.handleOnDestroy();
    }
}
'''

plugin_path = f"{java_dir}/QiblaSensorPlugin.java"
with open(plugin_path, "w") as f:
    f.write(PLUGIN.replace("__PKG__", app_id))
print(f">>> {plugin_path} oluşturuldu.")

main_matches = glob.glob("android/app/src/main/java/**/MainActivity.java", recursive=True)
if not main_matches:
    raise SystemExit(">>> HATA: MainActivity.java bulunamadı.")
main_path = main_matches[0]
with open(main_path) as f:
    content = f.read()

if "QiblaSensorPlugin" in content:
    print(">>> QiblaSensorPlugin zaten kayıtlı, dokunulmadı.")
else:
    anchor = "public void onCreate(android.os.Bundle savedInstanceState) {"
    minimal = "public class MainActivity extends BridgeActivity {}"
    if anchor in content:
        content = content.replace(
            anchor,
            anchor + "\n        registerPlugin(QiblaSensorPlugin.class);",
            1,
        )
    elif minimal in content:
        content = content.replace(
            minimal,
            "public class MainActivity extends BridgeActivity {\n"
            "    @Override\n"
            "    public void onCreate(android.os.Bundle savedInstanceState) {\n"
            "        registerPlugin(QiblaSensorPlugin.class);\n"
            "        super.onCreate(savedInstanceState);\n"
            "    }\n"
            "}",
        )
    else:
        raise SystemExit(">>> HATA: MainActivity.java beklenen formatta değil:\n" + content)
    with open(main_path, "w") as f:
        f.write(content)
    print(">>> QiblaSensorPlugin MainActivity'ye kaydedildi.")
