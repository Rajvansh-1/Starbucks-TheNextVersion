import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const Cursor = () => {
    const cursorRef = useRef(null);
    const cursorTxtRef = useRef(null);
    const followerRef = useRef(null);

    useEffect(() => {
        const cursor = cursorRef.current;
        const follower = followerRef.current;
        const cursorTxt = cursorTxtRef.current;

        const onMouseMove = (event) => {
            const { clientX, clientY } = event;
            gsap.to(cursor, { x: clientX, y: clientY, duration: 0.1 });
            gsap.to(follower, { x: clientX, y: clientY, duration: 0.3 });
        };

        const onMouseEnter = (e, text) => {
            const target = e.target;
            if (target.classList.contains("allow_hover")) {
                cursorTxt.innerHTML = text;
                gsap.to(cursor, { scale: 3 });
                gsap.to(follower, { scale: 1.5 });
                cursorTxt.style.display = "flex";
            }
        };

        const onMouseLeave = () => {
            gsap.to(cursor, { scale: 1 });
            gsap.to(follower, { scale: 1 });
            cursorTxt.style.display = "none";
        };

        document.addEventListener("mousemove", onMouseMove);

        const links = document.querySelectorAll("a");
        const buttons = document.querySelectorAll("button");

        links.forEach((link) => {
            link.addEventListener("mouseenter", (e) => onMouseEnter(e, "View"));
            link.addEventListener("mouseleave", onMouseLeave);
        });

        buttons.forEach((button) => {
            button.addEventListener("mouseenter", (e) => onMouseEnter(e, "Click"));
            button.addEventListener("mouseleave", onMouseLeave);
        });

        return () => {
            document.removeEventListener("mousemove", onMouseMove);
            links.forEach((link) => {
                link.removeEventListener("mouseenter", (e) => onMouseEnter(e, "View"));
                link.removeEventListener("mouseleave", onMouseLeave);
            });
            buttons.forEach((button) => {
                button.removeEventListener("mouseenter", (e) => onMouseEnter(e, "Click"));
                button.removeEventListener("mouseleave", onMouseLeave);
            });
        };
    }, []);

    return (
        <>
            <div className='cursor' ref={cursorRef}>
                <span className='cursor_text' ref={cursorTxtRef}></span>
            </div>
            <div className='cursor_follower' ref={followerRef}></div>
        </>
    );
};

export default Cursor;