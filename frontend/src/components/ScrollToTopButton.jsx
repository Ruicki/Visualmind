import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false);

    // Show button when page is scrolled upto 300px
    const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    // Set the top cordinate to 0
    // make scrolling smooth
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    useEffect(() => {
        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    return (
        <div style={{
            position: 'fixed',
            bottom: '7rem',
            right: '2rem',
            zIndex: 1000,
            opacity: isVisible ? 1 : 0,
            pointerEvents: isVisible ? 'auto' : 'none',
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            <button
                onClick={scrollToTop}
                style={{
                    background: 'var(--primary)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    color: 'black'
                }}
            >
                <ArrowUp size={24} strokeWidth={2.5} />
            </button>
        </div>
    );
}
