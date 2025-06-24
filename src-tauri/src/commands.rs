use tauri::{AppHandle, Manager};
use std::path::PathBuf;
use crate::valorant::{self, ValorantInternal};

// エラーを文字列に変換してフロントエンドに渡すためのヘルパー
fn to_string_error<E: std::fmt::Display>(e: E) -> String {
    e.to_string()
}

// アプリのデータディレクトリ内にプロファイル保存用のディレクトリパスを取得
fn get_profiles_dir(app: &AppHandle) -> std::io::Result<PathBuf> {
    // V2のAPI app.path() に変更
    let path = app.path() 
        .app_data_dir()
        .expect("Failed to get app data dir")
        .join("profiles");
    
    if !path.exists() {
        std::fs::create_dir_all(&path)?;
    }
    Ok(path)
}

#[tauri::command]
pub fn check_valorant_running() -> bool {
    valorant::get_lock_file_path().is_ok()
}

#[tauri::command]
pub async fn get_profile_list(app: AppHandle) -> Result<Vec<String>, String> {
    let dir = get_profiles_dir(&app).map_err(to_string_error)?;
    let mut profiles = Vec::new();

    for entry in std::fs::read_dir(dir).map_err(to_string_error)? {
        let entry = entry.map_err(to_string_error)?;
        let path = entry.path();
        if path.is_file() {
            if let Some(ext) = path.extension() {
                if ext == "json" {
                    if let Some(stem) = path.file_stem() {
                        profiles.push(stem.to_string_lossy().to_string());
                    }
                }
            }
        }
    }
    Ok(profiles)
}

#[tauri::command]
pub async fn save_profile(app: AppHandle, profile_name: String) -> Result<(), String> {
    let val = ValorantInternal::new().await.map_err(to_string_error)?;
    let preferences = val.get_preferences().await.map_err(to_string_error)?;

    let dir = get_profiles_dir(&app).map_err(to_string_error)?;
    let file_path = dir.join(format!("{}.json", profile_name));

    let pretty_json = serde_json::to_string_pretty(&preferences).map_err(to_string_error)?;
    
    tokio::fs::write(file_path, pretty_json).await.map_err(to_string_error)?;
    Ok(())
}


#[tauri::command]
pub async fn load_profile(app: AppHandle, profile_name: String) -> Result<u16, String> {
    let dir = get_profiles_dir(&app).map_err(to_string_error)?;
    let file_path = dir.join(format!("{}.json", profile_name));

    let file_content = tokio::fs::read_to_string(file_path).await.map_err(to_string_error)?;
    let preferences: serde_json::Value = serde_json::from_str(&file_content).map_err(to_string_error)?;
    
    let val = ValorantInternal::new().await.map_err(to_string_error)?;
    val.set_preferences(&preferences).await.map_err(to_string_error)
}