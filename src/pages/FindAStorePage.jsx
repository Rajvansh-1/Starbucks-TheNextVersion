import React, { useState, useMemo } from 'react';
import styles from '../styles/FindAStorePage.module.css';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaSearch, FaCrosshairs } from 'react-icons/fa';
import storesData from '../json/stores.json';

const FindAStorePage = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredStores = useMemo(() => {
        if (!searchQuery) {
            return storesData;
        }
        return storesData.filter(store =>
            store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            store.address.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -50 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <div className={styles.pageContainer}>
            <div className={styles.searchContainer}>
                <motion.div 
                    className={styles.searchBox}
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <h1>Find a Starbucks Near You</h1>
                    <div className={styles.inputWrapper}>
                        <FaSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search for a store..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className={styles.locationButton}>
                        <FaCrosshairs /> Use My Location
                    </button>
                </motion.div>
            </div>
            <div className={styles.storeListContainer}>
                <motion.div
                    className={styles.storeList}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {filteredStores.map(store => (
                        <motion.div key={store.id} className={styles.storeCard} variants={itemVariants}>
                            <FaMapMarkerAlt className={styles.markerIcon} />
                            <div className={styles.storeInfo}>
                                <h3>{store.name}</h3>
                                <p>{store.address}</p>
                                <p>{store.city}</p>
                            </div>
                            <div className={styles.storeMeta}>
                                <span className={styles.distance}>{store.distance}</span>
                                <span className={store.open ? styles.open : styles.closed}>
                                    {store.open ? 'Open' : 'Closed'}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default FindAStorePage;