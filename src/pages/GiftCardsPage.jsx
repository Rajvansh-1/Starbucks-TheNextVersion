import React, { useState } from 'react';
import styles from '../styles/GiftCardsPage.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import giftCardDesigns from '../json/giftCardDesigns.json';

const GiftCardsPage = () => {
    const [selectedCard, setSelectedCard] = useState(null);
    const [amount, setAmount] = useState(500);
    const [message, setMessage] = useState('');

    const handleSelectCard = (card) => {
        setSelectedCard(card);
    };

    const handlePurchase = () => {
        if (selectedCard) {
            alert(`Purchased "${selectedCard.name}" card for ₹${amount} with message: "${message}"`);
        }
    };

    return (
        <div className={styles.giftCardContainer}>
            <AnimatePresence>
                {!selectedCard ? (
                    <motion.div
                        key="selector"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <div className={styles.header}>
                            <h1>CHOOSE A DESIGN</h1>
                            <p>Select a card to personalize and send.</p>
                        </div>
                        <div className={styles.cardGallery}>
                            {giftCardDesigns.map((card, index) => (
                                <motion.div
                                    key={card.id}
                                    className={styles.cardWrapper}
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.05, rotate: index % 2 === 0 ? 2 : -2 }}
                                    onClick={() => handleSelectCard(card)}
                                >
                                    <img src={card.image} alt={card.name} />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="customizer"
                        className={styles.customizer}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className={styles.cardPreview}>
                            <motion.div layoutId={selectedCard.id} className={styles.selectedCard}>
                                <img src={selectedCard.image} alt={selectedCard.name} />
                                <AnimatePresence>
                                    {message && (
                                        <motion.p 
                                            className={styles.liveMessage}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            {message}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                             <button onClick={() => setSelectedCard(null)} className={styles.backButton}>Choose a different card</button>
                        </div>
                        <div className={styles.formSection}>
                            <h2>Personalize Your Card</h2>
                            <div className={styles.amountSelector}>
                                <p>Select Amount (₹)</p>
                                <div>
                                    {[500, 1000, 2000, 5000].map(val => (
                                        <button key={val} onClick={() => setAmount(val)} className={amount === val ? styles.active : ''}>
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.messageBox}>
                                <label htmlFor="message">Add a personal message</label>
                                <textarea
                                    id="message"
                                    placeholder="Write your message here..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    maxLength="150"
                                />
                            </div>
                            <motion.button 
                                className={styles.purchaseButton} 
                                onClick={handlePurchase}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Purchase for ₹{amount}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GiftCardsPage;