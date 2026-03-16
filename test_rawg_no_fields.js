
const RAWG_API_KEY = '6ca8bd255e02417fb90ce0b97c72a035';
const steamAppId = '730';
const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&steam_appids=${steamAppId}`;

async function check() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Keys without fields param:', Object.keys(data.results[0]));
    console.log('Does it have steam_appid?', 'steam_appid' in data.results[0]);
  } catch (err) { console.log(err.message); }
}
check();
