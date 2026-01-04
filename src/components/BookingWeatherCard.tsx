/**
 * BookingWeatherCard Component
 * Premium UI component displaying weather forecast, road conditions, and packing suggestions
 * Design: Glassmorphism with gradient backgrounds, smooth animations, mobile-first
 */

import { useState, useEffect } from 'react';
import { Cloud, Droplets, Wind, AlertTriangle, Loader2, Calendar } from 'lucide-react';
import { getWeatherForecast, shouldShowWeather, getForecastReliability } from '@/services/weatherService';
import { generatePackingSuggestions, getWeatherSummary } from '@/utils/packingSuggestions';
import { WEATHER_ICONS, WEATHER_LABELS_IS } from '@/types/weather';
import type { WeatherForecast, PackingSuggestion } from '@/types/weather';
import { getRoadConditions, getRoadSummary, type RoadCondition } from '@/services/roadService';

interface BookingWeatherCardProps {
    bookingId: string;
    startDate: Date;
    endDate: Date;
    houseLatitude: number;
    houseLongitude: number;
    houseName: string;
}

export default function BookingWeatherCard({
    bookingId,
    startDate,
    endDate,
    houseLatitude,
    houseLongitude,
    houseName
}: BookingWeatherCardProps) {
    const [forecast, setForecast] = useState<WeatherForecast | null>(null);
    const [suggestions, setSuggestions] = useState<PackingSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    // Don't render if booking is too far away
    if (!shouldShowWeather(startDate)) {
        return null;
    }

    useEffect(() => {
        fetchWeatherData();
    }, [bookingId, houseLatitude, houseLongitude]);

    const fetchWeatherData = async () => {
        setLoading(true);
        setError(null);

        try {
            const weatherData = await getWeatherForecast(houseLatitude, houseLongitude, startDate);
            setForecast(weatherData);

            if (weatherData) {
                const packingSuggestions = generatePackingSuggestions(weatherData);
                setSuggestions(packingSuggestions);
            }
        } catch (err) {
            console.error('Failed to fetch weather:', err);
            setError('Gat ekki sótt veðurspá');
        } finally {
            setLoading(false);
        }
    };

    const getGradientForWeather = () => {
        if (!forecast || forecast.days.length === 0) return 'from-stone-100 to-stone-50';

        const dominantCondition = forecast.days[0].condition;

        const gradients = {
            'sunny': 'from-amber-50 via-orange-50 to-yellow-50',
            'partly-cloudy': 'from-blue-50 via-sky-50 to-stone-50',
            'cloudy': 'from-slate-100 via-gray-100 to-stone-100',
            'rain': 'from-blue-100 via-slate-100 to-gray-100',
            'snow': 'from-blue-50 via-cyan-50 to-white',
            'sleet': 'from-slate-100 via-blue-100 to-gray-100',
            'thunderstorm': 'from-purple-100 via-slate-200 to-gray-200',
            'fog': 'from-gray-100 via-slate-100 to-stone-100',
            'wind': 'from-cyan-50 via-blue-100 to-slate-100'
        };

        return gradients[dominantCondition] || 'from-stone-100 to-stone-50';
    };

    if (loading) {
        return (
            <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-6 shadow-sm">
                <div className="flex items-center justify-center gap-3 text-stone-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">Sæki veðurspá...</span>
                </div>
            </div>
        );
    }

    if (error || !forecast) {
        return null; // Fail gracefully
    }

    const summary = getWeatherSummary(forecast);
    const reliability = getForecastReliability(startDate);
    const bookingDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div
            className={`relative overflow-hidden rounded-2xl border border-stone-200/50 bg-gradient-to-br ${getGradientForWeather()} p-6 shadow-lg hover:shadow-xl transition-all duration-500 cursor-pointer backdrop-blur-sm`}
            onClick={() => setExpanded(!expanded)}
        >
            {/* Decorative gradient orbs */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue/10 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Cloud className="w-5 h-5 text-charcoal/70" />
                            <h3 className="text-base font-bold text-charcoal">Veðurspá fyrir ferðina</h3>
                        </div>
                        <p className="text-xs text-stone-600 font-medium">{reliability}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-stone-500 mb-1">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {bookingDays} {bookingDays === 1 ? 'dagur' : 'dagar'}
                        </p>
                    </div>
                </div>

                {/* Weather Summary */}
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/50 shadow-sm">
                    <p className="text-sm font-medium text-charcoal/90 leading-relaxed">{summary}</p>
                </div>

                {/* Daily Forecast - Show first 3 days */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {forecast.days.slice(0, 3).map((day, idx) => (
                        <div
                            key={idx}
                            className="bg-white/70 backdrop-blur-sm rounded-xl p-3 text-center border border-white/60 hover:bg-white/90 transition-all duration-300 hover:scale-105"
                        >
                            <p className="text-xs font-bold text-stone-600 mb-2">
                                {idx === 0 ? 'Í dag' : idx === 1 ? 'Á morgun' : new Date(day.date).toLocaleDateString('is-IS', { weekday: 'short' })}
                            </p>
                            <div className="text-3xl mb-2">{WEATHER_ICONS[day.condition]}</div>
                            <p className="text-xs text-stone-500 mb-1">{WEATHER_LABELS_IS[day.condition]}</p>
                            <div className="flex items-center justify-center gap-1 text-xs font-bold">
                                <span className="text-stone-700">{Math.round(day.tempHigh)}°</span>
                                <span className="text-stone-400">/</span>
                                <span className="text-stone-500">{Math.round(day.tempLow)}°</span>
                            </div>
                            {day.precipitation > 0 && (
                                <div className="flex items-center justify-center gap-1 mt-1 text-xs text-blue-600">
                                    <Droplets className="w-3 h-3" />
                                    <span>{Math.round(day.precipitation)}mm</span>
                                </div>
                            )}
                            {day.windSpeed > 10 && (
                                <div className="flex items-center justify-center gap-1 mt-1 text-xs text-slate-600">
                                    <Wind className="w-3 h-3" />
                                    <span>{Math.round(day.windSpeed)} m/s</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Packing Suggestions - Expandable */}
                {suggestions.length > 0 && (
                    <div className={`transition-all duration-500 ${expanded ? 'max-h-96' : 'max-h-0'} overflow-hidden`}>
                        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/60">
                            <h4 className="text-sm font-bold text-charcoal mb-3 flex items-center gap-2">
                                <span>🎒</span>
                                Mælt með að pakka
                            </h4>
                            <div className="space-y-2">
                                {suggestions.slice(0, 5).map((sug, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-start gap-3 p-2 rounded-lg transition-all duration-300 ${sug.priority === 'high'
                                            ? 'bg-amber-50 border border-amber-200'
                                            : 'bg-stone-50'
                                            }`}
                                    >
                                        <span className="text-xl flex-shrink-0">{sug.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-charcoal">{sug.item}</p>
                                            <p className="text-xs text-stone-600">{sug.reason}</p>
                                        </div>
                                        {sug.priority === 'high' && (
                                            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Expand/Collapse Indicator */}
                <div className="text-center mt-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setExpanded(!expanded);
                        }}
                        className="text-xs text-stone-500 hover:text-charcoal font-medium transition-colors inline-flex items-center gap-1"
                    >
                        {expanded ? '▲ Loka' : suggestions.length > 0 ? `▼ Sjá pakkalista (${suggestions.length})` : '▼ Nánar'}
                    </button>
                </div>

                {/* Data source attribution */}
                <p className="text-[10px] text-stone-400 text-center mt-3">
                    Gögn frá {forecast.source === 'met.no' ? 'MET Norway' : 'Veður.is'} • Uppfært {new Date(forecast.fetchedAt).toLocaleTimeString('is-IS', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );
}
