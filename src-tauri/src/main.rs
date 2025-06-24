// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// 作ったモジュールをここで宣言するんすよ
mod valorant;
mod commands;
mod switcher; // アカウントスイッチャーの魂

// このrustは俺(T4ko0522)書いてないからこのコメントアウトは全部なつみかんがやったやつだよなめんな４ね
fn main() {
    // コンソールにログ出すやつ。デバッグにいいゾ～これ
    tracing_subscriber::fmt::init();

    tauri::Builder::default()
        // コマンドを登録だ！
        .invoke_handler(tauri::generate_handler![
            // Valorant設定マネージャーのコマンド
            commands::check_valorant_running,
            commands::get_profile_list,
            commands::save_profile,
            commands::load_profile,

            // アカウントスイッチャーのコマンド
            switcher::get_saved_accounts,
            switcher::save_current_account,
            switcher::switch_account,
            switcher::restart_riot_client,
            switcher::launch_for_add_account,
            switcher::delete_account
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}