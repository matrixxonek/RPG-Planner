export interface EventApi {
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

export interface TaskApi{
    id: string;
    title: string;
    start: string;
    cycle?: boolean;
}

export interface CalendarTask{
    id: string;
    title: string;
    start: Date;
    cycle?: boolean;
}