import { useState } from 'react';
import type { House, User } from '@/types/models';
import { useHouseLiveDoc } from './useHouseLiveDoc';
import { useBookingsData } from './useBookingsData';
import { useTasksData, useShoppingData, useInventoryData } from './useListData';
import { useActivityLogs } from './useActivityLogs';
import { useFinanceSummary } from './useFinanceSummary';
import { useDashboardWeather } from './useDashboardWeather';

/**
 * Owns every dashboard listener (house doc, bookings, tasks, shopping, logs,
 * budget + finance, inventory) and the one-time weather load. Subscribed in the
 * same order as before, from the component that calls this hook.
 *
 * Users without any `house_ids` get no listeners (the page redirects them to
 * onboarding instead).
 */
export function useDashboardData(currentHouse: House | null, currentUser: User | null) {
    const [dashboardLoading, setDashboardLoading] = useState(false);

    const hasNoHouseIds = !!currentUser && (!currentUser.house_ids || currentUser.house_ids.length === 0);
    const houseId = hasNoHouseIds ? undefined : currentHouse?.id;
    const uid = currentUser?.uid;

    useHouseLiveDoc(houseId, uid, setDashboardLoading);
    const { nextBooking, isOccupied } = useBookingsData(houseId, uid, setDashboardLoading);
    const tasks = useTasksData(houseId, uid, setDashboardLoading);
    const shoppingItems = useShoppingData(houseId, uid, setDashboardLoading);
    const { isCheckedIn, setIsCheckedIn, lastCheckoutChecklist, seasonalLogged } = useActivityLogs(houseId, uid, setDashboardLoading);
    const { finances, budgetPlan } = useFinanceSummary(houseId, uid, setDashboardLoading);
    const inventoryItems = useInventoryData(houseId, uid, setDashboardLoading);
    const weather = useDashboardWeather(currentHouse, houseId, uid, setDashboardLoading);

    return {
        dashboardLoading,
        nextBooking,
        isOccupied,
        tasks,
        shoppingItems,
        inventoryItems,
        weather,
        finances,
        budgetPlan,
        isCheckedIn,
        setIsCheckedIn,
        lastCheckoutChecklist,
        seasonalLogged
    };
}
