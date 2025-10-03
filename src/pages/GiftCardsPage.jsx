import React from 'react';
import styles from '../styles/GiftCardsPage.module.css';
import FramerMotion from '../animation/FramerMotion';
import { motion } from 'framer-motion';

const GiftCardsPage = () => {
    const cards = [
        "https://www.starbucks.com/weblx/images/gift/happy-birthday-moon-bear.jpg",
        "https://www.starbucks.com/weblx/images/gift/merci.jpg",
        "https://www.starbucks.com/weblx/images/gift/congratulations-card.jpg",
        "https://www.starbucks.com/weblx/images/gift/starbucks-card-rewards.png"
    ];

    return (
        <div className={styles.giftCardContainer}>
            <FramerMotion type="topToBottom">
                <div className={styles.header}>
                    <h1>GIFT CARDS</h1>
                    <p>Brighten someone's day with a Starbucks Card.</p>
                </div>
            </FramerMotion>

            <div className={styles.cardGallery}>
                {cards.map((card, index) => (
                    <FramerMotion key={index} type="popup" delay={index * 0.2}>
                        <motion.div 
                            className={styles.card}
                            whileHover={{ scale: 1.05, y: -10 }}
                        >
                            <img src={card} alt={`Gift card design ${index + 1}`} />
                        </motion.div>
                    </FramerMotion>
                ))}
            </div>
             <button className={styles.viewAllButton}>View All Designs</button>
        </div>
    );
};

export default GiftCardsPage;