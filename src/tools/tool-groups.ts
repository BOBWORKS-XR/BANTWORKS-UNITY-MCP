export const TOOL_GROUP_NAMES = ["read", "author", "test", "banter"] as const;

export type ToolGroupName = typeof TOOL_GROUP_NAMES[number];
export type ToolGroupSelection = "all" | ReadonlySet<ToolGroupName>;

export const ALWAYS_AVAILABLE_TOOLS = new Set([
  "list_unity_projects",
  "select_unity_project",
  "get_bridge_status",
]);

export const TOOL_GROUP_MEMBERSHIP: Readonly<Record<ToolGroupName, ReadonlySet<string>>> = {
  read: new Set([
    "validate_vs_graph",
    "validate_vs_graph_in_unity",
    "validate_banter_visual_scripting",
    "get_unity_packages",
    "get_banter_sdk_info",
    "search_unity_assets",
    "discover_unity_tests",
    "get_unity_test_run",
    "get_unity_scenes",
    "query_project_state",
    "check_import_status",
    "get_console_logs",
    "capture_unity_screenshot",
    "get_prefab_catalog",
    "get_object_bounds",
  ]),
  author: new Set([
    "generate_vs_graph",
    "write_vs_graph",
    "write_webroot_js",
    "validate_vs_graph_in_unity",
    "save_unity_scene",
    "open_unity_scene",
    "set_unity_build_scenes",
    "refresh_unity_assets",
    "create_gameobject",
    "delete_gameobject",
    "modify_gameobject",
    "add_component",
    "remove_component",
    "set_component_property",
    "set_object_reference",
    "batch_create",
    "instantiate_prefab",
    "batch_instantiate_prefabs",
    "scan_prefabs",
  ]),
  test: new Set([
    "discover_unity_tests",
    "run_unity_tests",
    "cancel_unity_test_run",
    "get_unity_test_run",
    "get_console_logs",
    "control_play_mode",
    "capture_unity_screenshot",
  ]),
  banter: new Set([
    "validate_vs_graph",
    "generate_vs_graph",
    "write_vs_graph",
    "write_webroot_js",
    "validate_vs_graph_in_unity",
    "validate_banter_visual_scripting",
    "get_banter_sdk_info",
  ]),
};

export function parseToolGroupSelection(value: string | undefined): ToolGroupSelection {
  if (value === undefined || value.trim() === "" || value.trim().toLowerCase() === "all") {
    return "all";
  }

  const entries = [...new Set(value.split(",").map((entry) => entry.trim().toLowerCase()).filter(Boolean))];
  if (entries.length === 0) {
    throw new Error("BANTWORKS_TOOL_GROUPS must contain all, none, read, author, test, or banter.");
  }
  if (entries.includes("all") || entries.includes("none")) {
    if (entries.length !== 1) {
      throw new Error("BANTWORKS_TOOL_GROUPS cannot combine 'all' or 'none' with other groups.");
    }
    return entries[0] === "all" ? "all" : new Set<ToolGroupName>();
  }

  const unknown = entries.filter((entry) => !TOOL_GROUP_NAMES.includes(entry as ToolGroupName));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown BANTWORKS_TOOL_GROUPS value(s): ${unknown.join(", ")}. ` +
      `Use all, none, or a comma-separated selection of: ${TOOL_GROUP_NAMES.join(", ")}.`
    );
  }

  return new Set(entries as ToolGroupName[]);
}

export function isToolEnabled(name: string, selection: ToolGroupSelection): boolean {
  if (selection === "all" || ALWAYS_AVAILABLE_TOOLS.has(name)) return true;
  return [...selection].some((group) => TOOL_GROUP_MEMBERSHIP[group].has(name));
}

export function describeToolGroupSelection(selection: ToolGroupSelection): string {
  if (selection === "all") return "all";
  const groups = TOOL_GROUP_NAMES.filter((group) => selection.has(group));
  return groups.length > 0 ? groups.join(",") : "none";
}
