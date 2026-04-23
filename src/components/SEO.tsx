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
    "description": "Íslenskt SaaS bókunarkerfi og app fyrir sumarhús í sameign. Bókunardagatal, sanngirnisregla, hússjóður og verkefnastjórnun.",
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
    title = 'Bústaðurinn.is — Bókunarkerfi fyrir sumarhús í sameign',
    description = 'Utanumhald og bókunardagatal fyrir sameiginleg sumarhús. Sanngjörn skipting helga, hússjóður og verkefnalisti fyrir meðeigendur. Prófaðu frítt í 30 daga.',
    keywords = 'bókunarkerfi sumarhús, sumarhús í sameign, bókunardagatal, utanumhald sumarhús, hússjóður, meðeigendur, sanngirnisregla, skipulag sumarhúss, orlofshús, íslenskt app',
    ogImage = 'https://www.bustadurinn.is/og-preview.png',
    canonical,
    structuredData,
    noIndex = false,
}: SEOProps) {
    const location = useLocation();
    const fullTitle = title.includes('|') ? title : `${title} | Bústaðurinn.is`;

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
