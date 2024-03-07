export type Team = {
    id: number;
    name: string;
    slug: string;
    description: string | undefined;
}

export type Game = {
    date: Date;
    homeTeam: Team;
    awayTeam: Team;
    homeScore: number;
    awayScore: number;
}

export type GameDb = {
    id: number;
    date: Date;
    home: number;
    away: number;
    home_score: number;
    away_score: number;
};