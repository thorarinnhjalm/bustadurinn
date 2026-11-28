import type { Dispatch, SetStateAction } from 'react';
import type { User } from '@/types/models';

/** The part of the house document the settings page edits locally (Gestir tab, address search). */
export interface HouseFormState {
    name: string;
    address: string;
    lat: number;
    lng: number;
    invite_code: string;
    wifi_ssid: string;
    wifi_password: string;
    no_wifi: boolean;
    holiday_mode: 'fairness' | 'first_come';
    house_rules: string;
    house_rules_en: string;
    check_in_time: string;
    check_out_time: string;
    directions: string;
    directions_en: string;
    access_instructions: string;
    access_instructions_en: string;
    emergency_contact: string;
    guest_instructions: string;
    guest_instructions_en: string;
    amenities: string[];
    privacy_hide_finances: boolean;
    finance_viewer_ids: string[];
}

export const INITIAL_HOUSE_FORM: HouseFormState = {
    name: '',
    address: '',
    lat: 0,
    lng: 0,
    invite_code: '',
    wifi_ssid: '',
    wifi_password: '',
    no_wifi: false,
    holiday_mode: 'first_come',
    house_rules: '',
    house_rules_en: '',
    check_in_time: '',
    check_out_time: '',
    directions: '',
    directions_en: '',
    access_instructions: '',
    access_instructions_en: '',
    emergency_contact: '',
    guest_instructions: '',
    guest_instructions_en: '',
    amenities: [],
    privacy_hide_finances: false,
    finance_viewer_ids: []
};

export type SetHouseForm = Dispatch<SetStateAction<HouseFormState>>;

/** Page-level success / error banners (the two regions rendered above the tab content). */
export interface SettingsFeedback {
    setSuccess: (message: string) => void;
    setError: (message: string) => void;
}

/** Membership actions (leave / remove member / delete house / delete account) confirmed in one modal. */
export type MembershipAction =
    | { type: 'leave' }
    | { type: 'remove'; member: User }
    | { type: 'delete_house' }
    | { type: 'delete_account' };
