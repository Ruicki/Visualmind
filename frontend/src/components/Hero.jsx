import HeroSlider from './HeroSlider';

export default function Hero({ events = [], activeCampaign }) {
    // Compatibilidad hacia atrás: si se pasa activeCampaign (legacy), convertirlo a array
    const eventList = events.length > 0 
        ? events 
        : (activeCampaign ? [activeCampaign] : []);
    
    return <HeroSlider events={eventList} />;
}
