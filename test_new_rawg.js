const RAWG_API_KEY = '49c56ac48faa4766a9f6a2fc0e24c97f';
const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&page_size=1`;

async function checkApi() {
  try {
    const response = await fetch(url);
    console.log('Status:', response.status);
    const data = await response.json();
    if (response.ok) {
      console.log('Success! Results count:', data.count);
    } else {
      console.log('Error Data:', JSON.stringify(data));
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

checkApi();
