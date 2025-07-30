import express from 'express';
import { fetchLyrics } from '../controllers/lyricsController.js';

const router = express.Router();

router.get('/', fetchLyrics);

export default router;