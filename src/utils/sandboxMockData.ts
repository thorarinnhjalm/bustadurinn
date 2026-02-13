/**
 * Sandbox Mock Data
 * Realistic demo data for sandbox experience
 */

import { addDays, subDays } from 'date-fns';

export interface MockBooking {
    id: string;
    title: string;
    start: Date;
    end: Date;
    type: 'personal' | 'rental' | 'maintenance' | 'guest';
    notes: string;
    userName: string;
}

export interface MockFinanceEntry {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    paidBy?: string;
}

export interface MockTask {
    id: string;
    title: string;
    assignee: string;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
    cost?: number;
    category: string;
}

export interface MockShoppingItem {
    id: string;
    item: string;
    checked: boolean;
    addedBy: string;
}

export interface MockMember {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'member';
    avatar?: string;
    initials: string;
}

export const MOCK_MEMBERS: MockMember[] = [
    {
        id: '1',
        name: 'Jón Jónsson',
        email: 'jon@example.com',
        role: 'owner',
        initials: 'JJ'
    },
    {
        id: '2',
        name: 'Guðrún Sigurðardóttir',
        email: 'gudrun@example.com',
        role: 'member',
        initials: 'GS'
    },
    {
        id: '3',
        name: 'Þóra Magnúsdóttir',
        email: 'thora@example.com',
        role: 'member',
        initials: 'ÞM'
    },
    {
        id: '4',
        name: 'Ólafur Kristjánsson',
        email: 'olafur@example.com',
        role: 'member',
        initials: 'ÓK'
    }
];

export const INITIAL_BOOKINGS: MockBooking[] = [
    {
        id: '1',
        title: 'Jón Jónsson',
        userName: 'Jón Jónsson',
        start: addDays(new Date(), 2),
        end: addDays(new Date(), 4),
        type: 'personal',
        notes: 'Fjölskylduhelgi með börnunum'
    },
    {
        id: '2',
        title: 'Guðrún Sigurðardóttir',
        userName: 'Guðrún Sigurðardóttir',
        start: addDays(new Date(), 8),
        end: addDays(new Date(), 10),
        type: 'personal',
        notes: 'Helgarferð'
    },
    {
        id: '3',
        title: 'Leiga - Airbnb',
        userName: 'Leiga',
        start: addDays(new Date(), 15),
        end: addDays(new Date(), 20),
        type: 'rental',
        notes: 'Gestir frá Þýskalandi - 4 fullorðnir'
    },
    {
        id: '4',
        title: 'Viðhald - Múrari',
        userName: 'Viðhald',
        start: addDays(new Date(), 25),
        end: addDays(new Date(), 26),
        type: 'maintenance',
        notes: 'Lagfæring á streymsrofi'
    },
    {
        id: '5',
        title: 'Þóra Magnúsdóttir',
        userName: 'Þóra Magnúsdóttir',
        start: subDays(new Date(), 5),
        end: subDays(new Date(), 3),
        type: 'personal',
        notes: 'Búið að vera'
    }
];

export const INITIAL_FINANCE: MockFinanceEntry[] = [
    { id: '1', date: '2026-01-02', description: 'Leigutekjur janúar', amount: 150000, type: 'income', category: 'Rent', paidBy: 'Airbnb' },
    { id: '2', date: '2026-01-05', description: 'Orkureikningur', amount: -24500, type: 'expense', category: 'Utilities', paidBy: 'Jón' },
    { id: '3', date: '2026-01-10', description: 'Snjómokstur', amount: -15000, type: 'expense', category: 'Maintenance', paidBy: 'Guðrún' },
    { id: '4', date: '2026-01-12', description: 'Eignarhaldsgjald', amount: -8900, type: 'expense', category: 'Tax', paidBy: 'Jón' },
    { id: '5', date: '2026-01-15', description: 'Internetgjald', amount: -5990, type: 'expense', category: 'Utilities', paidBy: 'Þóra' },
    { id: '6', date: '2025-12-20', description: 'Leigutekjur desember', amount: 175000, type: 'income', category: 'Rent', paidBy: 'Airbnb' },
    { id: '7', date: '2025-12-28', description: 'Múrviðgerð', amount: -32000, type: 'expense', category: 'Repairs', paidBy: 'Ólafur' },
    { id: '8', date: '2025-11-15', description: 'Leigutekjur nóvember', amount: 120000, type: 'income', category: 'Rent', paidBy: 'Airbnb' },
    { id: '9', date: '2025-11-22', description: 'Rafmagnsverktaki', amount: -28500, type: 'expense', category: 'Repairs', paidBy: 'Jón' },
];

export const INITIAL_TASKS: MockTask[] = [
    {
        id: '1',
        title: 'Skipta um ljósaperu á baði',
        assignee: 'Jón Jónsson',
        status: 'todo',
        priority: 'medium',
        dueDate: '2026-01-25',
        cost: 1500,
        category: 'Maintenance'
    },
    {
        id: '2',
        title: 'Mála pallinn',
        assignee: 'Guðrún Sigurðardóttir',
        status: 'in_progress',
        priority: 'low',
        dueDate: '2026-03-01',
        cost: 25000,
        category: 'Improvement'
    },
    {
        id: '3',
        title: 'Kaupa nýjan slökkvitæki',
        assignee: 'Þóra Magnúsdóttir',
        status: 'done',
        priority: 'high',
        cost: 4500,
        category: 'Safety'
    },
    {
        id: '4',
        title: 'Hreinsa rennur',
        assignee: '',
        status: 'todo',
        priority: 'high',
        dueDate: '2026-02-01',
        category: 'Maintenance'
    },
    {
        id: '5',
        title: 'Athuga hitakerfið',
        assignee: 'Ólafur Kristjánsson',
        status: 'todo',
        priority: 'medium',
        dueDate: '2026-01-30',
        category: 'Maintenance'
    },
];

export const INITIAL_SHOPPING: MockShoppingItem[] = [
    { id: '1', item: 'Baðpappír', checked: false, addedBy: 'Jón' },
    { id: '2', item: 'Uppþvottasápa', checked: false, addedBy: 'Guðrún' },
    { id: '3', item: 'Rafhlöður (AA)', checked: true, addedBy: 'Þóra' },
    { id: '4', item: 'Kaffibaunir', checked: false, addedBy: 'Jón' },
    { id: '5', item: 'Saltfiskur', checked: true, addedBy: 'Ólafur' },
];
