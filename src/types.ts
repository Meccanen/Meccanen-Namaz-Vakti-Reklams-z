export interface Location {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  admin1?: string; // region/province
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  relativeHumidity: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  weatherDesc: string;
  weatherIcon: string;
  tempMax: number;
  tempMin: number;
}

export interface ForecastDay {
  date: string;
  weatherCode: number;
  weatherDesc: string;
  weatherIcon: string;
  tempMax: number;
  tempMin: number;
}

export interface DayInsights {
  advice: string;
  historicalNote: string;
}
