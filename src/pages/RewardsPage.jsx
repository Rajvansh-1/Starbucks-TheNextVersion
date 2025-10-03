import React from 'react';
import styles from '../styles/RewardsPage.module.css';
import { FaCoffee, FaStar, FaGift } from 'react-icons/fa';
import FramerMotion from '../animation/FramerMotion';

const RewardsPage = () => {
    return (
        <div className={styles.rewardsContainer}>
            <FramerMotion type="topToBottom">
                <div className={styles.header}>
                    <h1>STARBUCKS® REWARDS</h1>
                    <p>Join today to start earning your way to free coffee and more.</p>
                    <button className={styles.joinButton}>Join Now</button>
                </div>
            </FramerMotion>

            <div className={styles.stepsContainer}>
                <FramerMotion type="leftToRight" delay={0.2} className={styles.step}>
                    <FaCoffee className={styles.icon} />
                    <h3>Create an account</h3>
                    <p>Join in the app to get access to the full range of Starbucks® Rewards benefits.</p>
                </FramerMotion>
                <FramerMotion type="topToBottom" delay={0.4} className={styles.step}>
                    <FaStar className={styles.icon} />
                    <h3>Order and pay how you’d like</h3>
                    <p>Use cash, credit/debit card or save some time and pay right through the app.</p>
                </FramerMotion>
                <FramerMotion type="rightToLeft" delay={0.6} className={styles.step}>
                    <FaGift className={styles.icon} />
                    <h3>Earn Stars, get Rewards</h3>
                    <p>As you earn Stars, you can redeem them for Rewards—like free food, drinks, and more.</p>
                </FramerMotion>
            </div>
        </div>
    );
};

export default RewardsPage;