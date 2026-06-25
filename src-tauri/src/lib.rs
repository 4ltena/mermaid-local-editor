// Shared application entry point. Desktop (main.rs) and the mobile targets
// (`cargo tauri android`/`ios`) both call `run()`, so platform support is a
// matter of adding the target, not rewriting the app.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
