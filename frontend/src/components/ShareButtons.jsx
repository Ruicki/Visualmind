import React, { useState } from 'react';
import { Share2, Link2, Check } from 'lucide-react';
import { productShareUrl, whatsappShareLink, facebookShareLink } from '../utils/share';
import { useLanguage } from '../context/LanguageContext';

/**
 * @component ShareButtons
 * @description Compartir un producto por WhatsApp, Facebook o copiando el enlace.
 * En celulares usa el menú nativo de compartir cuando está disponible.
 */
export default function ShareButtons({ product }) {
    const { t } = useLanguage();
    const [copied, setCopied] = useState(false);
    if (!product?.id) return null;

    const url = productShareUrl(product.id);
    const text = `${product.title} · $${Number(product.price).toFixed(2)} en Visualmind`;

    const nativeShare = async () => {
        try {
            await navigator.share({ title: product.title, text, url });
        } catch {
            // El usuario canceló o el navegador no lo permite
        }
    };

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            window.prompt?.(t('product.copy_link', 'Copia el enlace'), url);
        }
    };

    const btn = {
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', borderRadius: '999px',
        border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)',
        fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'none'
    };

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: '0.25rem' }}>{t('product.share', 'Compartir')}:</span>
            <a href={whatsappShareLink(`${text}\n${url}`)} target="_blank" rel="noopener noreferrer" style={btn}>WhatsApp</a>
            <a href={facebookShareLink(url)} target="_blank" rel="noopener noreferrer" style={btn}>Facebook</a>
            <button type="button" onClick={copy} style={btn}>
                {copied ? <Check size={14} /> : <Link2 size={14} />} {copied ? t('product.link_copied', 'Copiado') : t('product.copy_link', 'Copiar enlace')}
            </button>
            {typeof navigator !== 'undefined' && navigator.share && (
                <button type="button" onClick={nativeShare} style={btn} aria-label={t('product.share', 'Compartir')}>
                    <Share2 size={14} />
                </button>
            )}
        </div>
    );
}
