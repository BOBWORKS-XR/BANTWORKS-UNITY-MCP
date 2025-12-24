// State
let config = {
  channels: [],
  active_channel_id: null,
  mcp_server_path: 'C:/tools/banter-mcp/dist/index.js',
  auto_start: false
};

let mcpRoot = 'C:/tools/banter-mcp';

// DOM Elements (set after DOM loads)
let statusEl, channelsList, emptyState, addChannelBtn, addChannelModal;
let modalBackdrop, channelNameInput, scenePathInput, pathValidation;
let browseBtn, cancelBtn, confirmAddBtn, mcpServerPathInput;
let autoConfigCheckbox, applyConfigBtn, disconnectBtn, installExtensionBtn, openDocsBtn;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Get DOM elements
  statusEl = document.getElementById('status');
  channelsList = document.getElementById('channelsList');
  emptyState = document.getElementById('emptyState');
  addChannelBtn = document.getElementById('addChannelBtn');
  addChannelModal = document.getElementById('addChannelModal');
  modalBackdrop = document.getElementById('modalBackdrop');
  channelNameInput = document.getElementById('channelName');
  scenePathInput = document.getElementById('scenePath');
  pathValidation = document.getElementById('pathValidation');
  browseBtn = document.getElementById('browseBtn');
  cancelBtn = document.getElementById('cancelBtn');
  confirmAddBtn = document.getElementById('confirmAddBtn');
  mcpServerPathInput = document.getElementById('mcpServerPath');
  autoConfigCheckbox = document.getElementById('autoConfig');
  applyConfigBtn = document.getElementById('applyConfigBtn');
  disconnectBtn = document.getElementById('disconnectBtn');
  installExtensionBtn = document.getElementById('installExtensionBtn');
  openDocsBtn = document.getElementById('openDocsBtn');

  // Set up event listeners
  setupEventListeners();

  // Load config
  try {
    mcpRoot = await window.__TAURI__.core.invoke('get_mcp_root');
    config = await window.__TAURI__.core.invoke('load_config');
    updateUI();
  } catch (err) {
    console.error('Failed to load config:', err);
    showToast('Failed to load configuration: ' + err, 'error');
  }
});

function setupEventListeners() {
  // Add Scene button - opens modal
  addChannelBtn.addEventListener('click', function() {
    console.log('Add Scene clicked');
    channelNameInput.value = '';
    scenePathInput.value = '';
    pathValidation.textContent = '';
    pathValidation.className = 'validation-msg';
    confirmAddBtn.disabled = true;
    addChannelModal.classList.add('open');
    channelNameInput.focus();
  });

  // Modal close
  modalBackdrop.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  // Browse button - opens file picker for .unity files
  browseBtn.addEventListener('click', async function() {
    try {
      const selected = await window.__TAURI__.dialog.open({
        directory: false,
        multiple: false,
        title: 'Select Unity Scene File',
        filters: [{
          name: 'Unity Scene',
          extensions: ['unity']
        }]
      });

      if (selected) {
        scenePathInput.value = selected;
        validateScenePath(selected);
      }
    } catch (err) {
      console.error('Failed to open dialog:', err);
      showToast('Failed to open file dialog', 'error');
    }
  });

  // Path input validation
  scenePathInput.addEventListener('input', function() {
    validateScenePath(scenePathInput.value);
  });

  // Channel name input
  channelNameInput.addEventListener('input', function() {
    var hasName = channelNameInput.value.trim().length > 0;
    var pathValid = pathValidation.classList.contains('success');
    confirmAddBtn.disabled = !hasName || !pathValid;
  });

  // Confirm add channel
  confirmAddBtn.addEventListener('click', addChannel);

  // Settings
  mcpServerPathInput.addEventListener('change', async function() {
    config.mcp_server_path = mcpServerPathInput.value;
    try {
      await window.__TAURI__.core.invoke('save_config', { config: config });
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  });

  autoConfigCheckbox.addEventListener('change', async function() {
    config.auto_start = autoConfigCheckbox.checked;
    try {
      await window.__TAURI__.core.invoke('save_config', { config: config });
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  });

  // Quick actions
  applyConfigBtn.addEventListener('click', applyToClaudeCode);
  disconnectBtn.addEventListener('click', disconnectFromClaude);
  installExtensionBtn.addEventListener('click', installExtension);
  openDocsBtn.addEventListener('click', async function() {
    try {
      await window.__TAURI__.shell.open('https://github.com/anthropics/claude-code');
    } catch (err) {
      console.error('Failed to open docs:', err);
    }
  });
}

function updateUI() {
  mcpServerPathInput.value = config.mcp_server_path;
  autoConfigCheckbox.checked = config.auto_start !== false;
  renderChannels();
  updateStatus();
}

function renderChannels() {
  // Clear existing cards
  var existingCards = channelsList.querySelectorAll('.channel-card');
  existingCards.forEach(function(card) { card.remove(); });

  if (config.channels.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';

  config.channels.forEach(function(channel) {
    var card = createChannelCard(channel);
    channelsList.appendChild(card);
  });
}

function createChannelCard(channel) {
  var isActive = channel.id === config.active_channel_id;
  var displayPath = channel.scene_path || channel.unity_project_path;

  var card = document.createElement('div');
  card.className = 'channel-card' + (isActive ? ' active' : '');
  card.dataset.channelId = channel.id;

  card.innerHTML =
    '<div class="channel-radio"></div>' +
    '<div class="channel-info">' +
      '<div class="channel-name">' + escapeHtml(channel.name) + '</div>' +
      '<div class="channel-path">' + escapeHtml(displayPath) + '</div>' +
    '</div>' +
    '<div class="channel-badges">' +
      '<span class="badge extension-badge" style="display: none;">Extension</span>' +
    '</div>' +
    '<div class="channel-actions">' +
      '<button class="btn-icon-small delete" title="Remove channel">' +
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none">' +
          '<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
        '</svg>' +
      '</button>' +
    '</div>';

  card.addEventListener('click', function(e) {
    if (!e.target.closest('.btn-icon-small')) {
      selectChannel(channel.id);
    }
  });

  var deleteBtn = card.querySelector('.delete');
  deleteBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    removeChannel(channel.id);
  });

  checkExtension(channel, card);
  return card;
}

async function checkExtension(channel, card) {
  try {
    var hasExtension = await window.__TAURI__.core.invoke('check_unity_extension', {
      unityProjectPath: channel.unity_project_path
    });

    var badge = card.querySelector('.extension-badge');
    if (hasExtension) {
      badge.style.display = 'inline';
      badge.className = 'badge success';
      badge.textContent = 'Extension';
    }
  } catch (err) {
    console.error('Failed to check extension:', err);
  }
}

async function selectChannel(channelId) {
  config.active_channel_id = channelId;

  try {
    await window.__TAURI__.core.invoke('save_config', { config: config });

    if (autoConfigCheckbox.checked) {
      var channel = config.channels.find(function(c) { return c.id === channelId; });
      if (channel) {
        await window.__TAURI__.core.invoke('update_claude_mcp_config', {
          channel: channel,
          mcpServerPath: config.mcp_server_path
        });
        showToast('Applied to Claude Code', 'success');
      }
    }

    updateUI();
  } catch (err) {
    console.error('Failed to select channel:', err);
    showToast('Failed to save configuration', 'error');
  }
}

async function removeChannel(channelId) {
  config.channels = config.channels.filter(function(c) { return c.id !== channelId; });

  if (config.active_channel_id === channelId) {
    config.active_channel_id = config.channels.length > 0 ? config.channels[0].id : null;
  }

  try {
    await window.__TAURI__.core.invoke('save_config', { config: config });
    updateUI();
    showToast('Channel removed', 'success');
  } catch (err) {
    console.error('Failed to remove channel:', err);
    showToast('Failed to save configuration', 'error');
  }
}

function updateStatus() {
  var activeChannel = config.channels.find(function(c) { return c.id === config.active_channel_id; });

  if (activeChannel) {
    statusEl.className = 'status active';
    statusEl.querySelector('.status-text').textContent = activeChannel.name;
  } else if (config.channels.length > 0) {
    statusEl.className = 'status warning';
    statusEl.querySelector('.status-text').textContent = 'No channel selected';
  } else {
    statusEl.className = 'status';
    statusEl.querySelector('.status-text').textContent = 'Not Configured';
  }
}

function closeModal() {
  addChannelModal.classList.remove('open');
}

async function validateScenePath(path) {
  if (!path) {
    pathValidation.textContent = '';
    pathValidation.className = 'validation-msg';
    confirmAddBtn.disabled = true;
    return;
  }

  try {
    var isValid = await window.__TAURI__.core.invoke('validate_unity_scene', { path: path });

    if (isValid) {
      pathValidation.textContent = 'Valid Unity scene file';
      pathValidation.className = 'validation-msg success';
      confirmAddBtn.disabled = !channelNameInput.value.trim();
    } else {
      pathValidation.textContent = 'Not a valid Unity scene (.unity file inside Assets folder)';
      pathValidation.className = 'validation-msg error';
      confirmAddBtn.disabled = true;
    }
  } catch (err) {
    pathValidation.textContent = 'File does not exist';
    pathValidation.className = 'validation-msg error';
    confirmAddBtn.disabled = true;
  }
}

async function addChannel() {
  var name = channelNameInput.value.trim();
  var path = scenePathInput.value.trim();

  if (!name || !path) return;

  try {
    var channel = await window.__TAURI__.core.invoke('add_channel', {
      name: name,
      scenePath: path
    });

    config.channels.push(channel);

    if (config.channels.length === 1) {
      config.active_channel_id = channel.id;
    }

    await window.__TAURI__.core.invoke('save_config', { config: config });

    closeModal();
    updateUI();
    showToast('Channel added', 'success');
  } catch (err) {
    console.error('Failed to add channel:', err);
    pathValidation.textContent = String(err);
    pathValidation.className = 'validation-msg error';
  }
}

async function applyToClaudeCode() {
  var channel = config.channels.find(function(c) { return c.id === config.active_channel_id; });

  if (!channel) {
    showToast('No channel selected', 'error');
    return;
  }

  try {
    await window.__TAURI__.core.invoke('update_claude_mcp_config', {
      channel: channel,
      mcpServerPath: config.mcp_server_path
    });
    showToast('Applied to Claude Code (~/.claude.json)', 'success');
  } catch (err) {
    console.error('Failed to apply config:', err);
    showToast('Failed to update Claude config', 'error');
  }
}

async function disconnectFromClaude() {
  try {
    await window.__TAURI__.core.invoke('remove_claude_mcp_config');
    showToast('Disconnected Banter MCP from Claude Code', 'success');
  } catch (err) {
    console.error('Failed to disconnect:', err);
    showToast('Failed to disconnect: ' + String(err), 'error');
  }
}

async function installExtension() {
  var channel = config.channels.find(function(c) { return c.id === config.active_channel_id; });

  if (!channel) {
    showToast('No channel selected', 'error');
    return;
  }

  try {
    await window.__TAURI__.core.invoke('install_unity_extension', {
      unityProjectPath: channel.unity_project_path,
      mcpRoot: mcpRoot
    });
    showToast('Unity extension installed', 'success');
    updateUI();
  } catch (err) {
    console.error('Failed to install extension:', err);
    showToast('Failed: ' + String(err), 'error');
  }
}

function showToast(message, type) {
  type = type || 'info';
  var existing = document.querySelector('.toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.className = 'toast ' + type;

  var iconPath = '<circle cx="8" cy="8" r="6" stroke="#6366f1" stroke-width="2"/>';
  if (type === 'success') {
    iconPath = '<path d="M13 5L6 12L3 9" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  } else if (type === 'error') {
    iconPath = '<path d="M4 4l8 8M12 4l-8 8" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>';
  }

  toast.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none">' + iconPath + '</svg> ' + escapeHtml(message);

  document.body.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 3000);
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
