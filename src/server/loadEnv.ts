import dotenv from 'dotenv';

// Imported first in server.ts so .env values exist before other modules read process.env at load time
dotenv.config({ quiet: true });
