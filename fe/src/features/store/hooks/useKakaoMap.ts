import { useState, useRef, useEffect } from 'react';

interface KakaoLatLng {
  lat: () => number;
  lng: () => number;
}
interface KakaoMapInstance {
  setCenter: (position: KakaoLatLng) => void;
}
interface KakaoMarkerInstance {
  setPosition: (position: KakaoLatLng) => void;
}
interface KakaoMapsNS {
  load: (callback: () => void) => void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number }
  ) => KakaoMapInstance;
  Marker: new (options: {
    position: KakaoLatLng;
    map: KakaoMapInstance;
  }) => KakaoMarkerInstance;
  services: {
    Geocoder: new () => {
      addressSearch: (
        address: string,
        callback: (result: { x: string; y: string }[], status: string) => void
      ) => void;
    };
    Status: { OK: string };
  };
}
interface KakaoWindow {
  kakao?: { maps: KakaoMapsNS };
  daum?: {
    Postcode: new (options: {
      oncomplete: (data: {
        roadAddress: string;
        jibunAddress: string;
        x: string;
        y: string;
      }) => void;
    }) => { open: () => void };
  };
}

export function useKakaoMap(initialAddress?: string) {
  const [mapCoords, setMapCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<KakaoMapInstance | null>(null);

  useEffect(() => {
    const key = import.meta.env.VITE_KAKAO_MAP_KEY as string;
    if (!key) return;

    const onReady = () => setIsMapReady(true);
    const kakaoWindow = window as Window & KakaoWindow;

    if (kakaoWindow.kakao?.maps) {
      kakaoWindow.kakao.maps.load(onReady);
      return;
    }

    if (!document.getElementById('kakao-map-sdk')) {
      const script = document.createElement('script');
      script.id = 'kakao-map-sdk';
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`;
      script.onload = () =>
        (window as Window & KakaoWindow).kakao?.maps.load(onReady);
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!isMapReady || !initialAddress || mapCoords) return;
    const { kakao } = window as Window & KakaoWindow;
    if (!kakao) return;
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(initialAddress, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        setMapCoords({
          lat: parseFloat(result[0].y),
          lng: parseFloat(result[0].x),
        });
      }
    });
  }, [isMapReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isMapReady || !mapCoords || !mapContainerRef.current) return;
    const { kakao } = window as Window & KakaoWindow;
    if (!kakao) return;

    mapContainerRef.current.innerHTML = '';
    const position = new kakao.maps.LatLng(mapCoords.lat, mapCoords.lng);
    const map = new kakao.maps.Map(mapContainerRef.current, {
      center: position,
      level: 3,
    });
    new kakao.maps.Marker({ position, map });
    mapInstanceRef.current = map;
  }, [isMapReady, mapCoords]);

  const openAddressSearch = (onSelect: (address: string) => void) => {
    const launch = () => {
      const { daum } = window as Window & KakaoWindow;
      if (!daum) return;
      new daum.Postcode({
        oncomplete: (data) => {
          const fullAddress = data.roadAddress || data.jibunAddress;
          onSelect(fullAddress);

          if (data.x && data.y) {
            setMapCoords({ lat: parseFloat(data.y), lng: parseFloat(data.x) });
          } else {
            const { kakao } = window as Window & KakaoWindow;
            if (!kakao) return;
            const geocoder = new kakao.maps.services.Geocoder();
            geocoder.addressSearch(fullAddress, (result, status) => {
              if (status === kakao.maps.services.Status.OK) {
                setMapCoords({
                  lat: parseFloat(result[0].y),
                  lng: parseFloat(result[0].x),
                });
              }
            });
          }
        },
      }).open();
    };

    if ((window as Window & KakaoWindow).daum?.Postcode) {
      launch();
      return;
    }

    const script = document.createElement('script');
    script.src =
      'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.onload = launch;
    document.head.appendChild(script);
  };

  return { mapContainerRef, mapCoords, openAddressSearch };
}
