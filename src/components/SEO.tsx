/**
 * SEO Component with Meta Tags and JSON-LD
 */

import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
    structuredData?: object;
}

export default function SEO({
    title = 'Bústaðurinn.is - Bókunarkerfi fyrir sumarhús',
    description = 'Bókunarkerfi og app fyrir sameiginleg sumarhús. Betra skipulag, gagnsæ fjármál og stafræn lyklakippa fyrir orlofshúsið.',
    keywords = 'sumarhús, bókunarkerfi, sameignarhús, orlofshús, íslenskt app, fjölskylduhús, veðurspá, bókunardagatal',
    ogImage = 'https://bustadurinn.is/og-image.jpg',
    structuredData,
}: SEOProps) {
    const fullTitle = title.includes('|') ? title : `${title} | Bústaðurinn.is`;

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:site_name" content="Bústaðurinn.is" />

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
