import express from 'express';
import axios from 'axios';
import lyricsRoutes from './routes/lyricsRoutes.js';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/lyrics', lyricsRoutes);

app.listen(PORT, function () {
    console.log("Listening on PORT: ", PORT);
    if (PORT == 3000) { 
      console.log('Running on local: http://localhost:3000');
    }
});