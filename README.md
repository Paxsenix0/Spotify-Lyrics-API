# Spotify Lyrics API

Unofficial API to fetch Spotify **Lyrics data**.  

> [!WARNING]  
> This project uses undocumented endpoints and may violate [Spotify's Terms of Service](https://www.spotify.com/legal/end-user-agreement/). Use at your own risk.

---

## Features

- Retrieve **Lyrics data** by track ID or URI
- Parses responses from the internal Spotify API by 2 format into `lrc` or `srt`.
- Works with public or private tracks (as long as you're authenticated)

---

## Example Request

### GET `/api/lyrics`

```bash
https://localhost:3000/api/lyrics?url=https://open.spotify.com/track/4Q0qVhFQa7j6jRKzo3HDmP&format=lrc
```

### Response:
```json
{
  "syncType": "LINE_SYNCED",
  "lines": [
    {
      "timeTag": "00:00.48",
      "words": "You're glowing, you colour and fracture the light"
    },
    {
      "timeTag": "00:06.51",
      "words": "You can't help but shine"
    },
    ....
  ]
}
```

---

## Setup

### 1. Clone the Repo

```bash
git clone https://github.com/Paxsenix0/Spotify-Lyrics-API.git
cd Spotify-Lyrics-API
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Required Environment Variable

You must supply your sp_dc cookie from a logged-in Spotify session.

Create a .env file in the root:

```bash
SP_DC=your_sp_dc_cookie_here
```

> This cookie is used to generate an access token to authenticate requests.

---

## Deployment

You can deploy instantly with Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FPaxsenix0%2FSpotify-Lyrics-API%2Ftree%2Fmain&project-name=Spotify-Lyrics-API&repository-name=Spotify-Lyrics-API&env=SP_DC&envDescription=SP_DC%20is%20needed%20for%20this%20for%20authentication%20to%20be%20working%20fine&envLink=https%3A%2F%2Fwww.spotify.com%2F&redirect-url=https%3A%2F%2Fgithub.com%2FPaxsenix0%2FSpotify-Lyrics-API)

---

## Notes

> I'm developing this project entirely on my phone, without a PC or laptop. Also, I'm still learning — so feel free to send pull requests or suggestions if something looks off!

---

## Reference

Shoutout to this helpful repo that inspired parts of this:
https://github.com/akashrchandran/spotify-lyrics-api

---

## License

This project is licensed under the MIT license. see [LICENSE](https://github.com/Paxsenix0/Spotify-Lyrics-API/blob/initial/LICENSE) for details.

---

## Contact

Telegram: [@paxsenix0](https://t.me/paxsenix0)

Email: alex24dzn@proton.me

My Rest-API website: https://api.paxsenix.biz.id

---