import express, { Request, Response } from 'express';
import {
  listGames,
  updateGame,
  getGame,
  createGame,
} from './games.js';
import {
  createTeam,
  deleteTeam,
  getTeam,
  listTeams,
  updateTeam,
} from './teams.js';

export const router = express.Router();

export async function index(req: Request, res: Response) {
  return res.json([
    {
      href: '/teams',
      methods: ['GET', 'POST'],
    },
    {
      href: '/teams/:slug',
      methods: ['GET', 'PATCH', 'DELETE'],
    },
    {
      href: '/teams/:slug/games',
      methods: ['GET', 'POST'],
    },
    {
      href: '/teams/:slug/games/:date',
      methods: ['GET', 'PATCH', 'DELETE'],
    },
  ]);
}

// Teams
router.get('/', index);
router.get('/teams', listTeams);
router.post('/teams', createTeam);
router.get('/teams/:slug', getTeam);
router.patch('/teams/:slug', updateTeam);
router.delete('/teams/:slug', deleteTeam);

// Games
router.get('/games', listGames);
router.get('/games/:date', getGame);
router.post('/games', createGame);
router.patch('/games/:date', updateGame);