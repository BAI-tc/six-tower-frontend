
const RAWG_API_KEY = '6ca8bd255e02417fb90ce0b97c72a035';
const steamAppId = '730';
const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&steam_appids=${steamAppId}`;

async function check() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    const game = data.results[0];
    const steamStore = game.stores.find(s => s.store.id === 1);
    console.log('Keys of steamStore:', Object.keys(steamStore));
    console.log('steamStore content:', JSON.stringify(steamStore, null, 2));
  } catch (err) { console.log(err.message); }
}
check();
