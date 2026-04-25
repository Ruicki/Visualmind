export default function InfoPage() {
    const { page } = useParams();
    const { t } = useLanguage();

    const getPageData = () => {
        switch (page) {
            case 'shipping':
                return {
                    title: t('info.shipping_title'),
                    body: t('info.shipping_body')
                };
            case 'returns':
                return {
                    title: t('info.returns_title'),
                    body: t('info.returns_body')
                };
            case 'faq':
                return {
                    title: t('info.faq_title'),
                    body: t('info.faq_body')
                };
            default:
                return {
                    title: t('info.not_found'),
                    body: `<p>${t('info.not_found_body')}</p>`
                };
        }
    };

    const data = getPageData();

    return (
        <div style={{ paddingTop: '140px', paddingBottom: '100px', minHeight: '100vh', background: '#050505', color: 'white' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '3rem', textDecoration: 'none' }}>
                    <ArrowLeft size={20} /> {t('info.back')}
                </Link>

                <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '3rem' }}>{data.title}</h1>

                <div
                    dangerouslySetInnerHTML={{ __html: data.body }}
                    style={{ lineHeight: '1.8', fontSize: '1.1rem', color: 'var(--text-secondary)' }}
                />
            </div>
        </div>
    );
}
