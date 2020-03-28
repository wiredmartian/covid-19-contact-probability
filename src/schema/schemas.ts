export interface HistorySchema {
    country: string;
    cases: CasesSchema;
    deaths: DeathsSchema;
    day: Date;
    time: Date;
}
interface CasesSchema {
    new: string,
    active: number,
    critical: number,
    recovered: number,
    total: 1170
}
interface DeathsSchema {
    new: string;
    total: number;
}

export interface StatsSchema  extends HistorySchema {

}
