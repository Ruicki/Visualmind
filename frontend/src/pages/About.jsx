import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function About() {
    const { t } = useLanguage();

    return (
        <div className="container" style={{ paddingTop: '120px', paddingBottom: '4rem' }}>
            {/* Header */}
            <header style={{ marginBottom: '6rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>{t('about.title')}</h1>
                <div style={{ height: '2px', width: '80px', background: 'var(--primary)', margin: '0 auto' }}></div>
            </header>

            {/* Vision Section */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem', alignItems: 'center', marginBottom: '8rem' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>{t('about.vision_title')}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', lineHeight: '1.8' }}>
                        {t('about.vision_text')}
                    </p>
                </div>
                <div style={{ height: '500px', background: '#1e293b', borderRadius: '32px', overflow: 'hidden' }}>
                    <img
                        src="https://images.unsplash.com/photo-1578587018452-892bacefd3f2?q=80&w=1000&auto=format&fit=crop"
                        alt="Design Process"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
            </section>

            {/* Values */}
            <section>
                <h2 style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '4rem' }}>{t('about.values_title')}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem' }}>
                    {[
                        { title: t('about.value_1_title'), text: t('about.value_1_text') },
                        { title: t('about.value_2_title'), text: t('about.value_2_text') },
                        { title: t('about.value_3_title'), text: t('about.value_3_text') }
                    ].map((v, i) => (
                        <div key={i} style={{ padding: '3rem', background: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border-light)' }}>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>{v.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{v.text}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
