
const RAWG_API_KEY = '6ca8bd255e02417fb90ce0b97c72a035';
const steamAppId = '730';
const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&steam_appids=${steamAppId}`;

async function checkResponse() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      console.log('Keys:', Object.keys(data.results[0]));
      // Also check if any field contains 730
      for (const [key, value] of Object.entries(data.results[0])) {
          if (String(value).includes('730')) {
              console.log(`Field ${key} contains 730:`, value);
          }
      }
    } else {
      console.log('No results');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkResponse();
