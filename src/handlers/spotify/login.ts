import { urlParams } from '../../utils/utils';
import { generateSpotifyUrl } from '../../lib/spotify/generateSpotifyUrl';
import { spotifyPlayerStatus, spotifyUrl } from '../../stores/spotify';
import { createNewSpotifyPlayer, getOAuthToken, refershOrGetOAuthToken } from './player';
import time from '../../stores/time';
import { setTokenTtl, tokenTtl } from '../../lib/spotify/SpotifyClient';

let loginTimeout: NodeJS.Timeout;
export async function attemptSpotifyLogin() {
    loginTimeout = setTimeout(() => {
        spotifyPlayerStatus.set('error');
        throw 'Login request timed out'
    }, 60 * 1000);

    if (!localStorage.getItem('userHasLogged')) {
        if (!urlParams.get('state')) {
            //The user has never logged before to the app
            const url = await generateSpotifyUrl();
            spotifyUrl.set(url);
        } else if (urlParams.get('state') && !urlParams.get('error')) {
            //The user comes from the Spotify's authentication page
            //without errors
            if (urlParams.get('state') === localStorage.state) {
                //The state variables match, the authentication is completed,
                //the app will reload the page to clean the address bar
                localStorage.removeItem('state');
                localStorage.setItem('code', urlParams.get('code'));
                localStorage.setItem('userHasLogged', 'true');
                window.location.replace(process.env.SPOTIFY_REDIRECT_URL);
            } else {
                //The states don't match, the authentication failed
                throwAuthError('States do not match');
            }
        } else if (urlParams.get('error')) {
            //Spotify responded with an error during the authentication process
            throwAuthError(urlParams.get('error'));
        }
    } else if (localStorage.getItem('userHasLogged') == 'true') {
        window.onSpotifyWebPlaybackSDKReady = () => {
            spotifyPlayerStatus.set('connecting');
            createNewSpotifyPlayer()
                .then(() => {
                    clearTimeout(loginTimeout);
                    autoRefeshToken();
                })
                .catch(err => {
                    spotifyPlayerStatus.set('error');
                    console.log(err);
                }) 
        };
    }
}

export function logout() {
    ['userHasLogged', 'refreshToken', 'verifier', 'state'].forEach(el => localStorage.removeItem(el));
    ['accessToken', 'expires_at'].forEach(el => sessionStorage.removeItem(el));
}

function throwAuthError(reason = '') {
    spotifyUrl.set(undefined);
    spotifyPlayerStatus.set(reason === 'access_denied' ? 'access_denied' : 'error');
    console.error('Authentication Error!: ' + reason);

    if (reason === 'access_denied') {
        window.location.replace('/');
    }
}

function autoRefeshToken(enable = true) {
    let working = false;
    time.subscribe((t) => {
        if (!working && (t.unix() >= tokenTtl)) {
            working = true;
            console.log('Auto-refresh spotify token');
            refershOrGetOAuthToken()
                .finally(() => working = false)
        }
    })
}