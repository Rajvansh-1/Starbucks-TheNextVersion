import React from 'react';
import styles from '../styles/RewardsPage.module.css';
import { motion } from 'framer-motion';
import { FaStar, FaCoffee, FaMobileAlt } from 'react-icons/fa';
import rewardsTiers from '../json/rewardsTiers.json';

// Video URL for the background
const backgroundVideoURL = "https://www.starbucks.com/weblx/videos/rewards/hero/xl-hero-desktop_2021.mp4";

const RewardsPage = () => {

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.3 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return (
        <div className={styles.rewardsContainer}>
            {/* --- Cinematic Header --- */}
            <header className={styles.heroHeader}>
                <video autoPlay muted loop playsInline className={styles.backgroundVideo}>
                    <source src={backgroundVideoURL} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                <div className={styles.heroOverlay}></div>
                <motion.div 
                    className={styles.heroContent}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                    <h1>Endless Extras</h1>
                    <p>Joining Starbucks® Rewards means unlocking access to exclusive benefits. Say hello to easy ordering, tasty Rewards and—yes, free coffee.</p>
                </motion.div>
            </header>

            {/* --- How It Works Section --- */}
            <section className={styles.howItWorks}>
                <h2>How It Works</h2>
                <motion.div 
                    className={styles.stepsGrid}
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.5 }}
                >
                    <motion.div className={styles.stepCard} variants={itemVariants}>
                        <div className={styles.stepIcon}><FaMobileAlt/></div>
                        <h3>1. Create an account</h3>
                        <p>To get started, join now. You can also join in the app to get access to the full range of Starbucks® Rewards benefits.</p>
                    </motion.div>
                    <motion.div className={styles.stepCard} variants={itemVariants}>
                        <div className={styles.stepIcon}><FaCoffee/></div>
                        <h3>2. Order and pay</h3>
                        <p>Use cash, credit/debit card or save some time and pay right through the app. You’ll collect Stars all ways.</p>
                    </motion.div>
                    <motion.div className={styles.stepCard} variants={itemVariants}>
                        <div className={styles.stepIcon}><FaStar/></div>
                        <h3>3. Earn Stars, get Rewards</h3>
                        <p>As you earn Stars, you can redeem them for Rewards—like free food, drinks, and more.</p>
                    </motion.div>
                </motion.div>
            </section>

            {/* --- Rewards Tiers Section --- */}
            <section className={styles.tiersSection}>
                 <h2>Get Your Favorites For Free</h2>
                 <p className={styles.tiersSubtitle}>The more Stars you collect, the bigger the reward.</p>
                 <div className={styles.tiersContainer}>
                    {rewardsTiers.map((tier, index) => (
                        <motion.div 
                            key={index} 
                            className={styles.tierCard}
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{ delay: index * 0.15, duration: 0.6 }}
                        >
                            <div className={styles.tierImage}>
                                <img src={tier.image} alt={tier.title} />
                            </div>
                            <div className={styles.tierContent}>
                                <h3>{tier.stars}<span><FaStar /></span></h3>
                                <h4>{tier.title}</h4>
                                <p>{tier.description}</p>
                            </div>
                        </motion.div>
                    ))}
                 </div>
            </section>
        </div>
    );
};

export default RewardsPage;