export function formatMS(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const centiseconds = Math.floor((milliseconds % 1000) / 10);
  return `${pad(minutes)}:${pad(remainingSeconds)}.${pad(centiseconds, 2)}`;
}

export function formatSRT(milliseconds) {
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const ms = milliseconds % 1000;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(ms, 3)}`;
}

export function pad(num, size = 2) {
  return num.toString().padStart(size, '0');
}

export function getLrcLyrics(lyrics) {
  return lyrics.map(line => ({
    timeTag: formatMS(parseInt(line.startTimeMs, 10)),
    words: line.words
  }));
}

export function getSrtLyrics(lyrics) {
  const srt = [];
  for (let i = 1; i < lyrics.length; i++) {
    srt.push({
      index: i,
      startTime: formatSRT(parseInt(lyrics[i - 1].startTimeMs, 10)),
      endTime: formatSRT(parseInt(lyrics[i].startTimeMs, 10)),
      words: lyrics[i - 1].words
    });
  }
  return srt;
}