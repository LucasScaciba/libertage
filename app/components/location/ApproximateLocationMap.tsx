"use client";

import { useEffect, useRef, useState } from "react";

interface ApproximateLocationMapProps {
  cep?: string;
  street?: string;
  neighborhood: string;
  city: string;
  state: string;
  radiusMeters?: number;
}

export function ApproximateLocationMap({
  cep,
  street,
  neighborhood,
  city,
  state,
  radiusMeters = 500,
}: ApproximateLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mapRef.current) return;

    // Check if map container already has _leaflet_id (already initialized)
    const container = mapRef.current as any;
    if (container._leaflet_id) {
      // Container already initialized, skip
      return;
    }

    // Import Leaflet CSS dynamically
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    link.crossOrigin = "";
    document.head.appendChild(link);

    // Dynamic import of Leaflet (client-side only)
    import("leaflet").then((L) => {
      // Double-check container is still available and not initialized
      if (!mapRef.current || (mapRef.current as any)._leaflet_id) {
        return;
      }

      // Build search query with priority: CEP > Street + Neighborhood > Neighborhood only
      let searchQuery = "";
      
      if (cep) {
        // Use CEP for most accurate geocoding
        const cleanCep = cep.replace(/\D/g, '');
        searchQuery = `${cleanCep}, Brasil`;
      } else if (street) {
        // Use street + neighborhood + city for better accuracy
        searchQuery = `${street}, ${neighborhood}, ${city}, ${state}, Brasil`;
      } else {
        // Fallback to neighborhood only
        searchQuery = `${neighborhood}, ${city}, ${state}, Brasil`;
      }
      
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=br`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0 && mapRef.current) {
            const { lat, lon } = data[0];
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lon);

            // Final check: ensure container is not already initialized
            const container = mapRef.current as any;
            if (container._leaflet_id) {
              console.log("Map container already initialized, skipping...");
              setIsLoading(false);
              return;
            }

            // Initialize map
            const map = L.map(mapRef.current!, {
              center: [latitude, longitude],
              zoom: 15,
              zoomControl: true,
              scrollWheelZoom: false,
              dragging: true,
            });

            mapInstanceRef.current = map;

            // Add CartoDB Voyager tiles (Uber-like style - clean and modern)
            L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
              maxZoom: 19,
              subdomains: 'abcd',
            }).addTo(map);

            // Add circle to show approximate area (500m radius) - light blue
            L.circle([latitude, longitude], {
              color: "#3b82f6",
              fillColor: "#60a5fa",
              fillOpacity: 0.15,
              weight: 2,
              radius: radiusMeters,
            }).addTo(map);

            // Add a marker at the center
            const customIcon = L.divIcon({
              className: "custom-map-marker",
              html: `
                <div style="
                  width: 32px;
                  height: 32px;
                  background-color: #3b82f6;
                  border-radius: 50% 50% 50% 0;
                  transform: rotate(-45deg);
                  border: 3px solid white;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">
                  <div style="
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transform: rotate(45deg);
                    color: white;
                    font-size: 16px;
                  ">
                    📍
                  </div>
                </div>
              `,
              iconSize: [32, 32],
              iconAnchor: [16, 32],
            });

            L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
            setIsLoading(false);
          }
        })
        .catch(err => {
          console.error("Error geocoding location:", err);
          setIsLoading(false);
        });
    });

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      // Clear the _leaflet_id from container
      if (mapRef.current) {
        delete (mapRef.current as any)._leaflet_id;
      }
    };
  }, [cep, street, neighborhood, city, state, radiusMeters]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "250px",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        marginBottom: "0.75rem",
        backgroundColor: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {isLoading && (
        <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>
          Carregando mapa...
        </div>
      )}
    </div>
  );
}
