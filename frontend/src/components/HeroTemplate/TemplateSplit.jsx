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
        gap: '1.2rem',
        marginBottom: '1.5rem',
    }}>
        {[
            { v: timeLeft.days, l: 'DÍAS' },
            { v: timeLeft.hours, l: 'HORAS' },
            { v: timeLeft.minutes, l: 'MINS' },
            { v: timeLeft.seconds, l: 'SEGS' },
        ].map((item, idx) => (
            <div key={idx} style={{ textAlign: 'center', minWidth: '52px' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '950', color: accentColor, lineHeight: 1 }}>
                    {String(item.v).padStart(2, '0')}
                </div>
                <div style={{ fontSize: '0.55rem', fontWeight: '800', opacity: 0.5, marginTop: '0.3rem', letterSpacing: '0.1em' }}>
                    {item.l}
                </div>
            </div>
        ))}
    </div>
);

export default function TemplateSplit({ campaign, timeLeft, isActive }) {
    const accentColor = campaign.accent_color || '#ffffff';
    const btnTextColor = getContrastColor(accentColor);
    const ctaLink = campaign.button_link || `/shop?campaign=${campaign.slug}`;
    const typeLabel = campaign.type === 'season' ? 'Season' : 'Campaign';

    return (
        <div className="hero-template-split" style={{
            display: 'flex',
            flexDirection: 'row',
            minHeight: '70vh',
            width: '100%',
            overflow: 'hidden',
        }}>
            {/* Left side — text */}
            <div style={{
                flex: '0 0 50%',
                background: '#0a0a0a',
                padding: '4rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
            }}>
                {/* Type badge */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : -20 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    style={{
                        display: 'inline-block',
                        padding: '0.3rem 0.9rem',
                        borderRadius: '100px',
                        background: `${accentColor}22`,
                        border: `1px solid ${accentColor}55`,
                        color: accentColor,
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        marginBottom: '1.5rem',
                    }}
                >
                    {typeLabel}
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : -30 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    style={{
                        fontSize: 'clamp(3rem, 5vw, 6rem)',
                        fontWeight: '950',
                        textTransform: 'uppercase',
                        fontStyle: 'italic',
                        letterSpacing: '-0.03em',
                        lineHeight: 0.88,
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
                            fontSize: '1rem',
                            color: 'rgba(255,255,255,0.65)',
                            lineHeight: 1.6,
                            marginBottom: '1.5rem',
                            maxWidth: '420px',
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
                    <Link
                        to={ctaLink}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            padding: '1.1rem 2.8rem',
                            borderRadius: '100px',
                            background: accentColor,
                            color: btnTextColor,
                            fontWeight: '900',
                            fontSize: '0.95rem',
                            textDecoration: 'none',
                            boxShadow: `0 16px 40px ${accentColor}44`,
                            transition: 'opacity 0.2s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                        {campaign.button_text || 'COMPRAR AHORA'}
                        <ArrowRight size={18} />
                    </Link>
                </motion.div>
            </div>

            {/* Right side — image */}
            <div style={{
                flex: '0 0 50%',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {campaign.banner_url ? (
                    <img
                        src={getProductImage(null, campaign.banner_url)}
                        alt={campaign.name}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                        }}
                    />
                ) : (
                    <ImagePlaceholder />
                )}
            </div>
        </div>
    );
}
