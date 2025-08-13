import axios from "axios";
import * as OTPAuth from "otpauth";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

dotenv.config();

const SP_DC = process.env.SP_DC;
const SECRETS_URL = "https://raw.githubusercontent.com/Thereallo1026/spotify-secrets/refs/heads/main/secrets/secretDict.json";
const LOCAL_SECRETS_FILE = "/tmp/spotify_secrets.json";

// Global variables to store the current TOTP configuration
let currentTotp = null;
let currentTotpVersion = null;
let lastFetchTime = 0;
const FETCH_INTERVAL = 60 * 60 * 1000; // 1 hour

// Initialize TOTP secrets on startup
initializeTOTPSecrets();

// Set up periodic updates
setInterval(updateTOTPSecrets, FETCH_INTERVAL);

async function initializeTOTPSecrets() {
  try {
    // First try to load from local file
    const localSecrets = await loadSecretsFromFile();
    if (localSecrets) {
      console.log('Loaded TOTP secrets from local file');
      const newestVersion = findNewestVersion(localSecrets.secrets);
      if (newestVersion) {
        const secretData = localSecrets.secrets[newestVersion];
        const totpSecret = createTotpSecret(secretData);
        
        currentTotp = new OTPAuth.TOTP({
          period: 30,
          digits: 6,
          algorithm: "SHA1",
          secret: totpSecret
        });
        
        currentTotpVersion = newestVersion;
        lastFetchTime = localSecrets.fetchTime || 0;
        console.log(`Using local TOTP secrets version ${newestVersion}`);
      }
    }
    
    // Then try to update from remote
    await updateTOTPSecrets();
  } catch (error) {
    console.error('Failed to initialize TOTP secrets:', error);
    // Fallback to the original hardcoded secret
    useFallbackSecret();
  }
}

async function loadSecretsFromFile() {
  try {
    const fileContent = await fs.readFile(LOCAL_SECRETS_FILE, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Check if the file is not too old (more than 24 hours)
    const now = Date.now();
    if (data.fetchTime && (now - data.fetchTime) > (24 * 60 * 60 * 1000)) {
      console.log('Local secrets file is too old, will fetch fresh data');
      return null;
    }
    
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No local secrets file found');
    } else {
      console.error('Error reading local secrets file:', error.message);
    }
    return null;
  }
}

async function saveSecretsToFile(secrets) {
  try {
    const data = {
      secrets: secrets,
      fetchTime: Date.now(),
      version: findNewestVersion(secrets)
    };
    
    await fs.writeFile(LOCAL_SECRETS_FILE, JSON.stringify(data, null, 2), 'utf8');
    
    await fs.chmod(LOCAL_SECRETS_FILE, 0o600);
    
    console.log(`Secrets saved to ${LOCAL_SECRETS_FILE}`);
  } catch (error) {
    console.error('Failed to save secrets to file:', error.message);
  }
}

async function updateTOTPSecrets() {
  try {
    const now = Date.now();
    if (now - lastFetchTime < FETCH_INTERVAL) {
      return;
    }

    console.log('Fetching updated TOTP secrets...');
    const secrets = await fetchSecretsFromGitHub();
    const newestVersion = findNewestVersion(secrets);
    
    if (newestVersion && newestVersion !== currentTotpVersion) {
      const secretData = secrets[newestVersion];
      const totpSecret = createTotpSecret(secretData);
      
      currentTotp = new OTPAuth.TOTP({
        period: 30,
        digits: 6,
        algorithm: "SHA1",
        secret: totpSecret
      });
      
      currentTotpVersion = newestVersion;
      lastFetchTime = now;
      
      // Save the new secrets to local file
      await saveSecretsToFile(secrets);
      
      console.log(`TOTP secrets updated to version ${newestVersion}`);
    } else {
      console.log(`No new TOTP secrets found, using version ${newestVersion}`);
      
      // Save to file even if no new version (to update fetchTime)
      if (secrets) {
        await saveSecretsToFile(secrets);
      }
    }
  } catch (error) {
    console.error('Failed to update TOTP secrets:', error);
    // Keep using current TOTP if available, otherwise use fallback
    if (!currentTotp) {
      useFallbackSecret();
    }
  }
}

async function fetchSecretsFromGitHub() {
  try {
    const response = await axios.get(SECRETS_URL, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch secrets from GitHub:', error.message);
    throw error;
  }
}

function findNewestVersion(secrets) {
  const versions = Object.keys(secrets).map(Number);
  return Math.max(...versions).toString();
}

function createTotpSecret(data) {
  const mappedData = data.map((value, index) => value ^ ((index % 33) + 9));
  const hexData = Buffer.from(mappedData.join(""), "utf8").toString("hex");
  return OTPAuth.Secret.fromHex(hexData);
}

function useFallbackSecret() {
  // Fallback to the original hardcoded secret
  // This secret will most likely fail because Spotify is rotating the secrets every couple of days
  // This is really just kept in here for reference
  const fallbackData = [99, 111, 47, 88, 49, 56, 118, 65, 52, 67, 50, 104, 117, 101, 55, 94, 95, 75, 94, 49, 69, 36, 85, 64, 74, 60];
  const totpSecret = createTotpSecret(fallbackData);
  
  currentTotp = new OTPAuth.TOTP({
    period: 30,
    digits: 6,
    algorithm: "SHA1",
    secret: totpSecret
  });
  
  currentTotpVersion = "19"; // Fallback version
  console.log('Using fallback TOTP secret');
}

export async function getToken(reason = "init", productType = "mobile-web-player") {
  // Ensure we have a TOTP instance
  if (!currentTotp) {
    await initializeTOTPSecrets();
  }

  const payload = await generateAuthPayload(reason, productType);

  const url = new URL("https://open.spotify.com/api/token");
  Object.entries(payload).forEach(([key, value]) => url.searchParams.append(key, value));

  const response = await axios.get(url.toString(), {
    headers: {
      'User-Agent': userAgent(),
      'Origin': 'https://open.spotify.com/',
      'Referer': 'https://open.spotify.com/',
      'Cookie': `sp_dc=${SP_DC}`,
    },
  });

  return response.data?.accessToken;
}

async function generateAuthPayload(reason, productType) {
  const localTime = Date.now();
  const serverTime = await getServerTime();

  return {
    reason,
    productType,
    totp: generateTOTP(localTime),
    totpVer: currentTotpVersion || "19",
    totpServer: generateTOTP(Math.floor(serverTime / 30))
  };
}

async function getServerTime() {
  try {
    const { data } = await axios.get("https://open.spotify.com/api/server-time", {
      headers: {
        'User-Agent': userAgent(),
        'Origin': 'https://open.spotify.com/',
        'Referer': 'https://open.spotify.com/',
        'Cookie': `sp_dc=${SP_DC}`,
      },
    });

    const time = Number(data.serverTime);
    if (isNaN(time)) throw new Error("Invalid server time");
    return time * 1000;
  } catch {
    return Date.now();
  }
}

function generateTOTP(timestamp) {
  if (!currentTotp) {
    throw new Error("TOTP not initialized");
  }
  return currentTotp.generate({ timestamp });
}

function userAgent() {
  return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";
}

export async function clearLocalSecrets() {
  try {
    await fs.unlink(LOCAL_SECRETS_FILE);
    console.log('Local secrets file cleared');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error clearing local secrets file:', error.message);
    }
  }
}