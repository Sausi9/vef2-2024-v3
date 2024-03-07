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
        
        const games = await getGames();
    
       
        if (!games) {
            return next(new Error('Unable to retrieve games'));
        }
    
        
        return res.json(games);
    } catch (error) {
        
        console.error('Failed to list games:', error);
        return next(error);
    }
}


export async function getGame(
    req: Request,
    res: Response,
    next: NextFunction,
    ) {
    
    const { gameId } = req.params;

    
     const game = await getGameById(Number(gameId));

    
    if (!game) {
            return next();
    }

    
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

    
    if (!homeTeam || !awayTeam) {
        return next(new Error('One or both teams not found'));
    }

    
    const gameToCreate: Omit<Game, 'id'> = {
        date: new Date(date), 
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
    };

    
    const createdGame = await insertGame(gameToCreate);

    if (!createdGame) {
        return next(new Error('Unable to create game'));
    }

    
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
    
    const { gameId } = req.params;
  
    
    const { date, homeTeamId, awayTeamId, homeScore, awayScore } = req.body;
  
    
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
  
    
    const result = await conditionalUpdate('games', Number(gameId), fields, values);
  
    if (!result) {
      return next(new Error('Unable to update game'));
    }
  
    
    return res.json(result.rows[0]);
}
