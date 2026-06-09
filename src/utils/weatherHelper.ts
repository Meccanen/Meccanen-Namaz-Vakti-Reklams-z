import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudFog, 
  CloudDrizzle, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  CloudRainWind,
  HelpCircle,
  LucideIcon
} from "lucide-react";

export interface WeatherMapping {
  desc: string;
  iconName: LucideIcon;
  colorClass: string;
  bgClass: string;
}

// Map WMO codes to Turkish terms and beautiful Lucide Icons
export function getWMOTranslation(code: number): WeatherMapping {
  switch (code) {
    case 0:
      return { 
        desc: "Açık, Güneşli", 
        iconName: Sun, 
        colorClass: "text-amber-500", 
        bgClass: "from-amber-500/10 to-transparent" 
      };
    case 1:
      return { 
        desc: "Çoğunlukla Açık", 
        iconName: CloudSun, 
        colorClass: "text-amber-400", 
        bgClass: "from-amber-400/10 to-transparent" 
      };
    case 2:
      return { 
        desc: "Parçalı Bulutlu", 
        iconName: CloudSun, 
        colorClass: "text-sky-400", 
        bgClass: "from-sky-400/10 to-transparent" 
      };
    case 3:
      return { 
        desc: "Kapalı, Bulutlu", 
        iconName: Cloud, 
        colorClass: "text-slate-400", 
        bgClass: "from-slate-400/10 to-transparent" 
      };
    case 45:
    case 48:
      return { 
        desc: "Sisli", 
        iconName: CloudFog, 
        colorClass: "text-zinc-400", 
        bgClass: "from-zinc-400/10 to-transparent" 
      };
    case 51:
    case 53:
    case 55:
      return { 
        desc: "Hafif Çiseleyen Yağmur", 
        iconName: CloudDrizzle, 
        colorClass: "text-sky-300", 
        bgClass: "from-sky-300/10 to-transparent" 
      };
    case 56:
    case 57:
      return { 
        desc: "Dondurucu Çiseleme", 
        iconName: CloudSnow, 
        colorClass: "text-blue-200", 
        bgClass: "from-blue-200/10 to-transparent" 
      };
    case 61:
      return { 
        desc: "Hafif Yağmurlu", 
        iconName: CloudRain, 
        colorClass: "text-blue-400", 
        bgClass: "from-blue-400/10 to-transparent" 
      };
    case 63:
      return { 
        desc: "Yağmurlu", 
        iconName: CloudRain, 
        colorClass: "text-blue-500", 
        bgClass: "from-blue-500/10 to-transparent" 
      };
    case 65:
      return { 
        desc: "Kuvvetli Yağmurlu", 
        iconName: CloudRainWind, 
        colorClass: "text-blue-600", 
        bgClass: "from-blue-600/10 to-transparent" 
      };
    case 66:
    case 67:
      return { 
        desc: "Dondurucu Yağmurlu", 
        iconName: CloudSnow, 
        colorClass: "text-teal-200", 
        bgClass: "from-teal-200/10 to-transparent" 
      };
    case 71:
      return { 
        desc: "Hafif Karlı", 
        iconName: CloudSnow, 
        colorClass: "text-sky-100", 
        bgClass: "from-sky-100/15 to-transparent" 
      };
    case 73:
      return { 
        desc: "Karlı", 
        iconName: CloudSnow, 
        colorClass: "text-white", 
        bgClass: "from-white/10 to-transparent" 
      };
    case 75:
      return { 
        desc: "Kuvvetli Karlı", 
        iconName: CloudSnow, 
        colorClass: "text-zinc-200", 
        bgClass: "from-zinc-200/15 to-transparent" 
      };
    case 77:
      return { 
        desc: "Kar Atıştırması", 
        iconName: CloudSnow, 
        colorClass: "text-slate-200", 
        bgClass: "from-slate-200/10 to-transparent" 
      };
    case 80:
    case 81:
    case 82:
      return { 
        desc: "Yer Yer Sağanak Yağışlı", 
        iconName: CloudRain, 
        colorClass: "text-sky-500", 
        bgClass: "from-sky-500/15 to-transparent" 
      };
    case 85:
    case 86:
      return { 
        desc: "Sağanak Kar Yağışlı", 
        iconName: CloudSnow, 
        colorClass: "text-indigo-200", 
        bgClass: "from-indigo-200/15 to-transparent" 
      };
    case 95:
      return { 
        desc: "Gökgürültülü Sağanak Yağış", 
        iconName: CloudLightning, 
        colorClass: "text-violet-500", 
        bgClass: "from-violet-500/15 to-transparent" 
      };
    case 96:
    case 99:
      return { 
        desc: "Dolu Yağışlı ve Gökgürültülü", 
        iconName: CloudLightning, 
        colorClass: "text-purple-600", 
        bgClass: "from-purple-600/15 to-transparent" 
      };
    default:
      return { 
        desc: "Bilinmiyor", 
        iconName: HelpCircle, 
        colorClass: "text-slate-400", 
        bgClass: "from-slate-400/10 to-transparent" 
      };
  }
}

// Full list of 81 Provinces of Turkey with exact average coordinates.
export const TURKEY_PROVINCES = [
  { id: 1, name: "Adana", latitude: 37.00167, longitude: 35.32889 },
  { id: 2, name: "Adıyaman", latitude: 37.7644, longitude: 38.2763 },
  { id: 3, name: "Afyonkarahisar", latitude: 38.7507, longitude: 30.5567 },
  { id: 4, name: "Ağrı", latitude: 39.7191, longitude: 43.0503 },
  { id: 5, name: "Amasya", latitude: 40.6499, longitude: 35.8353 },
  { id: 6, name: "Ankara", latitude: 39.93, longitude: 32.85 },
  { id: 7, name: "Antalya", latitude: 36.8841, longitude: 30.7056 },
  { id: 8, name: "Artvin", latitude: 41.1828, longitude: 41.8183 },
  { id: 9, name: "Aydın", latitude: 37.838, longitude: 27.8456 },
  { id: 10, name: "Balıkesir", latitude: 39.6484, longitude: 27.8826 },
  { id: 11, name: "Bilecik", latitude: 40.1451, longitude: 29.9799 },
  { id: 12, name: "Bingöl", latitude: 38.8847, longitude: 40.4939 },
  { id: 13, name: "Bitlis", latitude: 38.4006, longitude: 42.1095 },
  { id: 14, name: "Bolu", latitude: 40.7358, longitude: 31.6078 },
  { id: 15, name: "Burdur", latitude: 37.7203, longitude: 30.2908 },
  { id: 16, name: "Bursa", latitude: 40.1833, longitude: 29.0667 },
  { id: 17, name: "Çanakkale", latitude: 40.1553, longitude: 26.4142 },
  { id: 18, name: "Çankırı", latitude: 40.6013, longitude: 33.6134 },
  { id: 19, name: "Çorum", latitude: 40.5506, longitude: 34.9556 },
  { id: 20, name: "Denizli", latitude: 37.7742, longitude: 29.0875 },
  { id: 21, name: "Diyarbakır", latitude: 37.9144, longitude: 40.2306 },
  { id: 22, name: "Edirne", latitude: 41.6771, longitude: 26.5556 },
  { id: 23, name: "Elazığ", latitude: 38.6748, longitude: 39.2225 },
  { id: 24, name: "Erzincan", latitude: 39.7392, longitude: 39.4903 },
  { id: 25, name: "Erzurum", latitude: 39.9086, longitude: 41.2769 },
  { id: 26, name: "Eskişehir", latitude: 39.7667, longitude: 30.525 },
  { id: 27, name: "Gaziantep", latitude: 37.0667, longitude: 37.3833 },
  { id: 28, name: "Giresun", latitude: 40.9169, longitude: 38.3881 },
  { id: 29, name: "Gümüşhane", latitude: 40.4608, longitude: 39.4814 },
  { id: 30, name: "Hakkari", latitude: 37.5833, longitude: 43.7333 },
  { id: 31, name: "Hatay", latitude: 36.4018, longitude: 36.3498 },
  { id: 32, name: "Isparta", latitude: 37.7648, longitude: 30.5566 },
  { id: 33, name: "Mersin", latitude: 36.8121, longitude: 34.6415 },
  { id: 34, name: "İstanbul", latitude: 41.0082, longitude: 28.9784 },
  { id: 35, name: "İzmir", latitude: 38.4189, longitude: 27.1287 },
  { id: 36, name: "Kars", latitude: 40.6013, longitude: 43.0975 },
  { id: 37, name: "Kastamonu", latitude: 41.3887, longitude: 33.7753 },
  { id: 38, name: "Kayseri", latitude: 38.7312, longitude: 35.4787 },
  { id: 39, name: "Kırklareli", latitude: 41.7351, longitude: 27.2252 },
  { id: 40, name: "Kırşehir", latitude: 39.1458, longitude: 34.1639 },
  { id: 41, name: "Kocaeli", latitude: 40.8533, longitude: 29.8815 },
  { id: 42, name: "Konya", latitude: 37.8714, longitude: 32.4847 },
  { id: 43, name: "Kütahya", latitude: 39.4242, longitude: 29.9833 },
  { id: 44, name: "Malatya", latitude: 38.3552, longitude: 38.3095 },
  { id: 45, name: "Manisa", latitude: 38.6191, longitude: 27.4287 },
  { id: 46, name: "Kahramanmaraş", latitude: 37.5858, longitude: 36.9371 },
  { id: 47, name: "Mardin", latitude: 37.3212, longitude: 40.7245 },
  { id: 48, name: "Muğla", latitude: 37.2153, longitude: 28.3636 },
  { id: 49, name: "Muş", latitude: 38.7432, longitude: 41.5064 },
  { id: 50, name: "Nevşehir", latitude: 38.6244, longitude: 34.7144 },
  { id: 51, name: "Niğde", latitude: 37.9697, longitude: 34.6756 },
  { id: 52, name: "Ordu", latitude: 40.9862, longitude: 37.8797 },
  { id: 53, name: "Rize", latitude: 41.0201, longitude: 40.5234 },
  { id: 54, name: "Sakarya", latitude: 40.7569, longitude: 30.3789 },
  { id: 55, name: "Samsun", latitude: 41.2928, longitude: 36.3313 },
  { id: 56, name: "Siirt", latitude: 37.9333, longitude: 41.95 },
  { id: 57, name: "Sinop", latitude: 42.0268, longitude: 35.1625 },
  { id: 58, name: "Sivas", latitude: 39.75, longitude: 37.0167 },
  { id: 59, name: "Tekirdağ", latitude: 40.9781, longitude: 27.5117 },
  { id: 60, name: "Tokat", latitude: 40.3167, longitude: 36.55 },
  { id: 61, name: "Trabzon", latitude: 41.0028, longitude: 39.7167 },
  { id: 62, name: "Tunceli", latitude: 39.1083, longitude: 39.5472 },
  { id: 63, name: "Şanlıurfa", latitude: 37.1583, longitude: 38.7917 },
  { id: 64, name: "Uşak", latitude: 38.6823, longitude: 29.4082 },
  { id: 65, name: "Van", latitude: 38.5019, longitude: 43.373 },
  { id: 66, name: "Yozgat", latitude: 39.8181, longitude: 34.8147 },
  { id: 67, name: "Zonguldak", latitude: 41.4564, longitude: 31.7984 },
  { id: 68, name: "Aksaray", latitude: 38.3687, longitude: 34.037 },
  { id: 69, name: "Bayburt", latitude: 40.2552, longitude: 40.2249 },
  { id: 70, name: "Karaman", latitude: 37.1759, longitude: 33.2287 },
  { id: 71, name: "Kırıkkale", latitude: 39.8417, longitude: 33.5139 },
  { id: 72, name: "Batman", latitude: 37.8812, longitude: 41.1301 },
  { id: 73, name: "Şırnak", latitude: 37.5164, longitude: 42.4611 },
  { id: 74, name: "Bartın", latitude: 41.6376, longitude: 32.3338 },
  { id: 75, name: "Ardahan", latitude: 41.1105, longitude: 42.7022 },
  { id: 76, name: "Iğdır", latitude: 39.92, longitude: 44.05 },
  { id: 77, name: "Yalova", latitude: 40.6551, longitude: 29.2769 },
  { id: 78, name: "Karabük", latitude: 41.1984, longitude: 32.6264 },
  { id: 79, name: "Kilis", latitude: 36.7184, longitude: 37.1212 },
  { id: 80, name: "Osmaniye", latitude: 37.0742, longitude: 36.2467 },
  { id: 81, name: "Düzce", latitude: 40.8417, longitude: 31.1583 }
].sort((a, b) => a.name.localeCompare(b.name, "tr-TR"));
