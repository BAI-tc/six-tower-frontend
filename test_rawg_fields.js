
const RAWG_API_KEY = '6ca8bd255e02417fb90ce0b97c72a035';
const steamAppId = '730';
const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&steam_appids=${steamAppId}&fields=id,name,steam_appid,background_image`;

async function check() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Results with fields param:', JSON.stringify(data.results[0], null, 2));
  } catch (err) { console.log(err.message); }
}
check();
