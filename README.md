# Spotify Playlist Viewer

A sleek web application that connects to Spotify's API, allowing you to view and browse your personal playlists, explore tracks, and see detailed song information—all without leaving your browser.

## Features

- 🔐 **Secure OAuth Authentication** with Spotify
- 📋 **View all your playlists** with track counts
- 🎵 **Browse playlist tracks** showing song names, artists, and durations
- 🔄 **Automatic token refresh** for seamless extended sessions
- 📱 **Fully responsive design** that works on desktop and mobile
- ⚡ **Pagination support** for large playlists (50+ tracks)
- 🎨 **Clean, Spotify-inspired UI**

## Demo

Live demo available at: [https://lucent-crepe-6000e1.netlify.app/](https://lucent-crepe-6000e1.netlify.app/)

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Authentication**: Spotify OAuth 2.0 (Authorization Code Flow)
- **Backend**: Netlify Functions (Serverless)
- **API**: Spotify Web API
- **Icons**: Font Awesome

## Installation

### Prerequisites

- A [Spotify Developer](https://developer.spotify.com/dashboard/) account
- A Spotify App with Client ID
- Netlify account (for serverless functions)

### Local Development Setup

1. **Clone the repository**

git clone https://github.com/barigyederek/spotify-playlist-viewer.git
cd spotify-playlist-viewer
Create a Spotify App

Go to Spotify Developer Dashboard

Click "Create App"

Set Redirect URIs:

http://localhost:8000 (for local development)

https://your-netlify-app.netlify.app/ (for production)

Configure Environment Variables

Create a .env file in the root directory:

env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
Install Netlify CLI (for local serverless functions)

bash
npm install -g netlify-cli
Run Locally

bash
netlify dev
The app will be available at http://localhost:8000

Project Structure
text
spotify-playlist-viewer/
├── index.html              # Main application page
├── script.js              # Frontend JavaScript logic
├── styles.css             # Styling and responsive design
├── netlify/
│   └── functions/
│       └── spotify-auth.js # Serverless auth handler
├── .env                   # Environment variables (local)
└── netlify.toml          # Netlify configuration
API Features Used
Get Current User's Playlists - Lists all playlists with pagination

Get Playlist Tracks - Retrieves tracks from selected playlist

OAuth Authorization Code Flow - Secure user authentication

Authentication Flow
User clicks "Login with Spotify"

Redirect to Spotify authorization page

User grants permission

Spotify redirects back with authorization code

Netlify function exchanges code for access/refresh tokens

Tokens stored securely in localStorage

App fetches user's playlists

Deployment to Netlify
Push code to GitHub

bash
git add .
git commit -m "Initial commit"
git push origin main
Connect to Netlify

Go to Netlify

Click "New site from Git"

Select GitHub and your repository

Configure build settings (no build command needed)

Add Environment Variables in Netlify

Site settings → Environment variables

Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET

Update Spotify App Redirect URI

Add your Netlify URL to Spotify Dashboard

Example: https://your-site-name.netlify.app/

Usage
Login: Click "Login with Spotify" and authorize the app

Browse Playlists: View all your playlists with track counts

View Tracks: Click any playlist to see its songs

Track Details: See song names, artists, and durations

Refresh: Click "Refresh Playlists" to reload your library

Screenshots
(Add your screenshots here)

Troubleshooting
Issue	Solution
"Invalid redirect_uri"	Check Spotify Dashboard Redirect URIs match your URL exactly
Token refresh fails	Clear localStorage and re-login
No playlists showing	Ensure your Spotify account has public playlists
CORS errors	Netlify functions handle API calls, no CORS issues
Security Features
✅ Tokens stored in localStorage (not cookies)

✅ No hardcoded secrets in frontend

✅ Serverless function handles token exchange

✅ Automatic token refresh

✅ Secure OAuth flow (no implicit grant)

Future Enhancements
Search playlists by name

Filter tracks by artist or song

Play track previews

Create new playlists

Add/remove tracks from playlists

Export playlist to CSV

Dark/Light theme toggle

License
MIT

Author
Derek Barigye

GitHub: @barigyederek

Acknowledgments
Spotify Web API

Netlify Functions

Font Awesome for icons

⭐ Star this repository if you find it useful! ⭐

Note: This app requires a Spotify Premium account for full functionality, but basic playlist viewing works with free accounts.

