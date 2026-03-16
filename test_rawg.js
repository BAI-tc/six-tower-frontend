const RAWG_API_KEY = '9b3e6bbc879b4684ab490b2d5b2a115e';
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
