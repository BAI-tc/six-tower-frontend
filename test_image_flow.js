async function testFlow() {
  const BASE_URL = 'http://localhost:9953/api/v1';
  
  console.log('--- Testing Popular Recommendations ---');
  try {
    const res = await fetch(`${BASE_URL}/recommendations/popular?limit=5`);
    const data = await res.json();
    const games = data.games || [];
    console.log(`Received ${games.length} games.`);
    
    games.forEach(g => {
      console.log(`Game: ${g.title} (${g.appid})`);
      console.log(`Image: ${g.background_image}`);
      const isRawg = g.background_image && g.background_image.includes('rawg.io');
      const isSteam = g.background_image && g.background_image.includes('steamcdn');
      console.log(`Type: ${isRawg ? '✅ RAWG' : isSteam ? '⚠️ Steam (Needs Enrichment)' : '❌ Unknown'}`);
    });
  } catch (err) {
    console.error('Error fetching popular games:', err.message);
  }

  console.log('\n--- Testing RAWG Proxy ---');
  try {
    const proxyUrl = `${BASE_URL}/rawg/games?search=Cyberpunk%202077&page_size=1`;
    console.log(`Fetching proxy: ${proxyUrl}`);
    const res = await fetch(proxyUrl);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      console.log('Proxy OK. Game found:', data.results[0].name);
      console.log('RAWG Image URL:', data.results[0].background_image);
    } else {
      console.log('Proxy OK but no results found.');
    }
  } catch (err) {
    console.error('Error with RAWG proxy:', err.message);
  }
}

testFlow();
