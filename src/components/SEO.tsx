/**
 * SEO Component with Meta Tags, JSON-LD, and Organization Schema
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

// Organization schema rendered on every page — critical for Knowledge Graph + LLM entity recognition
const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Bústaðurinn.is",
    "alternateName": "Neðri Hóll Hugmyndahús ehf.",
    "url": "https://www.bustadurinn.is",
    "logo": "https://www.bustadurinn.is/logo_high_res.png",
    "description": "Ókeypis íslenskt app og bókunarkerfi fyrir sumarhús. Bókunardagatal, sanngirnisregla, hússjóður og verkefnastjórnun — ókeypis og opið öllum.",
    "founder": {
        "@type": "Person",
        "name": "Þórarinn Hjálmarsson"
    },
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "Álfhólsvegi 97",
        "addressLocality": "Kópavogur",
        "postalCode": "200",
        "addressCountry": "IS"
    },
    "sameAs": [
        "https://www.facebook.com/bustadurinn.is/",
        "https://www.linkedin.com/company/bústaðurinn-is/"
    ],
    "contactPoint": {
        "@type": "ContactPoint",
        "email": "hall@bustadurinn.is",
        "contactType": "customer support",
        "availableLanguage": "Icelandic"
    }
};

export default function SEO({
    title = 'Bústaðurinn.is | Ókeypis app og bókunarkerfi fyrir sumarhús',
    description = 'Ókeypis app fyrir sumarhúsið þitt. Bókunardagatal, hússjóður, verkefnalisti og sanngirnisregla — allt á einum stað, beint í símanum. Engin binding.',
    keywords = 'sumarhúsaforrit, sumarhús app, bókunarkerfi sumarhús, ókeypis sumarhús kerfi, hússjóður, sumarhús dagatal, skipulag sumarhúss, sumarhús í sameign, bókunardagatal',
    ogImage = 'https://www.bustadurinn.is/og-preview.png',
    canonical,
    structuredData,
    noIndex = false,
}: SEOProps) {
    const location = useLocation();
    // Only append the brand when the title doesn't already carry it. The old
    // check looked for | — – separators alone, so the eleven pages ending in
    // " - Bústaðurinn.is" (plain hyphen) were served titles reading
    // "... - Bústaðurinn.is | Bústaðurinn.is", wasting ~17 characters of a
    // ~60-character budget on a repeated brand name.
    const alreadyBranded = /bústaðurinn\.is/i.test(title);
    const hasSeparator = title.includes('|') || title.includes('—') || title.includes('–');
    const fullTitle = alreadyBranded || hasSeparator ? title : `${title} | Bústaðurinn.is`;

    // Construct canonical URL
    // If explicit canonical provided, use it.
    // Otherwise, construct from current location, ensuring no trailing slash and HTTPS
    const effectiveCanonical = canonical || `https://www.bustadurinn.is${location.pathname === '/' ? '' : location.pathname.replace(/\/$/, '')}`;

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

            {/* Organization Schema — renders on every page */}
            <script type="application/ld+json">
                {JSON.stringify(organizationSchema)}
            </script>

            {/* Page-specific Structured Data (JSON-LD) */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}
        </Helmet>
    );
}
