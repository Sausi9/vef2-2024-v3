import pg from 'pg';
import { Team, Game } from '../types.js';
import {
  teamMapper,
  teamsMapper,
  gameMapper,
  gamesMapper,
} from './mappers.js';

//const env = environment(process.env, logger);

/*
if (!env?.connectionString) {
  process.exit(-1);
}

const { connectionString } = env;

*/

let savedPool: pg.Pool | undefined;

export function getPool(): pg.Pool {
  if (savedPool) {
    return savedPool;
  }

  const { DATABASE_URL: connectionString } = process.env;
  if (!connectionString) {
    console.error('vantar DATABASE_URL í .env');
    throw new Error('missing DATABASE_URL');
  }

  savedPool = new pg.Pool({ connectionString });

  savedPool.on('error', (err: Error) => {
    console.error('Villa í tengingu við gagnagrunn, forrit hættir', err);
    throw new Error('error in db connection');
  });

  return savedPool;
}

export async function query(
  q: string,
  values: Array<unknown> = [],
  silent = false,
) {
  const pool = getPool();

  let client;
  try {
    client = await pool.connect();
  } catch (e) {
    if (!silent) console.error('unable to get client from pool', e);
    return null;
  }

  try {
    const result = await client.query(q, values);
    return result;
  } catch (e) {
    if (!silent) console.error('unable to query', e);
    if (!silent) console.info(q, values);
    return null;
  } finally {
    client.release();
  }
}

export async function conditionalUpdate(
  table: 'teams' | 'games',
  id: number,
  fields: Array<string | null>,
  values: Array<string | number | null>,
) {
  const filteredFields = fields.filter((i) => typeof i === 'string');
  const filteredValues = values.filter(
    (i): i is string | number => typeof i === 'string' || typeof i === 'number',
  );

  if (filteredFields.length === 0) {
    return false;
  }

  if (filteredFields.length !== filteredValues.length) {
    throw new Error('fields and values must be of equal length');
  }

  // id is field = 1
  const updates = filteredFields.map((field, i) => `${field} = $${i + 2}`);

  const q = `
    UPDATE ${table}
      SET ${updates.join(', ')}
    WHERE
      id = $1
    RETURNING *
    `;

  const queryValues: Array<string | number> = (
    [id] as Array<string | number>
  ).concat(filteredValues);
  const result = await query(q, queryValues);

  return result;
}

export async function poolEnd() {
  const pool = getPool();
  await pool.end();
}

export async function getTeams(): Promise<Array<Team> | null> {
  const result = await query('SELECT * FROM teams');
  if (!result) {
    return null;
  }
  return result.rows.map(teamMapper).filter((team): team is Team => team !== null);
}


export async function getTeamBySlug(
  slug: string,
): Promise<Team | null> {
  const result = await query('SELECT * FROM teams WHERE slug = $1', [
    slug,
  ]);

  if (!result) {
    return null;
  }

  const team = teamMapper(result.rows[0]);

  return team;
}


export async function deleteTeamBySlug(slug: string): Promise<boolean> {
  const result = await query('DELETE FROM teams WHERE slug = $1', [slug]);

  if (!result) {
    return false;
  }

  return result.rowCount === 1;
}


export async function insertTeam(
  team: Omit<Team, 'id'>,
  silent = false,
): Promise<Team | null> {
  const {name, slug,description } = team;
  const result = await query(
    'INSERT INTO teams (name, slug) VALUES ($1, $2) RETURNING name, slug',
    [name, slug, description],
    silent,
  );

  const mapped = teamMapper(result?.rows[0]);

  return mapped;
}

export async function getGames(): Promise<Array<Team> | null> {
  const result = await query('SELECT * FROM games');
  if (!result) {
    return null;
  }
  return result.rows.map(teamMapper).filter((team): team is Team => team !== null);
}


export async function getGameById(gameId: number): Promise<Game | null> {
  const sql = `
    SELECT g.*, 
           h.name as home_team_name, h.slug as home_team_slug, h.description as home_team_description,
           a.name as away_team_name, a.slug as away_team_slug, a.description as away_team_description
    FROM games g
    JOIN teams h ON g.home = h.id
    JOIN teams a ON g.away = a.id
    WHERE g.id = $1
  `;

  const result = await query(sql, [gameId]);
  if (!result || result.rows.length === 0) {
    return null; // No game found with the given ID
  }

  const gameRow = result.rows[0];
  
  // Construct the Game object
  const game: Game = {
    date: new Date(gameRow.date),
    homeTeam: {
      id: gameRow.home_team_id, // Add the 'id' property
      name: gameRow.home_team_name,
      slug: gameRow.home_team_slug,
      description: gameRow.home_team_description,
    },
    awayTeam: {
      id: gameRow.away_team_id, // Add the 'id' property
      name: gameRow.away_team_name,
      slug: gameRow.away_team_slug,
      description: gameRow.away_team_description,
    },
    homeScore: gameRow.home_score,
    awayScore: gameRow.away_score,
  };

  return game;
}

export async function insertGame(
  game: Omit<Game, 'id'>,
  silent = false,
): Promise<Game | null> {
  const {date,homeTeam, awayTeam, homeScore, awayScore} = game;
  const result = await query(
    'INSERT INTO games (date, home, away, home_score, away_score) VALUES ($1, (SELECT id FROM teams WHERE name = $2), (SELECT id FROM teams WHERE name = $3), $4, $5) RETURNING *',
    [date, homeTeam, awayTeam, homeScore, awayScore],
    silent,
  );

  const mapped = gameMapper(result?.rows[0], homeTeam.slug, awayTeam.slug);

  return mapped;
}

export async function getTeamSlugById(teamId: number): Promise<string | null> {
  const result = await query('SELECT slug FROM teams WHERE id = $1', [teamId]);
  if (!result || result.rows.length === 0) {
    return null;
  }
  return result.rows[0].slug;
}