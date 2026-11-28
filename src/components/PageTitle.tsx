/**
 * Sets the document <title> of a signed-in (non-indexed) route. Public pages use <SEO>, which also emits
 * canonical/Open Graph/JSON-LD that private pages must not carry.
 *
 * Writes document.title directly instead of going through react-helmet-async: Helmet batches its DOM write
 * in a requestAnimationFrame that every re-render cancels, and the dashboard re-renders so often that its
 * title was never applied.
 */

import { useEffect } from 'react';

export default function PageTitle({ title }: { title: string }) {
    useEffect(() => {
        const previous = document.title;
        document.title = `${title} | Bústaðurinn.is`;
        return () => {
            document.title = previous;
        };
    }, [title]);
    return null;
}
