import React, { useEffect, useState } from 'react';
import styles from '../styles/Intro.module.css';
import { motion, AnimatePresence } from 'framer-motion';

const Intro = () => {
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [show, setShow] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setLoadingProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setShow(false), 500); // Wait half a second before hiding
                    return 100;
                }
                return prev + 1;
            });
        }, 30); // Controls the speed of the loading bar

        return () => clearInterval(interval);
    }, []);

    const textVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut", delay: 0.5 } }
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className={styles.intro_container}
                    exit={{ opacity: 0, y: "-100vh" }}
                    transition={{ duration: 1.5, ease: [0.76, 0, 0.24, 1] }}
                >
                    <div className={styles.content_wrapper}>
                        <motion.div
                            className={styles.logo_div}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        >
                            <img src="./starbucks-intro.png" loading="eager" alt="Starbucks Logo" />
                        </motion.div>
                        <div className={styles.intro_text}>
                            <motion.h2 variants={textVariants} initial="hidden" animate="visible">
                                STARBUCKS
                            </motion.h2>
                            <motion.p variants={textVariants} initial="hidden" animate="visible" transition={{ delay: 0.8 }}>
                                COFFEE THAT INSPIRES
                            </motion.p>
                        </div>
                        <div className={styles.loader_wrapper}>
                            <p className={styles.loading_percentage}>{loadingProgress}%</p>
                            <div className={styles.loading_bar_container}>
                                <motion.div
                                    className={styles.loading_bar}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${loadingProgress}%` }}
                                    transition={{ duration: 0.1, ease: "linear" }}
                                ></motion.div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Intro;