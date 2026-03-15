
const RAWG_API_KEY = '49c56ac48faa4766a9f6a2fc0e24c97f';
const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=Dark Souls 3&page_size=5`;

async function findImage() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Results:', JSON.stringify(data.results ? data.results.map(r => ({name: r.name, image: r.background_image})) : data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

findImage();
