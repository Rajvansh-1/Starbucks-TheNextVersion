import React, { useState, useMemo, useEffect } from 'react';
import styles from '../styles/FindAStorePage.module.css';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaSearch, FaCrosshairs } from 'react-icons/fa';
import storesData from '../json/stores.json';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

// Haversine formula to calculate distance between two lat/lng points
const haversineDistance = (coords1, coords2) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lng - coords1.lng);
    const lat1 = toRad(coords1.lat);
    const lat2 = toRad(coords2.lat);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // in km
};


const FindAStorePage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [userLocation, setUserLocation] = useState(null);

    const handleLocationClick = () => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            (error) => {
                console.error("Error getting user location:", error);
                alert("Could not get your location. Please ensure location services are enabled in your browser.");
            }
        );
    };
    
    // Automatically ask for location when the component mounts
    useEffect(() => {
        handleLocationClick();
    }, []);

    const storesWithDistances = useMemo(() => {
        if (!userLocation) return storesData.map(s => ({ ...s, distance: null }));
        return storesData
            .map(store => ({
                ...store,
                distance: haversineDistance(userLocation, { lat: store.lat, lng: store.lng }),
            }))
            .sort((a, b) => a.distance - b.distance);
    }, [userLocation]);

    const filteredStores = useMemo(() => {
        if (!searchQuery) {
            return storesWithDistances;
        }
        return storesWithDistances.filter(store =>
            store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            store.address.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, storesWithDistances]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -50 },
        visible: { opacity: 1, x: 0 }
    };

    const mapCenter = userLocation ? [userLocation.lat, userLocation.lng] : [24.5854, 73.7125]; // Default to Udaipur

    return (
        <div className={styles.pageContainer}>
            <div className={styles.sidePanel}>
                <motion.div 
                    className={styles.searchBox}
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <h1>Find a Store</h1>
                    <div className={styles.inputWrapper}>
                        <FaSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Filter nearby stores..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button onClick={handleLocationClick} className={styles.locationButton}>
                        <FaCrosshairs /> Use My Current Location
                    </button>
                </motion.div>

                <div className={styles.storeListContainer}>
                    <motion.div className={styles.storeList} variants={containerVariants} initial="hidden" animate="visible">
                        {filteredStores.map(store => (
                            <motion.div key={store.id} className={styles.storeCard} variants={itemVariants}>
                                <div className={styles.storeInfo}>
                                    <h3>{store.name}</h3>
                                    <p>{store.address}</p>
                                </div>
                                <div className={styles.storeMeta}>
                                    {store.distance !== null && <span className={styles.distance}>{store.distance.toFixed(1)} km</span>}
                                    <span className={store.open ? styles.open : styles.closed}>
                                        {store.open ? 'Open' : 'Closed'}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
            <div className={styles.mapContainer}>
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {filteredStores.map(store => (
                         <Marker key={store.id} position={[store.lat, store.lng]}>
                            <Popup>
                                <b>{store.name}</b><br />{store.address}
                            </Popup>
                        </Marker>
                    ))}
                    {userLocation && (
                        <Marker position={[userLocation.lat, userLocation.lng]}>
                            <Popup>You are here</Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>
        </div>
    );
};

export default FindAStorePage;