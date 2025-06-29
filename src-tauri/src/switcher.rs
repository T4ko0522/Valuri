use tauri::{AppHandle, Manager};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::thread;
use std::time::Duration;

const RIOT_CLIENT_PATH: &str = "C:\\Riot Games\\Riot Client\\RiotClientServices.exe";
const RIOT_PROCESS_NAMES: &[&str] = &[
    "RiotClientServices.exe", "RiotClient.exe", "VALORANT.exe", "LeagueofLegends.exe",
];
// バックアップするフォルダやファイル (Riot Clientのルートからの相対パス)
const TARGET_PATHS: &[&str] = &[
    "Config",
    "Data/RiotGamesPrivateSettings.yaml",
    "Sessions",
];
// 修正：ファイル名を .log に変更
const LAST_ACCOUNT_FILE: &str = "last_switched_account.log";

// --- ヘルパー関数 ---

fn to_string_error<E: std::fmt::Display>(e: E) -> String {
    e.to_string()
}

// フォルダを再帰的にコピーするための関数
fn copy_dir_all(src: impl AsRef<Path>, dst: impl AsRef<Path>) -> std::io::Result<()> {
    fs::create_dir_all(&dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(entry.path(), dst.as_ref().join(entry.file_name()))?;
        } else {
            fs::copy(entry.path(), dst.as_ref().join(entry.file_name()))?;
        }
    }
    Ok(())
}

fn get_riot_client_root_path() -> Option<PathBuf> {
    dirs::data_local_dir().map(|p| p.join("Riot Games/Riot Client"))
}

fn get_switcher_data_path(app: &AppHandle) -> std::io::Result<PathBuf> {
    let path = app.path().app_data_dir()
        .expect("Failed to get app data dir")
        .join("switcher_profiles");
    if !path.exists() {
        fs::create_dir_all(&path)?;
    }
    Ok(path)
}

// --- Tauriコマンド ---

#[tauri::command]
pub fn get_saved_accounts(app: AppHandle) -> Result<Vec<String>, String> {
    let path = get_switcher_data_path(&app).map_err(to_string_error)?;
    let mut accounts = vec![];
    for entry in fs::read_dir(path).map_err(to_string_error)? {
        let entry = entry.map_err(to_string_error)?;
        if entry.file_type().map_err(to_string_error)?.is_dir() {
            if let Some(name) = entry.file_name().to_str() {
                accounts.push(name.to_string());
            }
        }
    }
    Ok(accounts)
}

#[tauri::command]
pub fn save_current_account(app: AppHandle, name: String) -> Result<(), String> {
    let riot_root = get_riot_client_root_path().ok_or("Riot Client s folder not found".to_string())?;
    let switcher_path = get_switcher_data_path(&app).map_err(to_string_error)?;
    let account_folder = switcher_path.join(&name);
    fs::create_dir_all(&account_folder).map_err(to_string_error)?;

    for target in TARGET_PATHS.iter() {
        let source_path = riot_root.join(target);
        let dest_path = account_folder.join(Path::new(target).file_name().unwrap());

        if source_path.exists() {
            if source_path.is_dir() {
                // コピー先に既存のフォルダがあれば一度削除してからコピー
                if dest_path.exists() {
                    fs::remove_dir_all(&dest_path).map_err(to_string_error)?;
                }
                copy_dir_all(&source_path, &dest_path).map_err(to_string_error)?;
            } else {
                fs::copy(&source_path, &dest_path).map_err(to_string_error)?;
            }
        }
    }

    // 保存が成功したら、このアカウントを「最後に使用したアカウント」として記録
    let last_account_file_path = switcher_path.join(LAST_ACCOUNT_FILE);
    fs::write(last_account_file_path, &name).map_err(to_string_error)?;

    Ok(())
}

#[tauri::command]
pub fn switch_account(app: AppHandle, name: String) -> Result<(), String> {
    let riot_root = get_riot_client_root_path().ok_or("Riot Clientのフォルダが見つからない！".to_string())?;
    let switcher_path = get_switcher_data_path(&app).map_err(to_string_error)?;
    let account_folder = switcher_path.join(&name);
    let last_account_file_path = switcher_path.join(LAST_ACCOUNT_FILE);

    if !account_folder.exists() {
        return Err(format!("'{}' s settings folder not found", name));
    }

    // 切り替え前に現在のアカウント情報を保存する
    if last_account_file_path.exists() {
        if let Ok(last_account_name) = fs::read_to_string(&last_account_file_path) {
            if !last_account_name.is_empty() && last_account_name != name {
                 // 現在のアカウント（最後に使ったアカウント）のデータを保存する
                 // ここでは save_current_account と同じロジックを実行
                println!("Saving current account state for: {}", last_account_name);
                // エラーが発生しても切り替え処理は続行するが、コンソールに警告を出す
                if let Err(e) = save_current_account(app.clone(), last_account_name.clone()) {
                     eprintln!("Warning: Failed to save state for '{}': {}", last_account_name, e);
                }
            }
        }
    }


    // --- ここから元の復元処理 ---
    for target in TARGET_PATHS.iter() {
        let target_name = Path::new(target).file_name().unwrap();
        let source_path = account_folder.join(target_name);
        let dest_path = riot_root.join(target);

        if source_path.exists() {
            // Restore前に既存のファイルを削除する
            if dest_path.exists() {
                if dest_path.is_dir() {
                    fs::remove_dir_all(&dest_path).map_err(to_string_error)?;
                } else {
                    fs::remove_file(&dest_path).map_err(to_string_error)?;
                }
            }
            
            // 親フォルダがなければ作成
            if let Some(parent) = dest_path.parent() {
                if !parent.exists() {
                    fs::create_dir_all(parent).map_err(to_string_error)?;
                }
            }

            if source_path.is_dir() {
                copy_dir_all(&source_path, &dest_path).map_err(to_string_error)?;
            } else {
                fs::copy(&source_path, &dest_path).map_err(to_string_error)?;
            }
        }
    }
    // --- ここまで元の復元処理 ---

    // 切り替えが成功したら、新しいアカウントを「最後に使用したアカウント」として記録
    fs::write(last_account_file_path, &name).map_err(to_string_error)?;

    Ok(())
}


#[tauri::command]
pub fn delete_account(app: AppHandle, name: String) -> Result<(), String> {
    let switcher_path = get_switcher_data_path(&app).map_err(to_string_error)?;
    let account_folder = switcher_path.join(&name);

    if account_folder.exists() && account_folder.is_dir() {
        fs::remove_dir_all(account_folder).map_err(to_string_error)?;
        Ok(())
    } else {
        Err(format!("'{}' data not found or is not a folder", name))
    }
}

// restart_riot_client と launch_for_add_account は変更なし
#[tauri::command]
pub fn restart_riot_client() -> Result<(), String> {
    for process_name in RIOT_PROCESS_NAMES.iter() {
        let _ = Command::new("taskkill").args(["/F", "/IM", process_name]).output();
    }
    thread::sleep(Duration::from_secs(3));
    Command::new(RIOT_CLIENT_PATH).spawn().map_err(to_string_error)?;
    Ok(())
}

#[tauri::command]
pub fn launch_for_add_account() -> Result<(), String> {
    for process_name in RIOT_PROCESS_NAMES.iter() {
        let _ = Command::new("taskkill").args(["/F", "/IM", process_name]).output();
    }
    if let Some(riot_root) = get_riot_client_root_path() {
        for target in TARGET_PATHS.iter() {
            let path_to_delete = riot_root.join(target);
            if path_to_delete.exists() {
                if path_to_delete.is_dir() {
                    let _ = fs::remove_dir_all(path_to_delete);
                } else {
                    let _ = fs::remove_file(path_to_delete);
                }
            }
        }
    }
    thread::sleep(Duration::from_secs(1));
    Command::new(RIOT_CLIENT_PATH).spawn().map_err(to_string_error)?;
    Ok(())
}