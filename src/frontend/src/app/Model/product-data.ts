
import { TrackerData } from './tracker-data';

export interface ProductData {
    _id: string;
    name: string;
    priority: number;
    activeTrackers: TrackerData[];
}
