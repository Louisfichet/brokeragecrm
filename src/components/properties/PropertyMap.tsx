"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

// Fix pour les icônes Leaflet avec webpack
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapProperty {
  id: string;
  reference: string;
  address: string;
  city: string | null;
  lat: number;
  lng: number;
  apportedByCompany: { id: string; name: string } | null;
  apportedByContact: { id: string; firstName: string; lastName: string | null } | null;
  _count: { proposals: number };
}

interface PropertyMapProps {
  properties: MapProperty[];
}

function FitBounds({ properties }: { properties: MapProperty[] }) {
  const map = useMap();

  useEffect(() => {
    if (properties.length === 0) return;

    const bounds = L.latLngBounds(
      properties.map((p) => [p.lat, p.lng] as L.LatLngTuple)
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [properties, map]);

  return null;
}

export default function PropertyMap({ properties }: PropertyMapProps) {
  return (
    <MapContainer
      center={[46.603354, 1.888334]}
      zoom={6}
      className="w-full h-[600px] rounded-xl z-0"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds properties={properties} />
      {properties.map((property) => (
        <Marker
          key={property.id}
          position={[property.lat, property.lng]}
        >
          <Popup>
            <div className="min-w-[180px]">
              <p className="font-semibold text-sm">{property.reference}</p>
              <p className="text-xs text-gray-600 mt-0.5">
                {property.address}
              </p>
              {property.apportedByCompany && (
                <p className="text-xs text-gray-500 mt-1">
                  Apporteur : {property.apportedByCompany.name}
                </p>
              )}
              {property.apportedByContact && (
                <p className="text-xs text-gray-500 mt-1">
                  Apporteur : {property.apportedByContact.firstName}{" "}
                  {property.apportedByContact.lastName || ""}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-0.5">
                {property._count.proposals} proposition
                {property._count.proposals > 1 ? "s" : ""}
              </p>
              <Link
                href={`/biens/${property.id}`}
                className="inline-block mt-2 text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                Voir la fiche →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
