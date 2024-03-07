import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import passportJWT from 'passport-jwt';
import { cors } from './lib/cors.js';
import { router } from './routes/api.js';
import { JwtPayload } from 'jsonwebtoken';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors);

// Initialize Passport.js
app.use(passport.initialize());

// Configure JWT Strategy
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET ?? '' // Replace with your own JWT secret
  },
  (jwtPayload: JwtPayload, done: passportJWT.VerifiedCallback) => {
    // Check if the user exists in your database based on jwtPayload.sub
    // Example: User.findById(jwtPayload.sub, (err, user) => {...})
    // If user found, call done(null, user), otherwise call done(null, false)
  }
));

// Route for generating and returning JWT token (e.g., login endpoint)
app.post('/login', (req, res) => {
  // Authenticate user (e.g., verify credentials)
  // If authenticated, generate JWT token and send it back
  // Example: jwt.sign({ sub: user.id }, process.env.JWT_SECRET, (err, token) => {...})
});

// Protected route example
app.use('/protected', passport.authenticate('jwt', { session: false }), router);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'not found' });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (
    err instanceof SyntaxError &&
    'status' in err &&
    err.status === 400 &&
    'body' in err
  ) {
    return res.status(400).json({ error: 'invalid json' });
  }

  console.error('error handling route', err);
  return res
    .status(500)
    .json({ error: err.message ?? 'internal server error' });
});
