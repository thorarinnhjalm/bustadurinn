import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * The page frame shared by the signed-in feature pages (Calendar, Finance, Tasks, Settings, Árbók).
 *
 * There are exactly two content widths, both centred with the same horizontal padding so the left edge
 * of the back link / title / content is identical on every page of the same width (and lines up with the
 * dashboard's top navigation, which uses the 'reading' width):
 *  - 'reading' (max-w-5xl): lists, forms and settings: Finance, Tasks, Settings, Árbók.
 *  - 'wide'    (max-w-7xl): the calendar month grid, which needs the room.
 */
export type PageWidth = 'reading' | 'wide';

const PAGE_WIDTH_CLASS: Record<PageWidth, string> = {
    reading: 'max-w-5xl',
    wide: 'max-w-7xl',
};

/** Shared horizontal padding (also used by the dashboard's top navigation). */
const PAGE_GUTTER_CLASS = 'px-4 md:px-6';

interface PageContainerProps extends Omit<HTMLAttributes<HTMLElement>, 'className'> {
    width?: PageWidth;
    as?: ElementType;
    className?: string;
    children: ReactNode;
}

export function PageContainer({ width = 'reading', as: Tag = 'div', className = '', children, ...rest }: PageContainerProps) {
    return (
        <Tag {...rest} className={`mx-auto w-full ${PAGE_WIDTH_CLASS[width]} ${PAGE_GUTTER_CLASS} ${className}`.trim()}>
            {children}
        </Tag>
    );
}

interface PageHeaderProps {
    /** The page's <h1>. */
    title: string;
    /** Muted line under the title. */
    description?: ReactNode;
    /** Right-hand slot: primary action button, status pill... */
    actions?: ReactNode;
    width?: PageWidth;
    backTo?: string;
    backLabel?: string;
    className?: string;
}

export default function PageHeader({
    title,
    description,
    actions,
    width = 'reading',
    backTo = '/dashboard',
    backLabel = 'Til baka',
    className = '',
}: PageHeaderProps) {
    return (
        <PageContainer width={width} className={`pt-6 mb-8 ${className}`.trim()}>
            <Link
                to={backTo}
                className="inline-flex items-center text-grey-mid hover:text-charcoal mb-4 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                {backLabel}
            </Link>

            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                <div className="min-w-0">
                    <h1 className="text-3xl font-serif text-charcoal mb-2">{title}</h1>
                    {description && <p className="text-grey-mid">{description}</p>}
                </div>
                {actions && <div className="shrink-0">{actions}</div>}
            </div>
        </PageContainer>
    );
}
