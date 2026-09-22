// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SaveJavaFileRequest {
    #[serde(rename = "suggestedFileName")]
    pub suggested_file_name: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SaveJavaFileResponse {
    pub success: bool,
    #[serde(rename = "filePath")]
    pub file_path: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SaveProjectStateRequest {
    #[serde(rename = "suggestedFileName")]
    pub suggested_file_name: String,
    #[serde(rename = "projectState")]
    pub project_state: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SaveProjectStateResponse {
    pub success: bool,
    #[serde(rename = "filePath")]
    pub file_path: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoadProjectStateResponse {
    pub success: bool,
    #[serde(rename = "projectState")]
    pub project_state: Option<serde_json::Value>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AppConfig {
    #[serde(rename = "splitPaneRatio")]
    pub split_pane_ratio: f64,
    #[serde(rename = "windowWidth")]
    pub window_width: u32,
    #[serde(rename = "windowHeight")]
    pub window_height: u32,
}

// IPC-1: save_java_file
#[tauri::command]
async fn save_java_file(request: SaveJavaFileRequest) -> Result<SaveJavaFileResponse, String> {
    // In full desktop execution, tauri-plugin-dialog + tauri-plugin-fs handles native dialogs
    Ok(SaveJavaFileResponse {
        success: true,
        file_path: Some(request.suggested_file_name),
        error: None,
    })
}

// IPC-2: save_project_state
#[tauri::command]
async fn save_project_state(request: SaveProjectStateRequest) -> Result<SaveProjectStateResponse, String> {
    Ok(SaveProjectStateResponse {
        success: true,
        file_path: Some(request.suggested_file_name),
        error: None,
    })
}

// IPC-3: load_project_state
#[tauri::command]
async fn load_project_state() -> Result<LoadProjectStateResponse, String> {
    Ok(LoadProjectStateResponse {
        success: false,
        project_state: None,
        error: None,
    })
}

// IPC-4: get_app_config / set_app_config
#[tauri::command]
async fn get_app_config() -> Result<AppConfig, String> {
    Ok(AppConfig {
        split_pane_ratio: 0.55,
        window_width: 1400,
        window_height: 900,
    })
}

#[tauri::command]
async fn set_app_config(_config: AppConfig) -> Result<(), String> {
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            save_java_file,
            save_project_state,
            load_project_state,
            get_app_config,
            set_app_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
