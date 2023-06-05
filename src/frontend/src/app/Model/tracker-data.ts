import { Tracker } from './tracker';

export interface TrackerData {
    _id: string;
    url: string;
    stocked: boolean;
    lastStocked: Date;
    lastPrice: number;
    tracker: Tracker;
}
