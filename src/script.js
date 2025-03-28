// Spotify Configuration
const SPOTIFY_CONFIG = {
  CLIENT_ID: '42eb51d7405d4868be4d5c84f2cf7a11', // My client ID
  REDIRECT_URI: window.location.hostname === "localhost" 
    ? "http://localhost:8000" 
    : "https://lucent-crepe-6000e1.netlify.app/", // Netlify URL
  SCOPES: 'playlist-read-private'
};

// DOM Elements
const elements = {
  loginBtn: document.getElementById('login-btn'),
  playlistsContainer: document.getElementById('playlists-and-counts'),
  songsList: document.getElementById('songs-list'),
  playlistName: document.getElementById('current-playlist-name'),
  loading: document.getElementById('loading'),
  errorMessage: document.getElementById('error-message'),
  columnsContainer: document.querySelector('.columns-container')
};

// Token Management
const TokenManager = {
  ACCESS_TOKEN_KEY: 'spotify_access_token',
  REFRESH_TOKEN_KEY: 'spotify_refresh_token',

  getAccessToken() {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  },

  storeTokens({ access_token, refresh_token }) {
    if (access_token) localStorage.setItem(this.ACCESS_TOKEN_KEY, access_token);
    if (refresh_token) localStorage.setItem(this.REFRESH_TOKEN_KEY, refresh_token);
  },

  clearTokens() {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  // Check for authorization code after Spotify redirect
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');

  if (code) {
    exchangeCodeForToken(code)
      .then(data => {
        TokenManager.storeTokens(data);
        window.history.replaceState({}, document.title, window.location.pathname);
        checkAuthStatus();
      })
      .catch(() => showError('Login failed. Please try again.'));
  } else {
    checkAuthStatus();
  }

  elements.loginBtn.addEventListener('click', handleLogin);
});

// Authentication Functions
async function handleLogin() {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CONFIG.CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(SPOTIFY_CONFIG.REDIRECT_URI)}&scope=${SPOTIFY_CONFIG.SCOPES}`;
  window.location.href = authUrl;
}

async function exchangeCodeForToken(code) {
  showLoading(true);
  try {
    const response = await fetch('/.netlify/functions/spotify-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    });

    if (!response.ok) throw new Error('Token exchange failed');
    return await response.json();
  } finally {
    showLoading(false);
  }
}

function checkAuthStatus() {
  if (TokenManager.getAccessToken()) {
    elements.loginBtn.textContent = 'Refresh Playlists';
    showLoading(true);
    fetchPlaylists().finally(() => showLoading(false));
  }
}

// API Functions
async function fetchWithTokenRefresh(url, options = {}) {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${TokenManager.getAccessToken()}`
    }
  });

  if (response.status === 401) {
    await exchangeCodeForToken('refresh');
    response = await fetch(url, options);
  }

  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response;
}

// Playlist Functions
async function fetchPlaylists() {
  try {
    const response = await fetchWithTokenRefresh(`${SPOTIFY_CONFIG.API_BASE}/me/playlists`);
    const data = await response.json();
    displayPlaylists(data.items);
  } catch (error) {
    showError(error.message);
    console.error('Playlist fetch error:', error);
  }
}

function displayPlaylists(playlists) {
  elements.playlistsContainer.innerHTML = '';
  playlists.forEach((playlist, index) => {
    const row = document.createElement('div');
    row.className = 'playlist-row';
    row.innerHTML = `
      <div class="playlist-name">
        <span class="playlist-number">${index + 1}.</span>
        ${playlist.name}
      </div>
      <div class="track-count">${playlist.tracks.total}</div>
    `;
    row.addEventListener('click', () => loadPlaylistTracks(playlist));
    elements.playlistsContainer.appendChild(row);
  });
}

async function loadPlaylistTracks(playlist) {
  try {
    elements.playlistName.textContent = playlist.name;
    elements.songsList.innerHTML = '<div class="loading">Loading tracks...</div>';

    const response = await fetchWithTokenRefresh(playlist.tracks.href);
    const data = await response.json();

    elements.songsList.innerHTML = '';
    data.items.forEach(item => {
      if (item.track) { // Check if track exists
        const trackItem = document.createElement('div');
        trackItem.className = 'track-item';
        trackItem.innerHTML = `
          <span class="track-name">${item.track.name}</span>
          <span class="track-artist">${item.track.artists.map(a => a.name).join(', ')}</span>
        `;
        elements.songsList.appendChild(trackItem);
      }
    });
  } catch (error) {
    elements.songsList.innerHTML = '<div class="error">Failed to load tracks</div>';
    console.error('Track load error:', error);
  }
}

// UI Helpers
function showLoading(show) {
  elements.loading.style.display = show ? 'flex' : 'none';
  elements.columnsContainer.style.display = show ? 'none' : 'flex';
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.style.display = 'block';
  setTimeout(() => {
    elements.errorMessage.style.display = 'none';
  }, 5000);
}