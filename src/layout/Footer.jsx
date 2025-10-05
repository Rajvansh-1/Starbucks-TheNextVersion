import React from 'react';
import styles from '../styles/Footer.module.css';
import { SiStarbucks } from 'react-icons/si';
import { FaFacebookF, FaTwitter, FaInstagram, FaSpotify } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Footer = () => {

    const iconHover = {
        y: -5,
        scale: 1.2,
        color: '#cba258', // Gold color for hover
        transition: { type: 'spring', stiffness: 300 }
    };

    return (
        <footer className={styles.footer}>
            <div className={styles.glowingOrbs}>
                {[...Array(30)].map((_, i) => (
                    <div key={i} className={styles.orb} />
                ))}
            </div>
            
            <div className={styles.footerContent}>
                <motion.div
                    className={styles.brandSection}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.8 }}
                >
                    <SiStarbucks className={styles.mainLogo} />
                    <h3>The Final Pour</h3>
                    <p>Every cup a story, every visit a memory. Thank you for sharing a moment with us.</p>
                </motion.div>

                <div className={styles.linksAndSocial}>
                    <div className={styles.linkColumn}>
                        <h4>Explore</h4>
                        <Link to="/menu">Our Menu</Link>
                        <Link to="/rewards">Rewards Program</Link>
                        <Link to="/find-a-store">Find a Store</Link>
                    </div>
                    <div className={styles.linkColumn}>
                        <h4>Connect</h4>
                        <Link to="#">Our Company</Link>
                        <Link to="#">Careers</Link>
                        <Link to="#">Contact Us</Link>
                    </div>
                     <div className={styles.socialSection}>
                        <h4>Follow the Aroma</h4>
                        <div className={styles.socialIcons}>
                            <motion.a href="#" whileHover={iconHover}><FaFacebookF /></motion.a>
                            <motion.a href="#" whileHover={iconHover}><FaInstagram /></motion.a>
                            <motion.a href="#" whileHover={iconHover}><FaSpotify /></motion.a>
                            <motion.a href="#" whileHover={iconHover}><FaTwitter /></motion.a>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.copyright}>
                Starbucks-TheNextVersion | Designed & Developed by Rajvansh &copy; {new Date().getFullYear()}
            </div>
        </footer>
    );
};

export default Footer;