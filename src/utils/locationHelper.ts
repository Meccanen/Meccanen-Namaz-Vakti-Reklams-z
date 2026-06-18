export function requestLocationPermission(): Promise<boolean> {
  if (!navigator.geolocation) return Promise.resolve(false);
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      err => resolve(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  });
}

export function getCurrentPosition(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos.coords),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  });
}
