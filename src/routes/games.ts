import { NextFunction, Request, Response } from 'express';
import { body } from 'express-validator';
import {
    conditionalUpdate,
    getTeamBySlug,
    insertGame,
    getGameById,
    getGames,
    getTeamSlugById,
} from '../lib/db.js';
import { gameMapper } from '../lib/mappers.js';
import {
    atLeastOneBodyValueValidator,
    gameDoesNotExistValidator,
    genericSanitizerMany,
    stringValidator,
    dateValidator,
    validationCheck,
    xssSanitizerMany,
} from '../lib/validation.js';
import { Game,GameDb } from '../types.js';
import { create } from 'ts-node';

export async function listGames(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        // Fetch all games
        const games = await getGames();
    
        // If there's an issue fetching games (e.g., games is null), proceed to the next middleware with an error
        if (!games) {
            return next(new Error('Unable to retrieve games'));
        }
    
        // Respond with the list of games
        return res.json(games);
    } catch (error) {
        // Handle any unexpected errors
        console.error('Failed to list games:', error);
        return next(error);
    }
}


export async function getGame(
    req: Request,
    res: Response,
    next: NextFunction,
    ) {
    // Assuming the game's unique ID is passed as a URL parameter named 'gameId'
    const { gameId } = req.params;

    // Fetch the game by its ID
     const game = await getGameById(Number(gameId));

    // If the game is not found, proceed to the next middleware (possibly a 404 handler)
    if (!game) {
            return next();
    }

    // Respond with the game details
    return res.json(game);
}
    

export async function createGameHandler(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const { date, home, away, homeScore, awayScore } = req.body;

    const homeSlug = await getTeamSlugById(home);
    const awaySlug = await getTeamSlugById(away);
    const homeTeam = homeSlug ? await getTeamBySlug(homeSlug) : null;
    const awayTeam = awaySlug ? await getTeamBySlug(awaySlug) : null;

    // Ensure both teams exist before proceeding
    if (!homeTeam || !awayTeam) {
        return next(new Error('One or both teams not found'));
    }

    // Now that we have full team details, create the game object to insert
    const gameToCreate: Omit<Game, 'id'> = {
        date: new Date(date), // Ensure the date is a Date object
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
    };

    // Call insertGame with the structured game object
    const createdGame = await insertGame(gameToCreate);

    if (!createdGame) {
        return next(new Error('Unable to create game'));
    }

    // Assuming insertGame returns a Game object, you can directly return it
    return res.json(createdGame);
}




const gameFields = ['date', 'homeTeam', 'awayTeam', 'homeScore', 'awayScore'];

export const createGame = [
    dateValidator({ field: 'date' }),
    stringValidator({ field: 'homeTeam', maxLength: 64,minLength: 3}),
    stringValidator({ field: 'awayTeam', maxLength: 64,minLength: 3}),
    body('homeScore')
        .isInt({ min: 0, max: 99 })
        .withMessage('stig þurfa að vera á milli 0 og 99'),
    body('awayScore')
        .isInt({ min: 0, max: 99 })
        .withMessage('stig þurfa að vera á milli 0 og 99'),
    gameDoesNotExistValidator,
    xssSanitizerMany(gameFields),
    validationCheck,
    genericSanitizerMany(gameFields),
    createGameHandler,
].flat();

export const updateGame = [
    dateValidator({ field: 'date' }),
    stringValidator({ field: 'homeTeam', maxLength: 64,minLength: 3}),
    stringValidator({ field: 'awayTeam', maxLength: 64,minLength: 3}),
    body('homeScore')
        .isInt({ min: 0, max: 99 })
        .withMessage('stig þurfa að vera á milli 0 og 99'),
    body('awayScore')
        .isInt({ min: 0, max: 99 })
        .withMessage('stig þurfa að vera á milli 0 og 99'),
    gameDoesNotExistValidator,
    xssSanitizerMany(gameFields),
    validationCheck,
    genericSanitizerMany(gameFields),
    updateGameHandler,
].flat();

export async function updateGameHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Extract the game's unique ID from the request parameters
    const { gameId } = req.params;
  
    // Extract game details from the request body
    const { date, homeTeamId, awayTeamId, homeScore, awayScore } = req.body;
  
    // Prepare the fields and values for the conditional update
    const fields: Array<string | null> = [];
    const values: Array<string | number | null> = [];
  
    if (date) {
      fields.push('date');
      values.push(date);
    }
    if (homeTeamId) {
      fields.push('home');
      values.push(homeTeamId);
    }
    if (awayTeamId) {
      fields.push('away');
      values.push(awayTeamId);
    }
    if (homeScore !== undefined) {
      fields.push('home_score');
      values.push(homeScore);
    }
    if (awayScore !== undefined) {
      fields.push('away_score');
      values.push(awayScore);
    }
  
    // Perform the conditional update
    const result = await conditionalUpdate('games', Number(gameId), fields, values);
  
    if (!result) {
      return next(new Error('Unable to update game'));
    }
  
    // Return the updated game
    return res.json(result.rows[0]);
}
