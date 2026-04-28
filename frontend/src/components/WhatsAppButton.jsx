import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const WhatsAppButton = ({ phoneNumber = "+50763148640", message = "Hola! Me gustaría obtener más información sobre sus productos." }) => {
    const { t } = useLanguage();

    const handleClick = () => {
        const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <button
            onClick={handleClick}
            className="whatsapp-float"
            aria-label="Contactar por WhatsApp"
            title={t('common.contact_whatsapp') || "Contactar por WhatsApp"}
        >
            <MessageCircle size={32} />
            <span className="tooltip">{t('common.chat_us') || "Chatea con nosotros"}</span>
        </button>
    );
};

export default WhatsAppButton;
