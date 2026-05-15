import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TemplateCinematic from './HeroTemplate/TemplateCinematic';
import TemplateSingle from './HeroTemplate/TemplateSingle';
import TemplateSplit from './HeroTemplate/TemplateSplit';
import TemplateCollage3 from './HeroTemplate/TemplateCollage3';
import TemplateCollage4 from './HeroTemplate/TemplateCollage4';
import TemplateMagazine from './HeroTemplate/TemplateMagazine';
import TemplateTicker from './HeroTemplate/TemplateTicker';
import { getTimeLeft } from '../utils/heroUtils';

const TEMPLATE_MAP = {
    cinematic: TemplateCinematic,
    single: TemplateSingle,
    split: TemplateSplit,
    collage3: TemplateCollage3,
    collage4: TemplateCollage4,
    magazine: TemplateMagazine,
    ticker: TemplateTicker,
};

export default function HeroSlider({ events = [] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(() => {
        if (!events.length) return null;
        const current = events[0];
        if (!current) return null;
        const targetDate = current.phase === 'upcoming' ? current.start_date : current.end_date;
        return targetDate ? getTimeLeft(targetDate) : null;
    });

    useEffect(() => {
        if (events.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % events.length);
        }, 6000);

        return () => clearInterval(interval);
    }, [events.length]);

    useEffect(() => {
        if (!events.length) return;

        const currentEvent = events[currentIndex];
        const targetDate = currentEvent.phase === 'upcoming' ? currentEvent.start_date : currentEvent.end_date;
        if (!targetDate) {
            setTimeLeft(null);
            return;
        }

        setTimeLeft(getTimeLeft(targetDate));

        const interval = setInterval(() => {
            setTimeLeft(getTimeLeft(targetDate));
        }, 1000);

        return () => clearInterval(interval);
    }, [currentIndex, events]);

    const next = () => setCurrentIndex(prev => (prev + 1) % events.length);
    const prev = () => setCurrentIndex(prev => (prev - 1 + events.length) % events.length);
    const goTo = (index) => setCurrentIndex(index);

    const currentEvent = events.length > 0 ? events[currentIndex] : null;
    const TemplateComponent = currentEvent ? TEMPLATE_MAP[currentEvent.template_type] : null;

    if (!events.length) {
        return (
            <header style={{
                minHeight: '60vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)',
                paddingTop: '40px',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: 'clamp(3rem, 8vw, 6rem)',
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        color: '#fff',
                    }}>
                        VISUALMIND
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '1rem' }}>
                        Moda que define tu universo
                    </p>
                </div>
            </header>
        );
    }

    return (
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {TemplateComponent && (
                        <TemplateComponent
                            campaign={currentEvent}
                            timeLeft={timeLeft}
                            isActive={true}
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            {events.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        aria-label="Slide anterior"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '1.5rem',
                            transform: 'translateY(-50%)',
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 10,
                            transition: 'background 0.2s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.75)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                    >
                        <ChevronLeft size={22} />
                    </button>

                    <button
                        onClick={next}
                        aria-label="Slide siguiente"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            right: '1.5rem',
                            transform: 'translateY(-50%)',
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.5)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 10,
                            transition: 'background 0.2s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.75)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                    >
                        <ChevronRight size={22} />
                    </button>

                    <div style={{
                        position: 'absolute',
                        bottom: '1.5rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        zIndex: 10,
                    }}>
                        {events.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => goTo(idx)}
                                aria-label={`Ir al slide ${idx + 1}`}
                                style={{
                                    width: idx === currentIndex ? '32px' : '10px',
                                    height: '10px',
                                    borderRadius: '100px',
                                    background: idx === currentIndex
                                        ? '#ffffff'
                                        : 'rgba(255,255,255,0.35)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    transition: 'width 0.3s ease, background 0.3s ease',
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}