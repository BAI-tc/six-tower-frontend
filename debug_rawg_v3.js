
const RAWG_API_KEY = '6ca8bd255e02417fb90ce0b97c72a035';
const steamAppId = '730';
const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&steam_appids=${steamAppId}`;

async function checkResponse() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const g = data.results[0];
      // Check for any field that might be steam_appid
      const keys = Object.keys(g);
      console.log('Result found. Searching for appId...');
      keys.forEach(k => {
          if (k.toLowerCase().includes('steam')) {
              console.log(`Found key: ${k} =`, g[k]);
          }
      });
    } else {
      console.log('No results');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkResponse();
