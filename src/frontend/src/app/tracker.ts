import { Condition } from './condition';

export interface Tracker {
    _id: string;
    conditionsPositive: Condition[];
    conditionsNegative: Condition[];
    name: string;
    priceSelector: string;
    rateLimit: number;
}
