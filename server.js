const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Geocode endpoint (location search)
app.get('/api/geocode', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
      { headers: { 'User-Agent': 'FreeMap/1.0' } }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Geocoding failed' });
  }
});

// Route endpoint (directions between two points)
app.get('/api/route', async (req, res) => {
  const { start_lat, start_lng, end_lat, end_lng } = req.query;

  if (!start_lat || !start_lng || !end_lat || !end_lng) {
    return res.status(400).json({ error: 'Missing coordinates' });
  }

  try {
    // Use OSRM for free routing
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${start_lng},${start_lat};${end_lng},${end_lat}?overview=full&geometries=geojson`,
      { headers: { 'User-Agent': 'FreeMap/1.0' } }
    );
    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      res.json({
        distance: route.distance / 1000, // km
        duration: route.duration / 60, // minutes
        geometry: route.geometry
      });
    } else {
      res.status(400).json({ error: 'No route found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Routing failed' });
  }
});

app.listen(PORT, () => {
  console.log(`🗺️  FreeMap running on http://localhost:${PORT}`);
});
