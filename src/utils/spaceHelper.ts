/**
 * Space History & Discovery Annals (Gök Güncesi)
 * Sourced with historical milestones and cosmological achievements, fully localized in Turkish.
 */

export interface SpaceAnnalsEvent {
  year: string;
  title: string;
  description: string;
  category: "Keşif" | "Misyon" | "Teori" | "Kozmoloji";
  target: string;
  funFact: string;
}

const SPACE_EVENTS: SpaceAnnalsEvent[] = [
  {
    year: "1990",
    title: "Hubble Uzay Teleskobu'nun Devrimi",
    description: "Hubble Uzay Teleskobu, Discovery uzay mekiği ile Dünya yörüngesine fırlatıldı ve evrenin genişleme hızını ölçmemizde kritik rol oynadı.",
    category: "Keşif",
    target: "Derin Uzay",
    funFact: "Hubble, 1.5 milyondan fazla gözlem yaparak evrenin yaşının en hassas şekilde Hesaplanmasını sağladı (13.8 milyar yıl)."
  },
  {
    year: "1969",
    title: "Apollo 11 ve İnsanlığın Ay'daki İlk İzi",
    description: "Neil Armstrong ve Buzz Aldrin, Ay yüzeyine (Sessizlik Denizi) başarılı bir iniş gerçekleştirdi ve başka bir gökcismine ilk kez insan ayak bastı.",
    category: "Misyon",
    target: "Ay (Luna)",
    funFact: "Armstrong'un bıraktığı ayak izi, Ay'da rüzgar olmadığı için milyonlarca yıl boyunca bozulmadan kalacaktır."
  },
  {
    year: "2022",
    title: "James Webb Uzay Teleskobu İlk Görüntüleri",
    description: "JWST, insanlık tarihinin en detaylı kızılötesi derin uzay fotoğrafını yayınladı (SMACS 0723 galaksi kümesi). Evrenin kozmik şafağına ışık tutuldu.",
    category: "Keşif",
    target: "İlksel Galaksiler",
    funFact: "Webb'in aynaları altın kaplamadır ve teleskop mutlak sıfıra yakın (-233°C) bir sıcaklıkta, Dünya'dan 1.5 milyon km uzaktaki L2 noktasında çalışır."
  },
  {
    year: "2019",
    title: "İlk Kara Delik Görüntüsü (M87*)",
    description: "Olay Ufku Teleskobu (EHT), Messier 87 galaksisinin merkezindeki süper kütleli kara deliğin gölgesini görüntülemeyi başardı.",
    category: "Kozmoloji",
    target: "M87 Galaksisi",
    funFact: "Görüntülenen kara delik Güneş'in tam 6.5 milyar katı kütleye sahiptir ve Dünya büyüklüğünde bir sanal teleskop ağı kurulmasıyla çekilmiştir."
  },
  {
    year: "1977",
    title: "Voyager 1'in Yıldızlararası Yolculuğu",
    description: "Voyager 1 uzay aracı, Güneş Sistemi dışına çıkıp yıldızlararası ortama giren insan yapımı ilk nesne olmak üzere fırlatıldı.",
    category: "Misyon",
    target: "Yıldızlararası Uzay",
    funFact: "Üzerinde Türkçe dâhil 55 dilde selamlamanın, müziklerin ve Dünya koordinatlarının bulunduğu Altın Plak (Golden Record) taşımaktadır."
  },
  {
    year: "1915",
    title: "Genel Görelilik Kuramı'nın İlanı",
    description: "Albert Einstein, kütleçekiminin aslında uzay-zamanın bükülmesi olduğunu gösteren Genel Görelilik teorisini tamamladı.",
    category: "Teori",
    target: "Kozmos",
    funFact: "Bu teori, ışığın kütleçekimi tarafından büküleceğini (kütleçekimsel merceklenme) öngörerek modern astrofiziğin temelini oluşturdu."
  },
  {
    year: "2015",
    title: "Plüton'un Kalbine Yolculuk (New Horizons)",
    description: "New Horizons (Yeni Ufuklar) uzay sondası, Plüton'un yakınından geçerek bu cüce gezegenin yüzeyindeki dev kalp şeklindeki azot buzulunu keşfetti.",
    category: "Keşif",
    target: "Plüton",
    funFact: "Plüton'un kalbi olarak adlandırılan bölgeye, gezegenin kaşifinin anısına resmi olarak 'Tombaugh Regio' adı verilmiştir."
  },
  {
    year: "1957",
    title: "Sputnik 1 ve Uzay Çağı'nın Başlangıcı",
    description: "Dünya'nın ilk yapay uydusu Sputnik 1, Sovyetler Birliği tarafından başarıyla yörüngeye fırlatıldı ve kutupsal radyo sinyali yaydı.",
    category: "Misyon",
    target: "Dünya Alçak Yörüngesi",
    funFact: "Basketbol topu büyüklüğündeki bu küçük metal küre, uzay yarışının ve modern telekomünikasyonun resmi miladı kabul edilir."
  },
  {
    year: "1964",
    title: "Kozmik Mikrodalga Arka Plan Radyasyonu",
    description: "Arno Penzias ve Robert Wilson, Büyük Patlama'dan kalan ilksel ışımayı (CMBR) tesadüfen keşfederek Nobel Ödülü kazandılar.",
    category: "Kozmoloji",
    target: "Büyük Patlama (Big Bang)",
    funFact: "Keşif, radyo teleskoptaki paraziti temizlerken yapılmıştır. Bu kalıntı sıcaklık, evrenin doğum çığlığının elektromanyetik yankısıdır."
  },
  {
    year: "2004",
    title: "Satürn Halkalarında Bir Kaşif (Cassini)",
    description: "Cassini-Huygens uzay aracı, Satürn yörüngesine girerek gezegeni, halkalarını ve uydusu Titan'ın yüzeyindeki metan göllerini inceledi.",
    category: "Misyon",
    target: "Satürn ve Titan",
    funFact: "Huygens sondası Titan'a başarılı bir iniş gerçekleştirerek, dış Güneş sisteminde bir dünya yüzeyine inen ilk araç olmuştur."
  },
  {
    year: "1995",
    title: "Güneş Benzeri Bir Yıldızda İlk Ötegezegen",
    description: "Michel Mayor ve Didier Queloz, 51 Pegasi yıldızının yörüngesinde dönen 51 Pegasi b gaz devini keşfederek yeni bir çağ başlattı.",
    category: "Keşif",
    target: "Pegasus Takımyıldızı",
    funFact: "Bu keşif, evrende yalnız olmayabileceğimizin ve milyarlarca başka gezegen sisteminin var olduğunun ilk somut kanıtıydı."
  },
  {
    year: "1961",
    title: "Yuri Gagarin'in Yerçekimsiz Uçuşu",
    description: "Sovyet kozmonot Yuri Gagarin, Vostok 1 aracı ile uzaya çıkan ve Dünya yörüngesini turlayan ilk insan ünvanını aldı.",
    category: "Misyon",
    target: "Dünya Yörüngesi",
    funFact: "Yörüngedeyken pencereden dışarı bakıp 'Dünya mavi... Çok güzel. Harika görünüyor!' sözlerini fısıldamıştır."
  },
  {
    year: "1610",
    title: "Galileo ve Jüpiter'in Ayları",
    description: "Galileo Galilei kendi yaptığı teleskopla Jüpiter'i izledi ve onun etrafında dönen 4 büyük uyduyu (Io, Europa, Ganymede, Callisto) keşfetti.",
    category: "Keşif",
    target: "Jüpiter",
    funFact: "Bu keşif, her şeyin Dünya'nın etrafında dönmediğini ispatlayarak Kopernik'in Güneş merkezli teorisini destekleyen en büyük kanıt oldu."
  },
  {
    year: "2016",
    title: "Kütleçekim Dalgası Kanıtı (LIGO)",
    description: "1.3 milyar ışık yılı uzaktaki iki kara deliğin çarpışmasıyla uzay-zamanda oluşan dalgalanmalar LIGO dedektörleri tarafından ilk kez kaydedildi.",
    category: "Keşif",
    target: "Uzay-Zaman Dokusu",
    funFact: "Einstein'ın 100 yıl önce öngördüğü kütleçekim dalgaları nihayet duyulabildi. Kozmologlar artık evreni sadece 'görmüyor', 'dinliyor'."
  },
  {
    year: "2012",
    title: "Higgs Bozonu'nun Keşfi (CERN)",
    description: "Büyük Hadron Çarpıştırıcısı'ndaki bilim insanları, parçacıklara kütle kazandıran Higgs alanının taşıyıcısı olan Higgs Bozonunu gözlemledi.",
    category: "Teori",
    target: "Standart Model",
    funFact: "Halk arasında 'Tanrı Parçacığı' da denilen bu alan olmasaydı, atomlar oluşamaz ve evrendeki hiçbir madde bir araya gelemezdi."
  }
];

// Helper to reliably return a deterministic card based on selected date
export function getSpaceAnnalsForDate(date: Date): SpaceAnnalsEvent {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  // Use a reproducible index selection
  const index = Math.abs(dayOfYear * 73 + date.getFullYear()) % SPACE_EVENTS.length;
  return SPACE_EVENTS[index];
}

/**
 * Calculates simulated live telemetry stats for deep space markers to keep high-fidelity technical aesthetic.
 * Sourced on actual scientific coefficients of expansion & voyager telemetry.
 */
export interface CosmicMetrics {
  universeExpansionKm: string;  // Simulated cosmic expansion in km since the start of today
  voyagerOffsetAu: string;      // Simulated current distance of Voyager 1 in AU
  speedOfLightKm: string;       // Speed of light stats helper
}

export function getLiveCosmicMetrics(date: Date): CosmicMetrics {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const msPassed = Date.now() - startOfDay;
  
  // Rate of cosmic expansion estimated in local hubble bubble context
  // (Approx 68 km/s per megaparsec, scaled to show high speed live activity)
  const expansionSpeedKmPerSec = 73.4 * 1000; // cosmic visual scale
  const secondsPassed = Math.max(0, msPassed / 1000);
  const totalExpanded = secondsPassed * expansionSpeedKmPerSec;

  // Voyager 1 moves outward at approx 3.6 AU per year
  // (Standard base distance around 163 AU as of 2024, incremented slightly over time)
  const yearsSince2024 = date.getFullYear() - 2024 + (date.getMonth() * 31 + date.getDate()) / 365;
  const currentAu = 162.8 + (yearsSince2024 * 3.58);

  return {
    universeExpansionKm: totalExpanded.toLocaleString("tr-TR", { maximumFractionDigits: 0 }),
    voyagerOffsetAu: currentAu.toFixed(5),
    speedOfLightKm: "299.792"
  };
}
