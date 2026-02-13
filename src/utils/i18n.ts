/**
 * Localization utilities for calendar and UI
 * Supports dynamic language switching
 */

import { is, enUS, de, fr, es } from 'date-fns/locale';
import type { Locale } from 'date-fns';

export type SupportedLanguage = 'is' | 'en' | 'de' | 'fr' | 'es';

// Date-fns locale mapping
export const dateLocales: Record<SupportedLanguage, Locale> = {
    is: is,      // Icelandic
    en: enUS,    // English (US)
    de: de,      // German
    fr: fr,      // French
    es: es       // Spanish
};

// Calendar UI translations
export const calendarMessages: Record<SupportedLanguage, {
    next: string;
    previous: string;
    today: string;
    month: string;
    week: string;
    day: string;
    agenda: string;
    date: string;
    time: string;
    event: string;
    noEventsInRange: string;
    showMore: (total: number) => string;
}> = {
    is: {
        next: "Næsta",
        previous: "Fyrri",
        today: "Í dag",
        month: "Mánuður",
        week: "Vika",
        day: "Dagur",
        agenda: "Dagskrá",
        date: "Dagsetning",
        time: "Tími",
        event: "Atburður",
        noEventsInRange: "Engar bókanir á þessu tímabili",
        showMore: (total) => `+ Sýna ${total} fleiri`
    },
    en: {
        next: "Next",
        previous: "Previous",
        today: "Today",
        month: "Month",
        week: "Week",
        day: "Day",
        agenda: "Agenda",
        date: "Date",
        time: "Time",
        event: "Event",
        noEventsInRange: "No bookings in this date range",
        showMore: (total) => `+ Show ${total} more`
    },
    de: {
        next: "Weiter",
        previous: "Zurück",
        today: "Heute",
        month: "Monat",
        week: "Woche",
        day: "Tag",
        agenda: "Agenda",
        date: "Datum",
        time: "Zeit",
        event: "Ereignis",
        noEventsInRange: "Keine Buchungen in diesem Zeitraum",
        showMore: (total) => `+ ${total} weitere anzeigen`
    },
    fr: {
        next: "Suivant",
        previous: "Précédent",
        today: "Aujourd'hui",
        month: "Mois",
        week: "Semaine",
        day: "Jour",
        agenda: "Agenda",
        date: "Date",
        time: "Heure",
        event: "Événement",
        noEventsInRange: "Aucune réservation dans cette période",
        showMore: (total) => `+ Afficher ${total} de plus`
    },
    es: {
        next: "Siguiente",
        previous: "Anterior",
        today: "Hoy",
        month: "Mes",
        week: "Semana",
        day: "Día",
        agenda: "Agenda",
        date: "Fecha",
        time: "Hora",
        event: "Evento",
        noEventsInRange: "No hay reservas en este período",
        showMore: (total) => `+ Mostrar ${total} más`
    }
};

// Booking type labels
export const bookingTypeLabels: Record<SupportedLanguage, Record<string, string>> = {
    is: {
        personal: 'Persónuleg',
        guest: 'Gestur',
        rental: 'Útleiga',
        maintenance: 'Viðhald'
    },
    en: {
        personal: 'Personal',
        guest: 'Guest',
        rental: 'Rental',
        maintenance: 'Maintenance'
    },
    de: {
        personal: 'Persönlich',
        guest: 'Gast',
        rental: 'Vermietung',
        maintenance: 'Wartung'
    },
    fr: {
        personal: 'Personnel',
        guest: 'Invité',
        rental: 'Location',
        maintenance: 'Maintenance'
    },
    es: {
        personal: 'Personal',
        guest: 'Invitado',
        rental: 'Alquiler',
        maintenance: 'Mantenimiento'
    }
};

// Get default language from browser or user preference
export const getDefaultLanguage = (): SupportedLanguage => {
    const browserLang = navigator.language.split('-')[0];
    return (dateLocales[browserLang as SupportedLanguage] ? browserLang : 'is') as SupportedLanguage;
};
