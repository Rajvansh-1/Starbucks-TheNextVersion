import React, { useState, useMemo } from 'react';
import styles from '../styles/MenuPage.module.css';
import productsData from '../json/products.json';
import AnimatedProductCard from '../components/AnimatedProductCard';
import { motion, AnimatePresence } from 'framer-motion';

const MenuPage = ({ addToCart }) => {
    const [activeFilter, setActiveFilter] = useState('All');

    const categories = useMemo(() => 
        ['All', ...new Set(productsData.map(p => p.product_type))], 
        []
    );

    const filteredProducts = useMemo(() => {
        if (activeFilter === 'All') {
            return productsData;
        }
        return productsData.filter(p => p.product_type === activeFilter);
    }, [activeFilter]);

    return (
        <div className={styles.menuContainer}>
            <motion.div 
                className={styles.header}
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
            >
                <h1>Explore Our Menu</h1>
                <p>Crafted with passion, just for you.</p>
            </motion.div>

            <div className={styles.filterContainer}>
                {categories.map(category => (
                    <motion.button
                        key={category}
                        className={`${styles.filterButton} ${activeFilter === category ? styles.active : ''}`}
                        onClick={() => setActiveFilter(category)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {category}
                        {activeFilter === category && (
                            <motion.div className={styles.underline} layoutId="underline" />
                        )}
                    </motion.button>
                ))}
            </div>

            <motion.div className={styles.productList} layout>
                <AnimatePresence>
                    {filteredProducts.map((product) => (
                        <AnimatedProductCard key={product.id} data={product} onAddToCart={addToCart} />
                    ))}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default MenuPage;