// Manyetik sapma (declination) hesabı — World Magnetic Model 2025 (NOAA/NCEI + BGS).
// Katsayılar WMM-2025 resmi WMM.COF dosyasından (epoch 2025.0, geçerlilik 2025.0–2030.0),
// model derecesi 12. Ağ bağlantısı gerektirmez.
//
// Neden gerekli: calcQiblaDirection() gerçek (coğrafi) kuzeye göre kıble kerterizini verir,
// cihazın pusulası ise MANYETİK kuzeyi gösterir. İkisi arasındaki açı (sapma) düzeltilmezse
// ibre bulunduğun yerdeki sapma kadar — Türkiye'de ~4–6.5° — sistematik olarak kayar.

const COF = `2025.0            WMM-2025        11/13/2024
  1  0  -29351.8       0.0       12.0        0.0
  1  1   -1410.8    4545.4        9.7      -21.5
  2  0   -2556.6       0.0      -11.6        0.0
  2  1    2951.1   -3133.6       -5.2      -27.7
  2  2    1649.3    -815.1       -8.0      -12.1
  3  0    1361.0       0.0       -1.3        0.0
  3  1   -2404.1     -56.6       -4.2        4.0
  3  2    1243.8     237.5        0.4       -0.3
  3  3     453.6    -549.5      -15.6       -4.1
  4  0     895.0       0.0       -1.6        0.0
  4  1     799.5     278.6       -2.4       -1.1
  4  2      55.7    -133.9       -6.0        4.1
  4  3    -281.1     212.0        5.6        1.6
  4  4      12.1    -375.6       -7.0       -4.4
  5  0    -233.2       0.0        0.6        0.0
  5  1     368.9      45.4        1.4       -0.5
  5  2     187.2     220.2        0.0        2.2
  5  3    -138.7    -122.9        0.6        0.4
  5  4    -142.0      43.0        2.2        1.7
  5  5      20.9     106.1        0.9        1.9
  6  0      64.4       0.0       -0.2        0.0
  6  1      63.8     -18.4       -0.4        0.3
  6  2      76.9      16.8        0.9       -1.6
  6  3    -115.7      48.8        1.2       -0.4
  6  4     -40.9     -59.8       -0.9        0.9
  6  5      14.9      10.9        0.3        0.7
  6  6     -60.7      72.7        0.9        0.9
  7  0      79.5       0.0       -0.0        0.0
  7  1     -77.0     -48.9       -0.1        0.6
  7  2      -8.8     -14.4       -0.1        0.5
  7  3      59.3      -1.0        0.5       -0.8
  7  4      15.8      23.4       -0.1        0.0
  7  5       2.5      -7.4       -0.8       -1.0
  7  6     -11.1     -25.1       -0.8        0.6
  7  7      14.2      -2.3        0.8       -0.2
  8  0      23.2       0.0       -0.1        0.0
  8  1      10.8       7.1        0.2       -0.2
  8  2     -17.5     -12.6        0.0        0.5
  8  3       2.0      11.4        0.5       -0.4
  8  4     -21.7      -9.7       -0.1        0.4
  8  5      16.9      12.7        0.3       -0.5
  8  6      15.0       0.7        0.2       -0.6
  8  7     -16.8      -5.2       -0.0        0.3
  8  8       0.9       3.9        0.2        0.2
  9  0       4.6       0.0       -0.0        0.0
  9  1       7.8     -24.8       -0.1       -0.3
  9  2       3.0      12.2        0.1        0.3
  9  3      -0.2       8.3        0.3       -0.3
  9  4      -2.5      -3.3       -0.3        0.3
  9  5     -13.1      -5.2        0.0        0.2
  9  6       2.4       7.2        0.3       -0.1
  9  7       8.6      -0.6       -0.1       -0.2
  9  8      -8.7       0.8        0.1        0.4
  9  9     -12.9      10.0       -0.1        0.1
 10  0      -1.3       0.0        0.1        0.0
 10  1      -6.4       3.3        0.0        0.0
 10  2       0.2       0.0        0.1       -0.0
 10  3       2.0       2.4        0.1       -0.2
 10  4      -1.0       5.3       -0.0        0.1
 10  5      -0.6      -9.1       -0.3       -0.1
 10  6      -0.9       0.4        0.0        0.1
 10  7       1.5      -4.2       -0.1        0.0
 10  8       0.9      -3.8       -0.1       -0.1
 10  9      -2.7       0.9       -0.0        0.2
 10 10      -3.9      -9.1       -0.0       -0.0
 11  0       2.9       0.0        0.0        0.0
 11  1      -1.5       0.0       -0.0       -0.0
 11  2      -2.5       2.9        0.0        0.1
 11  3       2.4      -0.6        0.0       -0.0
 11  4      -0.6       0.2        0.0        0.1
 11  5      -0.1       0.5       -0.1       -0.0
 11  6      -0.6      -0.3        0.0       -0.0
 11  7      -0.1      -1.2       -0.0        0.1
 11  8       1.1      -1.7       -0.1       -0.0
 11  9      -1.0      -2.9       -0.1        0.0
 11 10      -0.2      -1.8       -0.1        0.0
 11 11       2.6      -2.3       -0.1        0.0
 12  0      -2.0       0.0        0.0        0.0
 12  1      -0.2      -1.3        0.0       -0.0
 12  2       0.3       0.7       -0.0        0.0
 12  3       1.2       1.0       -0.0       -0.1
 12  4      -1.3      -1.4       -0.0        0.1
 12  5       0.6      -0.0       -0.0       -0.0
 12  6       0.6       0.6        0.1       -0.0
 12  7       0.5      -0.1       -0.0       -0.0
 12  8      -0.1       0.8        0.0        0.0
 12  9      -0.4       0.1        0.0       -0.0
 12 10      -0.2      -1.0       -0.1       -0.0
 12 11      -1.3       0.1       -0.0        0.0
 12 12      -0.7       0.2       -0.1       -0.1
999999999999999999999999999999999999999999999999
999999999999999999999999999999999999999999999999`;

const RAD = Math.PI / 180;
const MAXORD = 12;

type Model = {
  epoch: number;
  // Schmidt yarı-normalize edilmiş katsayılar, [m][n] indeksli
  g: number[][]; h: number[][];
  dg: number[][]; dh: number[][];
};

let cached: Model | null = null;

function zeros(): number[][] {
  const a: number[][] = [];
  for (let i = 0; i <= MAXORD + 1; i++) a.push(new Array(MAXORD + 2).fill(0));
  return a;
}

function loadModel(): Model {
  if (cached) return cached;
  const g = zeros(), h = zeros(), dg = zeros(), dh = zeros();
  let epoch = 2025.0;
  for (const raw of COF.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (/^[0-9.]+\s+WMM/i.test(line)) {
      epoch = parseFloat(line.split(/\s+/)[0]);
      continue;
    }
    const m = line.match(/^(\d+)\s+(\d+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)$/);
    if (!m) continue;
    const n = +m[1], mo = +m[2];
    g[mo][n] = +m[3];
    h[mo][n] = +m[4];
    dg[mo][n] = +m[5];
    dh[mo][n] = +m[6];
  }
  cached = { epoch, g, h, dg, dh };
  return cached;
}

export function decimalYear(d: Date): number {
  const y = d.getUTCFullYear();
  const start = Date.UTC(y, 0, 1);
  const end = Date.UTC(y + 1, 0, 1);
  return y + (d.getTime() - start) / (end - start);
}

/**
 * Verilen konum ve tarih için manyetik sapmayı derece cinsinden döndürür.
 * Doğuya doğru pozitif (ör. +6.1 = manyetik kuzey, gerçek kuzeyin 6.1° doğusunda).
 */
export function geomagneticComponents(
  latDeg: number,
  lonDeg: number,
  date: Date = new Date(),
  altKm = 0,
): { north: number; east: number; down: number } {
  const md = loadModel();
  const dt = decimalYear(date) - md.epoch;

  const a = 6378.137, b = 6356.7523142, re = 6371.2; // WGS-84 (km) ve jeomanyetik referans yarıçapı
  const rlat = latDeg * RAD, rlon = lonDeg * RAD;
  const srlat = Math.sin(rlat), crlat = Math.cos(rlat);
  const srlon = Math.sin(rlon), crlon = Math.cos(rlon);

  // Coğrafi (elipsoidal) -> jeosentrik küresel koordinatlar
  const a2 = a * a, b2 = b * b;
  const c2 = a2 - b2, a4 = a2 * a2, b4 = b2 * b2, c4 = a4 - b4;
  const q = Math.sqrt(a2 - c2 * srlat * srlat);
  const q1 = altKm * q;
  const q2 = Math.pow((q1 + a2) / (q1 + b2), 2);
  const ct = srlat / Math.sqrt(q2 * crlat * crlat + srlat * srlat);
  const st = Math.sqrt(Math.max(1 - ct * ct, 0));
  const r2 = altKm * altKm + 2 * q1 + (a4 - c4 * srlat * srlat) / (q * q);
  const r = Math.sqrt(r2);
  const d = Math.sqrt(a2 * crlat * crlat + b2 * srlat * srlat);
  const ca = (altKm + d) / r;
  const sa = (c2 * crlat * srlat) / (r * d);

  const sp = new Array(MAXORD + 2).fill(0);
  const cp = new Array(MAXORD + 2).fill(0);
  sp[0] = 0; cp[0] = 1;
  sp[1] = srlon; cp[1] = crlon;

  const p = zeros(), dp = zeros(), snorm = zeros(), kk = zeros();
  const gs = zeros(), hs = zeros();

  p[0][0] = 1; dp[0][0] = 0;
  snorm[0][0] = 1;

  // Legendre fonksiyonları + Schmidt normalizasyonu ve katsayı ölçekleme
  for (let n = 1; n <= MAXORD; n++) {
    snorm[0][n] = snorm[0][n - 1] * (2 * n - 1) / n;
    let j = 2;
    for (let m = 0; m <= n; m++) {
      kk[m][n] = (((n - 1) * (n - 1)) - (m * m)) / ((2 * n - 1) * (2 * n - 3));
      let flnmj = 1;
      if (m > 0) {
        flnmj = ((n - m + 1) * j) / (n + m);
        snorm[m][n] = snorm[m - 1][n] * Math.sqrt(flnmj);
        j = 1;
      }
      gs[m][n] = snorm[m][n] * (md.g[m][n] + dt * md.dg[m][n]);
      hs[m][n] = snorm[m][n] * (md.h[m][n] + dt * md.dh[m][n]);
    }

    for (let m = 0; m <= n; m++) {
      if (n === m) {
        p[m][n] = st * p[m - 1][n - 1];
        dp[m][n] = st * dp[m - 1][n - 1] + ct * p[m - 1][n - 1];
      } else if (n === 1 && m === 0) {
        p[m][n] = ct * p[m][n - 1];
        dp[m][n] = ct * dp[m][n - 1] - st * p[m][n - 1];
      } else {
        const pm2 = m > n - 2 ? 0 : p[m][n - 2];
        const dpm2 = m > n - 2 ? 0 : dp[m][n - 2];
        p[m][n] = ct * p[m][n - 1] - kk[m][n] * pm2;
        dp[m][n] = ct * dp[m][n - 1] - st * p[m][n - 1] - kk[m][n] * dpm2;
      }
    }
  }

  // Alan bileşenleri (jeosentrik)
  let br = 0, bt = 0, bp = 0;
  const aor = re / r;
  let ar = aor * aor;
  for (let n = 1; n <= MAXORD; n++) {
    ar = ar * aor; // ar = (re/r)^(n+2)
    for (let m = 0; m <= n; m++) {
      // Boylam harmonikleri: sin(mλ), cos(mλ)
      if (m > 0) {
        sp[m] = sp[m - 1] * cp[1] + cp[m - 1] * sp[1];
        cp[m] = cp[m - 1] * cp[1] - sp[m - 1] * sp[1];
      }
      const temp1 = gs[m][n] * cp[m] + hs[m][n] * sp[m];
      const temp2 = gs[m][n] * sp[m] - hs[m][n] * cp[m];
      const par = ar * p[m][n];

      bt -= ar * temp1 * dp[m][n];
      bp += m * temp2 * par;
      br += (n + 1) * temp1 * par;
    }
  }

  // Jeosentrik -> coğrafi (elipsoidal) çerçeve
  const north = -bt * ca - br * sa;
  // Doğu bileşeni 1/sin(teta) içerir; kutuplarda pusula zaten anlamsız olduğu için
  // sıfıra bölünmeyi küçük bir tabanla engelliyoruz.
  const east = bp / Math.max(st, 1e-6);
  const down = bt * sa - br * ca;

  return { north, east, down };
}

/** Manyetik sapma (derece; doğuya doğru pozitif). */
export function magneticDeclination(latDeg: number, lonDeg: number, date: Date = new Date(), altKm = 0): number {
  const f = geomagneticComponents(latDeg, lonDeg, date, altKm);
  return Math.atan2(f.east, f.north) / RAD;
}
