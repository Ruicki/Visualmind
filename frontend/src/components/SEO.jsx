import { useEffect } from 'react';

const SEO = ({ title, description, image, url }) => {
    useEffect(() => {
        // Update title
        const fullTitle = `${title} | Visualmind Premium Store`;
        document.title = fullTitle;

        // Update meta tags
        const updateMeta = (name, content, attr = 'name') => {
            if (!content) return;
            let el = document.querySelector(`meta[${attr}="${name}"]`);
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute(attr, name);
                document.head.appendChild(el);
            }
            el.setAttribute('content', content);
        };

        updateMeta('description', description);
        updateMeta('og:title', fullTitle, 'property');
        updateMeta('og:description', description, 'property');
        updateMeta('og:type', 'website', 'property');
        if (image) updateMeta('og:image', image, 'property');
        if (url) updateMeta('og:url', url, 'property');
        
        // Twitter
        updateMeta('twitter:card', 'summary_large_image');
        updateMeta('twitter:title', fullTitle);
        updateMeta('twitter:description', description);
        if (image) updateMeta('twitter:image', image);

    }, [title, description, image, url]);

    return null; // Este componente no renderiza nada visualmente
};

export default SEO;
