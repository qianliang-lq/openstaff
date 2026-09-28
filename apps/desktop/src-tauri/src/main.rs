#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use openstaff_protocol::Message;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to OpenStaff.", name)
}

#[tauri::command]
fn echo_message(content: String) -> Message {
    Message { content }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet, echo_message])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
