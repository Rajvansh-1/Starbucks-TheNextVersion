import React from 'react';
import { motion } from 'framer-motion';
import styles from '../styles/MenuPage.module.css'; // We'll use the same stylesheet
import { FaPlus } from 'react-icons/fa';

const AnimatedProductCard = ({ data, onAddToCart }) => {
    const cardVariants = {
        hidden: { opacity: 0, scale: 0.8, y: 50 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
    };

    return (
        <motion.div
            className={styles.productCard}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -10, transition: { type: 'spring', stiffness: 300 } }}
        >
            <motion.div className={styles.imageContainer}>
                <img src={data.image} alt={data.name} />
            </motion.div>
            <div className={styles.cardContent}>
                <h4>{data.name}</h4>
                <div className={styles.cardFooter}>
                    <p>₹{data.price}.00</p>
                    <motion.button 
                        className={styles.addButton} 
                        onClick={() => onAddToCart(data)}
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.1, rotate: 90 }}
                    >
                        <FaPlus />
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

export default AnimatedProductCard;