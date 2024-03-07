import { NextFunction, Request, Response } from 'express';
import slugify from 'slugify';
import {
  conditionalUpdate,
  deleteTeamBySlug,
  getTeamBySlug,
  getTeams,
  insertTeam,
} from '../lib/db.js';
import { teamMapper } from '../lib/mappers.js';
import {
  atLeastOneBodyValueValidator,
  teamDoesNotExistValidator,
  genericSanitizer,
  stringValidator,
  validationCheck,
  xssSanitizer,
} from '../lib/validation.js';
import { Team } from '../types.js';

export async function listTeams(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const teams = await getTeams();

  if (!teams) {
    return next(new Error('unable to get teams'));
  }

  return res.json(teams);
}

export async function getTeam(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { slug } = req.params;

  const team = await getTeamBySlug(slug);

  if (!team) {
    return next();
  }

  return res.json(team);
}

export async function createTeamHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { name, description } = req.body;

  const teamToCreate: Omit<Team, 'id'> = {
    name,
    slug: slugify(name),
    description
  };

  const createdTeam = await insertTeam(teamToCreate, false);

  if (!createdTeam) {
    return next(new Error('unable to create team'));
  }

  return res.status(201).json(createdTeam);
}

export const createTeam = [
  stringValidator({ field: 'name', maxLength:128, minLength:3 }),
  stringValidator({
    field: 'description',
    valueRequired: false,
    maxLength: 1024,
  }),
  teamDoesNotExistValidator,
  xssSanitizer('title'),
  xssSanitizer('description'),
  validationCheck,
  genericSanitizer('title'),
  genericSanitizer('description'),
  createTeamHandler,
];

export const updateTeam = [
  stringValidator({ field: 'name', maxLength: 64, optional: false }),
  stringValidator({
    field: 'description',
    valueRequired: false,
    maxLength: 1024,
    optional: true,
  }),
  atLeastOneBodyValueValidator(['title', 'description']),
  xssSanitizer('title'),
  xssSanitizer('description'),
  validationCheck,
  updateTeamHandler,
];

export async function updateTeamHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { slug } = req.params;
  const team = await getTeamBySlug(slug);

  if (!team) {
    return next();
  }

  const { name, description } = req.body;

  const fields = [
    typeof name === 'string' && name ? 'name' : null,
    typeof name === 'string' && name ? 'slug' : null,
    typeof description === 'string' && description ? 'description' : null,
  ];

  const values = [
    typeof name === 'string' && name ? name : null,
    typeof name === 'string' && name ? slugify(name).toLowerCase() : null,
    typeof description === 'string' && description ? description : null,
  ];

const updated = await conditionalUpdate(
    'teams',
    Number(team.name),
    fields,
    values,
);

if (!updated) {
    return next(new Error('unable to update department'));
}

  const updatedTeam = teamMapper(updated.rows[0]);
  return res.json(updatedTeam);
}

export async function deleteTeam(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { slug } = req.params;
  const department = await getTeamBySlug(slug);

  if (!department) {
    return next();
  }

  const result = await deleteTeamBySlug(slug);

  if (!result) {
    return next(new Error('unable to delete department'));
  }

  return res.status(204).json({});
}