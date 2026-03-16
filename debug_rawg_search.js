
const RAWG_API_KEY = '6ca8bd255e02417fb90ce0b97c72a035';
const steamAppId = '730';
const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${steamAppId}&page_size=1`;

async function checkResponse() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      console.log('Search for 730:', data.results[0].name);
    } else {
      console.log('No results');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkResponse();
