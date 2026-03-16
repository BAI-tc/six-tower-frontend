
const RAWG_API_KEY = '49c56ac48faa4766a9f6a2fc0e24c97f';
const gameTitle = 'Dark Souls III';
const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(gameTitle)}&page_size=1`;

async function findImage() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      console.log('Found RAWG image for Dark Souls III:', data.results[0].background_image);
    } else {
      console.log('No results found for Dark Souls III');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

findImage();
