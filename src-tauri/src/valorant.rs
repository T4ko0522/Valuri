use serde::Deserialize;
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use std::path::PathBuf;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ApiError {
    #[error("Can not find lockfile")]
    LockfileNotFound,
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
    #[error("HTTP request error: {0}")]
    Reqwest(#[from] reqwest::Error),
    #[error("Lockfile is malformed")]
    MalformedLockfile,
    #[error("Failed to build HTTP header: {0}")]
    InvalidHeader(#[from] reqwest::header::InvalidHeaderValue),
    #[error("Base64 decoding error: {0}")]
    Base64(#[from] base64::DecodeError),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("API returned an error: {status} - {text}")]
    ApiErrorResponse { status: u16, text: String },
}

pub type Result<T> = std::result::Result<T, ApiError>;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct VersionData {
    riot_client_version: String,
}

#[derive(Deserialize, Debug)]
struct VersionResponse {
    data: VersionData,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
struct EntitlementsTokenResponse {
    access_token: String,
    token: String,
}

pub fn get_lock_file_path() -> Result<PathBuf> {
    let path = std::env::var("LOCALAPPDATA")
        .map(PathBuf::from)
        .ok()
        .map(|p| p.join("Riot Games/Riot Client/config/lockfile"))
        .filter(|p| p.exists());
    
    path.ok_or(ApiError::LockfileNotFound)
}

const X_RIOT_CLIENT_PLATFORM: &str = "ew0KCSJwbGF0Zm9ybVR5cGUiOiAiUEMiLA0KCSJwbGF0Zm9ybU9TIjogIldpbmRvd3MiLA0KCSJwbGF0Zm9ybU9TVmVyc2lvbiI6ICIxMC4wLjE5MDQyLjEuMjU2LjY0Yml0IiwNCgkicGxhdGZvcm1DaGlwc2V0IjogIlVua25vd24iDQp9";

struct ValorantApi;

impl ValorantApi {
    async fn get_version() -> Result<VersionResponse> {
        let resp = reqwest::get("https://valorant-api.com/v1/version").await?;
        Ok(resp.json::<VersionResponse>().await?)
    }
}

pub struct ValorantInternal {
    client: reqwest::Client,
    headers: HeaderMap,
}

impl ValorantInternal {
    pub async fn new() -> Result<Self> {
        let lock_file_path = get_lock_file_path()?;
        let lockfile_content = tokio::fs::read_to_string(lock_file_path).await?;
        let parts: Vec<&str> = lockfile_content.split(':').collect();

        if parts.len() < 4 {
            return Err(ApiError::MalformedLockfile);
        }

        let port = parts[2];
        let password = parts[3];
        let auth_str = format!("riot:{}", password);
        let auth_b64 = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, auth_str);
        
        let internal_client = reqwest::Client::builder()
            .danger_accept_invalid_certs(true)
            .build()?;

        let mut internal_headers = HeaderMap::new();
        internal_headers.insert(AUTHORIZATION, HeaderValue::from_str(&format!("Basic {}", auth_b64))?);

        let url = format!("https://127.0.0.1:{}/entitlements/v1/token", port);
        let token_resp = internal_client.get(&url).headers(internal_headers).send().await?;
        
        if !token_resp.status().is_success() {
            return Err(ApiError::ApiErrorResponse{ status: token_resp.status().as_u16(), text: token_resp.text().await? });
        }
        let token_data = token_resp.json::<EntitlementsTokenResponse>().await?;

        let version_info = ValorantApi::get_version().await?;

        let mut headers = HeaderMap::new();
        headers.insert(AUTHORIZATION, HeaderValue::from_str(&format!("Bearer {}", token_data.access_token))?);
        headers.insert("X-Riot-Entitlements-JWT", HeaderValue::from_str(&token_data.token)?);
        headers.insert("X-Riot-ClientVersion", HeaderValue::from_str(&version_info.data.riot_client_version)?);
        headers.insert("X-Riot-ClientPlatform", HeaderValue::from_str(X_RIOT_CLIENT_PLATFORM)?);
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
        
        let client = reqwest::Client::new();

        Ok(Self { client, headers })
    }

    pub async fn get_preferences(&self) -> Result<serde_json::Value> {
        let url = "https://player-preferences-usw2.pp.sgp.pvp.net/playerPref/v3/getPreference/Ares.PlayerSettings";
        let resp = self.client.get(url).headers(self.headers.clone()).send().await?;
        
        if !resp.status().is_success() {
            return Err(ApiError::ApiErrorResponse{ status: resp.status().as_u16(), text: resp.text().await? });
        }
        Ok(resp.json::<serde_json::Value>().await?)
    }

    pub async fn set_preferences(&self, preferences: &serde_json::Value) -> Result<u16> {
        let url = "https://player-preferences-usw2.pp.sgp.pvp.net/playerPref/v3/savePreference";
        let resp = self.client.put(url).headers(self.headers.clone()).json(preferences).send().await?;
        
        let status = resp.status();
        if !status.is_success() {
            return Err(ApiError::ApiErrorResponse{ status: status.as_u16(), text: resp.text().await? });
        }
        Ok(status.as_u16())
    }
}