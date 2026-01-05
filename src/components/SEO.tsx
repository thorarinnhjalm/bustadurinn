/**
 * SEO Component with Meta Tags and JSON-LD
 */

import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
    canonical?: string;
    structuredData?: object;
    noIndex?: boolean;
}

export default function SEO({
    title = 'Bústaðurinn.is - Bókunarkerfi fyrir sumarhús',
    description = 'Bókunarkerfi og app fyrir sameiginleg sumarhús. Betra skipulag, gagnsæ fjármál og stafræn lyklakippa fyrir orlofshúsið.',
    keywords = 'sumarhús, bókunarkerfi, sameignarhús, orlofshús, íslenskt app, fjölskylduhús, veðurspá, bókunardagatal',
    ogImage = 'https://bustadurinn.is/og-image.jpg',
    canonical,
    structuredData,
    noIndex = false,
}: SEOProps) {
    const location = useLocation();
    const fullTitle = title.includes('|') ? title : `${title} | Bústaðurinn.is`;

    // Construct canonical URL
    // If explicit canonical provided, use it.
    // Otherwise, construct from current location, ensuring no trailing slash and HTTPS
    const effectiveCanonical = canonical || `https://bustadurinn.is${location.pathname === '/' ? '' : location.pathname.replace(/\/$/, '')}`;

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            {noIndex && <meta name="robots" content="noindex,nofollow" />}

            {/* Canonical Link */}
            <link rel="canonical" href={effectiveCanonical} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:site_name" content="Bústaðurinn.is" />
            <meta property="og:url" content={effectiveCanonical} />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />

            {/* Language */}
            <meta httpEquiv="content-language" content="is" />
            <html lang="is" />

            {/* Structured Data (JSON-LD) */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}
        </Helmet>
    );
}
