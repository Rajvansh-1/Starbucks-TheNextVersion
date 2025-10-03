import React from 'react';
import styles from '../styles/MenuPage.module.css';
import productsData from '../json/products.json';
import ProductBox from '../components/ProductBox';
import FramerMotion from '../animation/FramerMotion';

const MenuPage = () => {
    // Group products by their product_type
    const groupedProducts = productsData.reduce((acc, product) => {
        const { product_type } = product;
        if (!acc[product_type]) {
            acc[product_type] = [];
        }
        acc[product_type].push(product);
        return acc;
    }, {});

    return (
        <FramerMotion type="topToBottom">
            <div className={styles.menuContainer}>
                <div className={styles.header}>
                    <h1>Our Full Menu</h1>
                    <p>Discover your next favorite drink or snack.</p>
                </div>

                {Object.entries(groupedProducts).map(([category, products]) => (
                    <section key={category} className={styles.categorySection}>
                        <h2>{category}</h2>
                        <div className={styles.productList}>
                            {products.map((product) => (
                                <ProductBox key={product.id + Math.random()} data={product} />
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </FramerMotion>
    );
};

export default MenuPage;