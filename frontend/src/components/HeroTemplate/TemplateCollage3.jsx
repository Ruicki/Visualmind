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
        <Image size={36} color="rgba(255,255,255,0.2)" />
    </div>
);

export default function TemplateCollage3({ campaign, timeLeft, isActive }) {
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

                {/* Text overlay at bottom of main image */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                    padding: '3rem 2.5rem 2rem',
                }}>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        style={{
                            fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                            fontWeight: '950',
                            textTransform: 'uppercase',
                            letterSpacing: '-0.02em',
                            lineHeight: 0.9,
                            color: '#ffffff',
                            marginBottom: '0.8rem',
                        }}
                    >
                        {campaign.name}
                    </motion.h2>

                    {campaign.description && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: isActive ? 1 : 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            style={{
                                fontSize: '0.9rem',
                                color: 'rgba(255,255,255,0.7)',
                                lineHeight: 1.5,
                                marginBottom: '1.2rem',
                                maxWidth: '400px',
                            }}
                        >
                            {campaign.description}
                        </motion.p>
                    )}

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 10 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        <Link
                            to={ctaLink}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.7rem',
                                padding: '0.9rem 2.2rem',
                                borderRadius: '100px',
                                background: accentColor,
                                color: btnTextColor,
                                fontWeight: '900',
                                fontSize: '0.9rem',
                                textDecoration: 'none',
                                boxShadow: `0 12px 30px ${accentColor}44`,
                                transition: 'opacity 0.2s ease',
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                            {campaign.button_text || 'COMPRAR AHORA'}
                            <ArrowRight size={16} />
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Right column — 2 stacked secondary images (40%) */}
            <div style={{
                flex: '0 0 40%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}>
                {/* Secondary image 0 */}
                <div style={{ flex: '0 0 50%', overflow: 'hidden', position: 'relative' }}>
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

                {/* Secondary image 1 */}
                <div style={{ flex: '0 0 50%', overflow: 'hidden', position: 'relative' }}>
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
            </div>
        </div>
    );
}
