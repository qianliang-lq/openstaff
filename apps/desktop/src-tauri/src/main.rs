#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::{engine::general_purpose, Engine as _};
use openstaff_protocol::Message;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Serialize, Deserialize, Clone)]
struct ProviderKey {
    provider: String,
    key: String,
}

#[derive(Serialize, Deserialize)]
struct KeyStore {
    keys: Vec<ProviderKey>,
}

fn get_keystore_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;

    let keystore_path = app_data_dir.join("keys.dat");
    Ok(keystore_path)
}

fn read_keystore(path: &PathBuf) -> Result<KeyStore, String> {
    if !path.exists() {
        return Ok(KeyStore { keys: Vec::new() });
    }

    let content =
        fs::read_to_string(path).map_err(|e| format!("Failed to read keystore: {}", e))?;

    // Simple base64 encoding (MVP - not production-grade encryption)
    let decoded = general_purpose::STANDARD
        .decode(&content)
        .map_err(|e| format!("Failed to decode keystore: {}", e))?;

    let json_str =
        String::from_utf8(decoded).map_err(|e| format!("Invalid UTF-8 in keystore: {}", e))?;

    let keystore: KeyStore =
        serde_json::from_str(&json_str).map_err(|e| format!("Failed to parse keystore: {}", e))?;

    Ok(keystore)
}

fn write_keystore(path: &PathBuf, keystore: &KeyStore) -> Result<(), String> {
    let json_str = serde_json::to_string(keystore)
        .map_err(|e| format!("Failed to serialize keystore: {}", e))?;

    // Simple base64 encoding (MVP - not production-grade encryption)
    let encoded = general_purpose::STANDARD.encode(&json_str);

    fs::write(path, encoded).map_err(|e| format!("Failed to write keystore: {}", e))?;

    // Set file permissions to 600 on Unix
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(path)
            .map_err(|e| format!("Failed to get file metadata: {}", e))?
            .permissions();
        perms.set_mode(0o600);
        fs::set_permissions(path, perms)
            .map_err(|e| format!("Failed to set file permissions: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to OpenStaff.", name)
}

#[tauri::command]
fn echo_message(content: String) -> Message {
    Message { content }
}

#[tauri::command]
fn save_provider_key(
    app_handle: tauri::AppHandle,
    provider: String,
    key: String,
) -> Result<(), String> {
    let keystore_path = get_keystore_path(&app_handle)?;
    let mut keystore = read_keystore(&keystore_path)?;

    // Remove existing key for this provider
    keystore.keys.retain(|k| k.provider != provider);

    // Add new key
    keystore.keys.push(ProviderKey { provider, key });

    write_keystore(&keystore_path, &keystore)?;

    Ok(())
}

#[tauri::command]
fn get_provider_key(
    app_handle: tauri::AppHandle,
    provider: String,
) -> Result<Option<String>, String> {
    let keystore_path = get_keystore_path(&app_handle)?;
    let keystore = read_keystore(&keystore_path)?;

    let key = keystore
        .keys
        .iter()
        .find(|k| k.provider == provider)
        .map(|k| k.key.clone());

    Ok(key)
}

#[tauri::command]
fn delete_provider_key(app_handle: tauri::AppHandle, provider: String) -> Result<(), String> {
    let keystore_path = get_keystore_path(&app_handle)?;
    let mut keystore = read_keystore(&keystore_path)?;

    keystore.keys.retain(|k| k.provider != provider);

    write_keystore(&keystore_path, &keystore)?;

    Ok(())
}

#[tauri::command]
fn list_provider_keys(app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    let keystore_path = get_keystore_path(&app_handle)?;
    let keystore = read_keystore(&keystore_path)?;

    Ok(keystore.keys.iter().map(|k| k.provider.clone()).collect())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            echo_message,
            save_provider_key,
            get_provider_key,
            delete_provider_key,
            list_provider_keys
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
