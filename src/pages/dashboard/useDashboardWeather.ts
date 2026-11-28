import { useEffect, useState } from 'react';
import type { House } from '@/types/models';
import { fetchWeather } from '@/utils/weather';
import { logger } from '@/utils/logger';
import type { SetDashboardLoading } from './types';

export interface HeroWeather {
    temp: string | number;
    wind: number;
    condition: string;
}

/**
 * One-time weather load for the hero; re-runs only when the house id or user
 * changes (not when the live house doc refreshes), as before.
 */
export function useDashboardWeather(house: House | null, houseId: string | undefined, uid: string | undefined, setDashboardLoading: SetDashboardLoading) {
    const [weather, setWeather] = useState<HeroWeather>({ temp: "--", wind: 0, condition: "—" });

    useEffect(() => {
        const loadWeather = async () => {
            const currentHouse = house;
            if (!houseId || !uid || !currentHouse) return;
            try {
                // 6. Weather (Async - One time)
                if (currentHouse.location?.lat && currentHouse.location?.lng) {
                    fetchWeather(currentHouse.location.lat, currentHouse.location.lng)
                        .then(wData => {
                            if (wData) setWeather({ temp: wData.temp, wind: wData.windSpeed, condition: wData.condition });
                        })
                        .catch(e => logger.error("Weather fetch error:", e));
                } else {
                    setWeather({ temp: "?", wind: 0, condition: "Vantar staðsetningu" });
                }
            } catch (err) {
                logger.error("Setup listeners error:", err);
                setDashboardLoading(false);
            }
        };

        loadWeather();
    }, [houseId, uid, setDashboardLoading]);

    return weather;
}
