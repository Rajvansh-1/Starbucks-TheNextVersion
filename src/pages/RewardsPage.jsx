import React, { useState } from 'react';
import styles from '../styles/RewardsPage.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaGift, FaBirthdayCake, FaCoffee } from 'react-icons/fa';
import rewardsTiers from '../json/rewardsTiers.json';

// Assumes you have a video at "public/Starbucks-Rewards-video.mp4"
const backgroundVideoURL = "/Starbucks-Rewards-video.mp4";

const RewardsPage = () => {
    const [selectedTier, setSelectedTier] = useState(rewardsTiers[0]);

    const journeyVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.2,
                duration: 0.8,
                ease: "easeOut"
            }
        })
    };

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 }
    };

    return (
        <div className={styles.rewardsContainer}>
            {/* --- NEW: Standalone Title Section --- */}
            <div className={styles.pageTitleSection}>
                <motion.h1
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    FREE COFFEE IS A TAP AWAY
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                >
                    Join now to start earning Rewards.
                </motion.p>
            </div>

            {/* --- Video Header (No Text) --- */}
            <header className={styles.heroHeader}>
                <video autoPlay loop playsInline className={styles.backgroundVideo}>
                    <source src={backgroundVideoURL} type="video/mp4" />
                </video>
            </header>

            {/* --- Rewards Journey Section --- */}
            <section className={styles.journeySection}>
                <h2>Your Rewards Journey Starts Here</h2>
                <div className={styles.journeySteps}>
                    <motion.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.8 }} variants={journeyVariants} className={styles.step}>
                        <div className={styles.stepNumber}>1</div>
                        <h3>Create an account</h3>
                        <p>Join in the app or online. Link a credit/debit card or PayPal to start earning Stars right away.</p>
                    </motion.div>
                    <div className={styles.connector}></div>
                    <motion.div custom={1} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.8 }} variants={journeyVariants} className={styles.step}>
                        <div className={styles.stepNumber}>2</div>
                        <h3>Order and pay how you’d like</h3>
                        <p>Pay with your saved card, scan the app, or connect a payment method to earn Stars automatically.</p>
                    </motion.div>
                    <div className={styles.connector}></div>
                    <motion.div custom={2} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.8 }} variants={journeyVariants} className={styles.step}>
                        <div className={styles.stepNumber}>3</div>
                        <h3>Earn Stars, get Rewards</h3>
                        <p>As you earn Stars, you can redeem them for Rewards—like free food, drinks, and more!</p>
                    </motion.div>
                </div>
            </section>

            {/* --- Interactive Tiers Section --- */}
            <section className={styles.tiersSection}>
                <h2>Explore Your Rewards</h2>
                <p className={styles.tiersSubtitle}>Click on a Star value to see what rewards you can get.</p>
                <div className={styles.tierSelector}>
                    {rewardsTiers.map((tier) => (
                        <motion.button
                            key={tier.stars}
                            className={`${styles.tierButton} ${selectedTier.stars === tier.stars ? styles.active : ''}`}
                            onClick={() => setSelectedTier(tier)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            {tier.stars} <FaStar />
                        </motion.button>
                    ))}
                </div>
                <div className={styles.tierDisplay}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedTier.stars}
                            className={styles.tierCard}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }}
                        >
                            <div className={styles.tierImage}>
                                <img src={selectedTier.image} alt={selectedTier.title} />
                            </div>
                            <div className={styles.tierContent}>
                                <h3>{selectedTier.title}</h3>
                                <p>{selectedTier.description}</p>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </section>

            {/* --- Endless Extras --- */}
            <section className={styles.extrasSection}>
                <h2>Endless Extras</h2>
                <p>Members get access to special perks.</p>
                <div className={styles.extrasGrid}>
                    <div className={styles.extraCard}>
                        <FaCoffee className={styles.extraIcon} />
                        <h4>Free Coffee & Tea Refills</h4>
                        <p>Enjoy free refills on hot or iced brewed coffee and tea during the same store visit.</p>
                    </div>
                    <div className={styles.extraCard}>
                        <FaBirthdayCake className={styles.extraIcon} />
                        <h4>Birthday Treat</h4>
                        <p>On your birthday, receive one complimentary handcrafted beverage OR food item.</p>
                    </div>
                    <div className={styles.extraCard}>
                        <FaGift className={styles.extraIcon} />
                        <h4>Exclusive Offers</h4>
                        <p>Look out for special offers and games in the app, just for members.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default RewardsPage;