export interface TaskApi {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay?: boolean;
}

export interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
}