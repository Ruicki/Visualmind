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
        <Image size={32} color="rgba(255,255,255,0.2)" />
    </div>
);

export default function TemplateCollage4({ campaign, timeLeft, isActive }) {
    const accentColor = campaign.accent_color || '#ffffff';
    const btnTextColor = getContrastColor(accentColor);
    const ctaLink = campaign.button_link || `/shop?campaign=${campaign.slug}`;
    const secondaryImages = Array.isArray(campaign.secondary_images) ? campaign.secondary_images : [];

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            minHeight: '70vh',
            width: '100%',
            overflow: 'hidden',
        }}>
            {/* Main image — 60% */}
            <div style={{
                flex: '0 0 60%',
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

            {/* Right column — 2x2 grid (40%) */}
            <div style={{
                flex: '0 0 40%',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '1fr 1fr',
                overflow: 'hidden',
            }}>
                {/* Cell 1 — secondary_images[0] */}
                <div style={{ overflow: 'hidden', position: 'relative' }}>
                    {secondaryImages[0] ? (
                        <img
                            src={getProductImage(null, secondaryImages[0])}
                            alt={`${campaign.name} — imagen 2`}
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

                {/* Cell 2 — secondary_images[1] */}
                <div style={{ overflow: 'hidden', position: 'relative' }}>
                    {secondaryImages[1] ? (
                        <img
                            src={getProductImage(null, secondaryImages[1])}
                            alt={`${campaign.name} — imagen 3`}
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

                {/* Cell 3 — secondary_images[2] */}
                <div style={{ overflow: 'hidden', position: 'relative' }}>
                    {secondaryImages[2] ? (
                        <img
                            src={getProductImage(null, secondaryImages[2])}
                            alt={`${campaign.name} — imagen 4`}
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

                {/* Cell 4 — CTA with accent color */}
                <div style={{
                    background: accentColor,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    textAlign: 'center',
                    gap: '1rem',
                }}>
                    <motion.h3
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.9 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        style={{
                            fontSize: 'clamp(0.9rem, 1.5vw, 1.3rem)',
                            fontWeight: '950',
                            textTransform: 'uppercase',
                            letterSpacing: '-0.01em',
                            lineHeight: 1,
                            color: btnTextColor,
                        }}
                    >
                        {campaign.name}
                    </motion.h3>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 10 }}
                        transition={{ duration: 0.5, delay: 0.35 }}
                    >
                        <Link
                            to={ctaLink}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.7rem 1.4rem',
                                borderRadius: '100px',
                                background: btnTextColor,
                                color: accentColor,
                                fontWeight: '900',
                                fontSize: '0.8rem',
                                textDecoration: 'none',
                                transition: 'opacity 0.2s ease',
                                whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                            {campaign.button_text || 'VER MÁS'}
                            <ArrowRight size={14} />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
