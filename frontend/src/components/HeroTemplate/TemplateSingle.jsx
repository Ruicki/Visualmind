import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Image } from 'lucide-react';
import { getProductImage } from '../../utils/imageUtils';
import { getContrastColor } from '../../utils/colorUtils';

const ImagePlaceholder = () => (
    <div style={{
        width: '100%',
        height: '100%',
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    }}>
        <Image size={48} color="rgba(255,255,255,0.2)" />
    </div>
);

const Countdown = ({ timeLeft, accentColor }) => (
    <div style={{
        display: 'flex',
        gap: '1.5rem',
        marginBottom: '1.5rem',
        background: 'rgba(0,0,0,0.4)',
        padding: '1rem 1.5rem',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
    }}>
        {[
            { v: timeLeft.days, l: 'DÍAS' },
            { v: timeLeft.hours, l: 'HORAS' },
            { v: timeLeft.minutes, l: 'MINS' },
            { v: timeLeft.seconds, l: 'SEGS' },
        ].map((item, idx) => (
            <div key={idx} style={{ textAlign: 'center', minWidth: '56px' }}>
                <div style={{ fontSize: '2rem', fontWeight: '950', color: accentColor, lineHeight: 1 }}>
                    {String(item.v).padStart(2, '0')}
                </div>
                <div style={{ fontSize: '0.6rem', fontWeight: '800', opacity: 0.5, marginTop: '0.4rem', letterSpacing: '0.1em' }}>
                    {item.l}
                </div>
            </div>
        ))}
    </div>
);

export default function TemplateSingle({ campaign, timeLeft, isActive }) {
    const accentColor = campaign.accent_color || '#ffffff';
    const btnTextColor = getContrastColor(accentColor);
    const ctaLink = campaign.button_link || `/shop?campaign=${campaign.slug}`;

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            minHeight: '70vh',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {/* Background image */}
            {campaign.banner_url ? (
                <img
                    src={getProductImage(null, campaign.banner_url)}
                    alt={campaign.name}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                />
            ) : (
                <div style={{ position: 'absolute', inset: 0 }}>
                    <ImagePlaceholder />
                </div>
            )}

            {/* Dark overlay */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
            }} />

            {/* Content */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '4rem 2rem',
                maxWidth: '800px',
                width: '100%',
            }}>
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 30 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    style={{
                        fontSize: 'clamp(3rem, 8vw, 6rem)',
                        fontWeight: '950',
                        textTransform: 'uppercase',
                        letterSpacing: '-0.02em',
                        lineHeight: 0.9,
                        color: '#ffffff',
                        marginBottom: '1.2rem',
                    }}
                >
                    {campaign.name}
                </motion.h1>

                {campaign.description && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isActive ? 1 : 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        style={{
                            fontSize: '1.1rem',
                            color: 'rgba(255,255,255,0.75)',
                            maxWidth: '560px',
                            lineHeight: 1.6,
                            marginBottom: '1.5rem',
                        }}
                    >
                        {campaign.description}
                    </motion.p>
                )}

                {timeLeft && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isActive ? 1 : 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <Countdown timeLeft={timeLeft} accentColor={accentColor} />
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    {campaign.phase === 'upcoming' ? (
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            padding: '1.1rem 3rem',
                            borderRadius: '100px',
                            background: 'rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.7)',
                            fontWeight: '900',
                            fontSize: '1rem',
                            border: '1px solid rgba(255,255,255,0.2)',
                            cursor: 'default',
                        }}>
                            PRÓXIMAMENTE
                        </div>
                    ) : (
                        <Link
                            to={ctaLink}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.8rem',
                                padding: '1.1rem 3rem',
                                borderRadius: '100px',
                                background: accentColor,
                                color: btnTextColor,
                                fontWeight: '900',
                                fontSize: '1rem',
                                textDecoration: 'none',
                                boxShadow: `0 16px 40px ${accentColor}44`,
                                transition: 'opacity 0.2s ease',
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                            {campaign.button_text || 'COMPRAR AHORA'}
                            <ArrowRight size={20} />
                        </Link>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
