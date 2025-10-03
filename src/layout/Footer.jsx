import React from 'react';
import styles from '../styles/Footer.module.css';
import { SiStarbucks } from 'react-icons/si';
import { FaFacebook, FaInstagram, FaSpotify, FaTwitter } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Footer = () => {
    const footerVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                staggerChildren: 0.2,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    const iconVariants = {
        hover: {
            scale: 1.2,
            rotate: 360,
            transition: { duration: 0.4 },
        },
    };

    return (
        <motion.footer
            className={styles.footer}
            variants={footerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
        >
            <div className={styles.footer_details}>
                <motion.div className={styles.section_1} variants={itemVariants}>
                    <div className={styles.company_logo}>
                        <SiStarbucks />
                        <h5>Starbucks</h5>
                    </div>
                    <p className={styles.description}>
                        Inspiring and nurturing the human spirit—one person, one cup, and one neighborhood at a time.
                    </p>

                    <div className={styles.subscribe_div}>
                        <input type="text" placeholder='Your Email for Updates' />
                        <button>Subscribe</button>
                    </div>

                    <div className={styles.icons}>
                        <h5>Follow Us</h5>
                        <div className={styles.social_icons}>
                            <motion.a href="#" variants={iconVariants} whileHover="hover"><FaFacebook /></motion.a>
                            <motion.a href="#" variants={iconVariants} whileHover="hover"><FaInstagram /></motion.a>
                            <motion.a href="#" variants={iconVariants} whileHover="hover"><FaSpotify /></motion.a>
                            <motion.a href="#" variants={iconVariants} whileHover="hover"><FaTwitter /></motion.a>
                        </div>
                    </div>
                </motion.div>
                <motion.div className={styles.section_2} variants={itemVariants}>
                    <div className={styles.options}>
                        <h5>About Us</h5>
                        <ul>
                            <li><Link to="/">Our Company</Link></li>
                            <li><Link to="/">Our Coffee</Link></li>
                            <li><Link to="/">Stories and News</Link></li>
                            <li><Link to="/">Customer Service</Link></li>
                        </ul>
                    </div>
                    <div className={styles.options}>
                        <h5>Careers</h5>
                        <ul>
                            <li><Link to="/">Culture and Values</Link></li>
                            <li><Link to="/">U.S. Careers</Link></li>
                            <li><Link to="/">International Careers</Link></li>
                        </ul>
                    </div>
                    <div className={styles.options}>
                        <h5>Social Impact</h5>
                        <ul>
                            <li><Link to="/">People</Link></li>
                            <li><Link to="/">Planet</Link></li>
                            <li><Link to="/">Reporting</Link></li>
                        </ul>
                    </div>
                </motion.div>
            </div>
            <motion.div className={styles.copyright} variants={itemVariants}>
                Starbucks-TheNextVersion | Designed & Developed by Rajvansh &copy; {new Date().getFullYear()}
            </motion.div>
        </motion.footer>
    );
};

export default Footer;