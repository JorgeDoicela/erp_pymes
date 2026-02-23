import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet + React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Component to handle clicks and coordinate updates
const LocationMarker = ({ position, setPosition }) => {
    useMapEvents({
        click(e) {
            setPosition({
                lat: e.latlng.lat,
                lng: e.latlng.lng
            });
        },
    });

    return position ? <Marker position={[position.lat, position.lng]} /> : null;
};

// Component to handle map centering when coordinates change externally
const RecenterMap = ({ position }) => {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.setView([position.lat, position.lng], map.getZoom());
        }
    }, [position, map]);
    return null;
};

const LocationPickerMap = ({
    initialLat,
    initialLng,
    radius = 200,
    onLocationChange,
    height = "300px"
}) => {
    const [position, setPosition] = useState(
        initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
    );

    useEffect(() => {
        if (position) {
            onLocationChange(position.lat, position.lng);
        }
    }, [position]);

    // Handle initial position updates if they change externally (e.g. from "Use my location")
    useEffect(() => {
        if (initialLat && initialLng) {
            setPosition({ lat: initialLat, lng: initialLng });
        }
    }, [initialLat, initialLng]);

    const defaultCenter = [initialLat || -0.1807, initialLng || -78.4678]; // Quito default

    return (
        <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }} className="shadow-inner">
            <MapContainer
                center={defaultCenter}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker position={position} setPosition={setPosition} />
                <RecenterMap position={position} />

                {position && (
                    <Circle
                        center={[position.lat, position.lng]}
                        radius={radius}
                        pathOptions={{
                            color: '#3b82f6',
                            fillColor: '#3b82f6',
                            fillOpacity: 0.2,
                            weight: 1
                        }}
                    />
                )}
            </MapContainer>
            <div className="bg-slate-50 px-3 py-1.5 text-[10px] text-slate-500 border-t border-slate-200">
                Haz clic en el mapa para seleccionar la ubicación de la oficina.
            </div>
        </div>
    );
};

export default LocationPickerMap;
