import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';

const KEY='google-oauth-token-v1';
export type GoogleTokenSet={accessToken:string;refreshToken?:string;expiresAt:number;scope?:string};
export const GOOGLE_SCOPES=['https://www.googleapis.com/auth/spreadsheets'];
export function googleClientId(){const extra=Constants.expoConfig?.extra??{};return PlatformClientId(extra);}
function PlatformClientId(extra:Record<string,unknown>):string { const v=extra.googleOAuth as Record<string,string>|undefined;const id=process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID||v?.webClientId||'';if(!id)throw new Error('Google OAuth is not configured. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and rebuild the app.');return id; }
export function googleRedirectUri(){return AuthSession.makeRedirectUri({scheme:'expensetracker',path:'oauthredirect'});}
export async function saveTokens(tokens:GoogleTokenSet){await SecureStore.setItemAsync(KEY,JSON.stringify(tokens));}
export async function clearTokens(){await SecureStore.deleteItemAsync(KEY);}
export async function loadTokens():Promise<GoogleTokenSet|null>{const raw=await SecureStore.getItemAsync(KEY);if(!raw)return null;try{return JSON.parse(raw) as GoogleTokenSet;}catch{await clearTokens();return null;}}
export async function getAccessToken():Promise<string>{const t=await loadTokens();if(!t)throw new Error('Connect your Google account in Settings.');if(t.expiresAt>Date.now()+60_000)return t.accessToken;if(!t.refreshToken){await clearTokens();throw new Error('Google access expired. Reconnect your account in Settings.');}const clientId=googleClientId();try{const refreshed=await AuthSession.refreshAsync({clientId,refreshToken:t.refreshToken}, {tokenEndpoint:'https://oauth2.googleapis.com/token'});const next:GoogleTokenSet={accessToken:refreshed.accessToken,refreshToken:refreshed.refreshToken??t.refreshToken,expiresAt:Date.now()+(refreshed.expiresIn??3600)*1000,scope:refreshed.scope??t.scope};await saveTokens(next);return next.accessToken;}catch{await clearTokens();throw new Error('Google authorization expired or was revoked. Reconnect your account in Settings.');}}
export async function revokeGoogleAccess(){const t=await loadTokens();if(t?.accessToken){try{await fetch('https://oauth2.googleapis.com/revoke?token='+encodeURIComponent(t.refreshToken??t.accessToken),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'}});}catch{/* Local credential removal must still proceed. */}}await clearTokens();}
