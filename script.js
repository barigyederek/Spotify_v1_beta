// Spotify API credentials (from your Spotify Developer Dashboard)
const CLIENT_ID = '42eb51d7405d4868be4d5c84f2cf7a11';
const CLIENT_SECRET = '753df2754a9c4e7fa6614ab4c399897f'; // ⚠️ Never expose this in production!
const REDIRECT_URI = "https://barigyederek.github.io/Spotify_v1_beta"; // GitHub Pages URL

// LocalStorage keys
const ACCESS_TOKEN_KEY = 'spotify_access_token';
const REFRESH_TOKEN_KEY = 'spotify_refresh_token';

// DOM Elements
const loginBtn = document.getElementById('login-btn');
const playlistsTable = document.getElementById('playlists-table');

// 1. Check for tokens in URL (after Spotify redirect)
const params = new URLSearchParams(window.location.hash.substring(1));
const accessToken = params.get('access_token');
const storedRefreshToken = params.get('refresh_token');

if (accessToken) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (storedRefreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, storedRefreshToken);
  window.history.replaceState({}, document.title, window.location.pathname); // Clean URL
}

// 2. Login with Spotify
loginBtn.addEventListener('click', () => {
  const scopes = 'playlist-read-private';
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scopes}`;
  window.location.href = authUrl;
});

// 3. Fetch Playlists (Auto-refreshes token if expired)
async function fetchPlaylists() {
  let token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) return alert('Please log in first!');

  try {
    // Fetch playlists
    const response = await fetch('https://api.spotify.com/v1/me/playlists', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // If token expired, refresh it and retry
    if (response.status === 401) {
      await refreshToken();
      return fetchPlaylists(); // Retry
    }

    const data = await response.json();
    displayPlaylists(data.items);
  } catch (error) {
    console.error('Error:', error);
  }
}

// 4. Refresh Token
async function refreshToken() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return alert('Session expired. Please log in again.');

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    const data = await response.json();
    localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
    if (data.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
  } catch (error) {
    console.error('Token refresh failed:', error);
  }
}

// 5. Display Playlists in Three Columns + Track Loading
async function displayPlaylists(playlists) {
    const playlistsList = document.getElementById('playlists-list');
    const trackCounts = document.getElementById('track-counts');
    
    playlistsList.innerHTML = '';
    trackCounts.innerHTML = '';
  
    playlists.forEach(playlist => {
      // Playlist column
      const playlistItem = document.createElement('div');
      playlistItem.className = 'playlist-item';
      playlistItem.textContent = playlist.name;
      playlistItem.addEventListener('click', () => loadPlaylistTracks(playlist));
      playlistsList.appendChild(playlistItem);
  
      // Track count column
      const trackCountItem = document.createElement('div');
      trackCountItem.className = 'track-item';
      trackCountItem.textContent = playlist.tracks.total;
      trackCounts.appendChild(trackCountItem);
    });
  }
  
  // 6. Load Tracks for Selected Playlist
  async function loadPlaylistTracks(playlist) {
    const songsList = document.getElementById('songs-list');
    const playlistName = document.getElementById('current-playlist-name');
    
    playlistName.textContent = playlist.name;
    songsList.innerHTML = '<div class="loading">Loading tracks...</div>';
  
    try {
      const response = await fetch(playlist.tracks.href, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('spotify_access_token')}` }
      });
      const data = await response.json();
      
      songsList.innerHTML = '';
      data.items.forEach(item => {
        const trackItem = document.createElement('div');
        trackItem.className = 'track-item';
        trackItem.innerHTML = `
          <span class="track-name">${item.track.name}</span>
          <span class="track-artist">${item.track.artists.map(a => a.name).join(', ')}</span>
        `;
        songsList.appendChild(trackItem);
      });
    } catch (error) {
      songsList.innerHTML = '<div class="error">Failed to load tracks</div>';
    }
  }

// Auto-fetch playlists if already logged in
if (localStorage.getItem(ACCESS_TOKEN_KEY)) {
  loginBtn.textContent = 'Refresh Playlists';
  fetchPlaylists();
}