import {
  Game,
  GameDb,
  Team,
} from '../types.js';
import { getTeamBySlug,getTeamSlugById } from './db.js';

// Directly use Team for mapping without TeamDb
export function teamMapper(potentialTeam: Partial<Team>): Team | null {
  if (!potentialTeam.name || !potentialTeam.slug) {
    return null;
  }

  const mapped: Team = {
    id: potentialTeam.id ?? -1,
    name: potentialTeam.name,
    slug: potentialTeam.slug,
    description: potentialTeam.description ?? undefined,
  };

  return mapped;
}

export function teamsMapper(potentialTeams: Partial<Team>[]): Team[] {
  return potentialTeams.map(teamMapper).filter((team): team is Team => team !== null);
}

export async function gameMapper(game: GameDb, homeTeamSlug: string, awayTeamSlug: string): Promise<Game | null> {
  if (!game) {
    return null;
  }

  const homeTeam = await getTeamBySlug(homeTeamSlug);
  const awayTeam = await getTeamBySlug(awayTeamSlug);

  if (!homeTeam || !awayTeam) {
    return null;
  }

  const mapped: Game = {
    date: new Date(game.date),
    homeTeam,
    awayTeam,
    homeScore: game.home_score,
    awayScore: game.away_score,
  };

  return mapped;
}




export async function gamesMapper(potentialGames: GameDb[]): Promise<Game[]> {
  // Use Promise.all to wait for all gameMapper promises to resolve
  const games = await Promise.all(potentialGames.map(async (game) => {
    const homeTeamSlug = await getTeamSlugById(game.home);
    const awayTeamSlug = await getTeamSlugById(game.away);
    
    if (homeTeamSlug === null || awayTeamSlug === null) {
      return null;
    }
    
    return gameMapper(game, homeTeamSlug, awayTeamSlug);
  }));


  // Filter out any null values that may have resulted from gameMapper returning null
  return games.filter((game): game is Game => game !== null);
}


