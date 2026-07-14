export const UNITY_VS_JSON_ERRATA = [
  "# BANTWORKS Compatibility Errata",
  "",
  "These source-observed rules override conflicting statements in the supplied Visual Scripting manual below:",
  "",
  "- Unity Visual Scripting 1.9.4 and 1.9.9 serialize nodes and connections together in the canonical `graph.elements` array.",
  "- A node needs a string `$id` only when another serialized element references it. Unity can omit `$id` on unreferenced nodes.",
  "- Visual Scripting 1.9.4 and 1.9.9 omit `$version` on control and value connection elements. BANTWORKS accepts an omitted connection version or `\"A\"`.",
  "- New Script Graph assets use `Unity.VisualScripting.Flow::Unity.VisualScripting.ScriptGraphAsset` as `m_EditorClassIdentifier` and `NativeFormatImporter` in the asset's `.meta` file.",
  "- `validate_vs_graph` checks serialized structure and known Banter types. Unity import validation remains the authority for generic Unity node availability and exact port contracts.",
  "",
  "Observed against Unity 2022.3.39f1 / Visual Scripting 1.9.4 and Unity 6000.3.10f1 / Visual Scripting 1.9.9.",
].join("\n");
