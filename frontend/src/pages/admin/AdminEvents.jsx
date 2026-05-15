import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft } from 'lucide-react';
import AdminCampaigns from './AdminCampaigns';
import AdminFeaturedProducts from './AdminFeaturedProducts';

export default function AdminEvents() {
    const [showCampaignSlots, setShowCampaignSlots] = useState(null);

    const handleOpenCampaignSlots = (campaignId, campaignName) => {
        setShowCampaignSlots({ id: campaignId, name: campaignName });
    };

    const handleBack = () => {
        setShowCampaignSlots(null);
    };

    if (showCampaignSlots) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-container">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2rem' }}>
                    <button onClick={handleBack} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft size={18} />
                    </button>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Slots de: <strong style={{ color: 'white' }}>{showCampaignSlots.name}</strong>
                    </span>
                </div>
                <AdminFeaturedProducts campaignId={showCampaignSlots.id} />
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-container">
            <AdminCampaigns onOpenCampaignSlots={handleOpenCampaignSlots} />
        </motion.div>
    );
}
