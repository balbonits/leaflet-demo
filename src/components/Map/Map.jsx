import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import './map.css'; // Sidebar and popup styling

// Custom marker icon for user location (distinct from dots)
const customIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
});

// Available colors for dots
const dotColors = [
    { name: 'Red', fillColor: '#ff0000', borderColor: '#cc0000' },
    { name: 'Blue', fillColor: '#0000ff', borderColor: '#0000cc' },
    { name: 'Green', fillColor: '#00ff00', borderColor: '#00cc00' },
    { name: 'Yellow', fillColor: '#ffff00', borderColor: '#cccc00' },
];

// Sidebar component for color selection
function Sidebar({ selectedColor, setSelectedColor }) {
    return (
        <div
            style={{
                position: 'absolute',
                top: '20%',
                left: 10,
                backgroundColor: '#333',
                padding: '10px',
                borderRadius: '8px',
                zIndex: 1000,
                color: '#fff',
                fontFamily: 'Arial, sans-serif',
            }}
            role="region"
            aria-label="Color selection sidebar"
        >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Select Dot Color</h3>
            {dotColors.map((color) => (
                <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    style={{
                        display: 'block',
                        width: '100%',
                        padding: '8px',
                        margin: '5px 0',
                        backgroundColor: selectedColor.name === color.name ? '#555' : '#444',
                        color: '#fff',
                        border: `2px solid ${color.borderColor}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        textAlign: 'left',
                    }}
                    aria-pressed={selectedColor.name === color.name}
                >
                    {color.name}
                </button>
            ))}
        </div>
    );
}

// Component to update map view when center changes
function UpdateMapView({ center }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, 13);
    }, [center, map]);
    return null;
}

// Component to handle map click events
function MapEvents({ onMapClick }) {
    useMapEvents({
        click(e) {
            onMapClick([e.latlng.lat, e.latlng.lng]);
        },
    });
    return null;
}

function Map() {
    const defaultCenter = [51.505, -0.09]; // Fallback: London
    const [center, setCenter] = useState(defaultCenter);
    const [locationError, setLocationError] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedColor, setSelectedColor] = useState(dotColors[0]); // Default to Red

    // Fetch user's location on mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setCenter([latitude, longitude]);
                    setMarkers([{ id: 'user', position: [latitude, longitude], draggable: false, isUser: true }]);
                    setLocationError(null);
                    setIsLoading(false);
                },
                (error) => {
                    console.error('Geolocation error:', error.message);
                    setLocationError('Unable to retrieve your location. Using default location.');
                    setMarkers([{ id: 'default', position: defaultCenter, draggable: false, isUser: true }]);
                    setIsLoading(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        } else {
            setLocationError('Geolocation is not supported by your browser.');
            setMarkers([{ id: 'default', position: defaultCenter, draggable: false, isUser: true }]);
            setIsLoading(false);
        }
    }, []);

    // Handle map clicks to add new colored dots
    const handleMapClick = (coords) => {
        const newMarker = {
            id: Date.now().toString(),
            position: coords,
            draggable: true,
            color: selectedColor,
            isUser: false,
        };
        setMarkers((prev) => [...prev, newMarker]);
    };

    // Handle dot drag end
    const handleDragEnd = (id, e) => {
        const newPos = [e.target.getLatLng().lat, e.target.getLatLng().lng];
        setMarkers((prev) =>
            prev.map((marker) =>
                marker.id === id ? { ...marker, position: newPos } : marker
            )
        );
    };

    // Remove a dot and prevent event propagation
    const removeMarker = (id, e) => {
        e.stopPropagation();
        setMarkers((prev) => prev.filter((marker) => marker.id !== id));
    };

    return (<>
        {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#fff' }}>
                Loading your location...
            </div>
        ) : (
            <>
                <Sidebar selectedColor={selectedColor} setSelectedColor={setSelectedColor} />
                <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <UpdateMapView center={center} />
                    <MapEvents onMapClick={handleMapClick} />
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    {markers.map((marker) =>
                        marker.isUser ? (
                            <Marker
                                key={marker.id}
                                position={marker.position}
                                icon={customIcon}
                                draggable={marker.draggable}
                                eventHandlers={{
                                    dragend: (e) => handleDragEnd(marker.id, e),
                                }}
                                aria-label="Your current location"
                            >
                                <Popup>
                                    {locationError ? locationError : 'Your current location.'}
                                    <br />
                                    Explore the map to learn Leaflet!
                                </Popup>
                            </Marker>
                        ) : (
                            <CircleMarker
                                key={marker.id}
                                center={marker.position}
                                radius={8}
                                fillColor={marker.color.fillColor}
                                color={marker.color.borderColor}
                                weight={2}
                                fillOpacity={0.8}
                                draggable={marker.draggable}
                                eventHandlers={{
                                    dragend: (e) => handleDragEnd(marker.id, e),
                                }}
                                aria-label={`Custom ${marker.color.name} dot`}
                            >
                                <Popup>
                                    {`Custom ${marker.color.name} dot at [${marker.position[0].toFixed(4)}, ${marker.position[1].toFixed(4)}]`}
                                    <br />
                                    {marker.draggable && (
                                        <button
                                            onClick={(e) => removeMarker(marker.id, e)}
                                            style={{ marginTop: '5px', padding: '5px', cursor: 'pointer' }}
                                            aria-label={`Remove ${marker.color.name} dot`}
                                        >
                                            Remove Dot
                                        </button>
                                    )}
                                </Popup>
                            </CircleMarker>
                        )
                    )}
                </MapContainer>
            </>
        )}
    </>
    );
}

export default Map;