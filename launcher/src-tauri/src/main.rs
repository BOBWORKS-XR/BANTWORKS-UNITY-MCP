// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// A scene channel configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
struct ProjectChannel {
    id: String,
    name: String,
    unity_project_path: String,
    scene_path: Option<String>,
    enabled: bool,
}

/// Full launcher configuration
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
struct LauncherConfig {
    channels: Vec<ProjectChannel>,
    active_channel_id: Option<String>,
    mcp_server_path: String,
    auto_start: bool,
}

/// Get the config file path
fn get_config_path() -> PathBuf {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("banter-mcp");

    fs::create_dir_all(&config_dir).ok();
    config_dir.join("launcher-config.json")
}

/// Load configuration from disk
#[tauri::command]
fn load_config() -> Result<LauncherConfig, String> {
    let config_path = get_config_path();

    if config_path.exists() {
        let content = fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config: {}", e))?;
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse config: {}", e))
    } else {
        Ok(LauncherConfig {
            channels: vec![],
            active_channel_id: None,
            mcp_server_path: "C:/tools/banter-mcp/dist/index.js".to_string(),
            auto_start: false,
        })
    }
}

/// Save configuration to disk
#[tauri::command]
fn save_config(config: LauncherConfig) -> Result<(), String> {
    let config_path = get_config_path();
    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config: {}", e))
}

/// Add a new scene channel
#[tauri::command]
fn add_channel(name: String, scene_path: String) -> Result<ProjectChannel, String> {
    let scene_file = PathBuf::from(&scene_path);

    if !scene_file.exists() {
        return Err(format!("Scene file does not exist: {}", scene_path));
    }

    // Validate it's a .unity file
    if scene_file.extension().map(|e| e.to_str().unwrap_or("")) != Some("unity") {
        return Err("Not a valid Unity scene file (must be .unity)".to_string());
    }

    // Extract project path from scene path (go up to find Assets folder)
    let mut project_path: Option<PathBuf> = None;
    let mut current = scene_file.parent();

    while let Some(dir) = current {
        if dir.file_name().map(|n| n.to_str().unwrap_or("")) == Some("Assets") {
            project_path = dir.parent().map(|p| p.to_path_buf());
            break;
        }
        current = dir.parent();
    }

    let unity_project_path = project_path
        .ok_or("Could not find Unity project root (no Assets folder in path)")?
        .to_string_lossy()
        .to_string();

    let channel = ProjectChannel {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        unity_project_path,
        scene_path: Some(scene_path),
        enabled: true,
    };

    Ok(channel)
}

/// Validate a Unity scene file path
#[tauri::command]
fn validate_unity_scene(path: String) -> Result<bool, String> {
    let scene_path = PathBuf::from(&path);

    if !scene_path.exists() {
        return Ok(false);
    }

    // Check if it's a .unity file
    if scene_path.extension().map(|e| e.to_str().unwrap_or("")) != Some("unity") {
        return Ok(false);
    }

    // Check if it's inside an Assets folder (valid Unity project structure)
    let path_str = path.replace("\\", "/");
    Ok(path_str.contains("/Assets/"))
}

/// Get Claude Code config path
fn get_claude_config_path() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".claude.json")
}

/// Read current Claude Code MCP configuration
#[tauri::command]
fn get_claude_mcp_config() -> Result<serde_json::Value, String> {
    let config_path = get_claude_config_path();

    if config_path.exists() {
        let content = fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read Claude config: {}", e))?;
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse Claude config: {}", e))
    } else {
        Ok(serde_json::json!({}))
    }
}

/// Update Claude Code MCP configuration for a channel
#[tauri::command]
fn update_claude_mcp_config(channel: ProjectChannel, mcp_server_path: String) -> Result<(), String> {
    let config_path = get_claude_config_path();

    let mut config: serde_json::Value = if config_path.exists() {
        let content = fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read Claude config: {}", e))?;
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    if config.get("mcpServers").is_none() {
        config["mcpServers"] = serde_json::json!({});
    }

    let mut env = serde_json::json!({
        "UNITY_PROJECT_PATH": channel.unity_project_path
    });

    if let Some(scene) = &channel.scene_path {
        env["UNITY_SCENE_PATH"] = serde_json::json!(scene);
    }

    config["mcpServers"]["banter"] = serde_json::json!({
        "command": "node",
        "args": [mcp_server_path],
        "env": env
    });

    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize Claude config: {}", e))?;

    fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write Claude config: {}", e))
}

/// Remove Banter MCP from Claude config
#[tauri::command]
fn remove_claude_mcp_config() -> Result<(), String> {
    let config_path = get_claude_config_path();

    if !config_path.exists() {
        return Ok(());
    }

    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read Claude config: {}", e))?;

    let mut config: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse Claude config: {}", e))?;

    if let Some(servers) = config.get_mut("mcpServers") {
        if let Some(obj) = servers.as_object_mut() {
            obj.remove("banter");
        }
    }

    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize Claude config: {}", e))?;

    fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write Claude config: {}", e))
}

/// Check if Unity extension is installed in a project
#[tauri::command]
fn check_unity_extension(unity_project_path: String) -> Result<bool, String> {
    let extension_path = PathBuf::from(&unity_project_path)
        .join("Assets")
        .join("Editor")
        .join("BanterMCPBridge.cs");

    Ok(extension_path.exists())
}

/// Install Unity extension to a project
#[tauri::command]
fn install_unity_extension(unity_project_path: String, mcp_root: String) -> Result<(), String> {
    let source = PathBuf::from(&mcp_root)
        .join("unity-extension")
        .join("Editor")
        .join("BanterMCPBridge.cs");

    let dest_dir = PathBuf::from(&unity_project_path)
        .join("Assets")
        .join("Editor");

    let dest = dest_dir.join("BanterMCPBridge.cs");

    fs::create_dir_all(&dest_dir)
        .map_err(|e| format!("Failed to create Editor directory: {}", e))?;

    fs::copy(&source, &dest)
        .map_err(|e| format!("Failed to copy extension: {}", e))?;

    Ok(())
}

/// Get the MCP root directory
#[tauri::command]
fn get_mcp_root() -> Result<String, String> {
    Ok("C:/tools/banter-mcp".to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            load_config,
            save_config,
            add_channel,
            validate_unity_scene,
            get_claude_mcp_config,
            update_claude_mcp_config,
            remove_claude_mcp_config,
            check_unity_extension,
            install_unity_extension,
            get_mcp_root,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
