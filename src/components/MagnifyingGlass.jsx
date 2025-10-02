import React, { useState } from 'react';
import styles from '../styles/MagnifyingGlass.module.css';

const MagnifyingGlass = ({ src, alt }) => {
    const [showMagnifier, setShowMagnifier] = useState(false);
    const [[x, y], setXY] = useState([0, 0]);
    const [[imgWidth, imgHeight], setSize] = useState([0, 0]);

    const magnifierSize = 150;
    const zoomLevel = 2.5;

    const handleMouseEnter = (e) => {
        const elem = e.currentTarget;
        const { width, height } = elem.getBoundingClientRect();
        setSize([width, height]);
        setShowMagnifier(true);
    };

    const handleMouseMove = (e) => {
        const elem = e.currentTarget;
        const { top, left } = elem.getBoundingClientRect();
        const x = e.pageX - left - window.pageXOffset;
        const y = e.pageY - top - window.pageYOffset;
        setXY([x, y]);
    };

    const handleMouseLeave = () => {
        setShowMagnifier(false);
    };

    return (
        <div
            className={styles.magnify_container}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <img
                id="best_sellers_img_con"
                className={styles.magnify_image}
                src={src}
                alt={alt}
            />

            <div
                style={{
                    display: showMagnifier ? '' : 'none',
                    position: 'absolute',
                    pointerEvents: 'none',
                    height: `${magnifierSize}px`,
                    width: `${magnifierSize}px`,
                    top: `${y - magnifierSize / 2}px`,
                    left: `${x - magnifierSize / 2}px`,
                    opacity: '1',
                    border: '1px solid lightgray',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    backgroundImage: `url('${src}')`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: `${imgWidth * zoomLevel}px ${imgHeight * zoomLevel}px`,
                    backgroundPositionX: `${-x * zoomLevel + magnifierSize / 2}px`,
                    backgroundPositionY: `${-y * zoomLevel + magnifierSize / 2}px`
                }}
            ></div>
        </div>
    );
};

export default MagnifyingGlass;