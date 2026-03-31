import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const WhatsAppButton = ({ phoneNumber = "5491112345678", message = "Hola! Me gustaría obtener más información sobre sus productos." }) => {
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
            
            <style jsx>{`
                .whatsapp-float {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    width: 65px;
                    height: 65px;
                    background-color: #25d366;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
                    z-index: 1000;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }

                .whatsapp-float:hover {
                    transform: scale(1.1) rotate(5deg);
                    background-color: #20ba5a;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                }

                .tooltip {
                    position: absolute;
                    right: 80px;
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 8px 15px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    white-space: nowrap;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                    pointer-events: none;
                }

                .whatsapp-float:hover .tooltip {
                    opacity: 1;
                    visibility: visible;
                    right: 75px;
                }

                @media (max-width: 768px) {
                    .whatsapp-float {
                        bottom: 20px;
                        right: 20px;
                        width: 55px;
                        height: 55px;
                    }
                    .tooltip {
                        display: none;
                    }
                }
            `}</style>
        </button>
    );
};

export default WhatsAppButton;
