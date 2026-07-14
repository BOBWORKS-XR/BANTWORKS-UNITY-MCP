import { BANTER_CUSTOM_VS_NODES } from "./banter-custom-vs-nodes.js";
import { BANTER_COMPONENT_CATALOG_METADATA } from "./banter-components.js";

const customNodes = Object.values(BANTER_CUSTOM_VS_NODES);

export const BANTER_SDK_COMPATIBILITY = {
  packageId: "com.sidequest.banter",
  catalog: {
    sourceAsset: {
      fileName: "AllCustomNodes (1).asset",
      sha256: "5F26A646B71FCC0C6215B880476F4F7623DD9B11F64208254A538B10998C0C94",
      graphElementCount: 202,
      graphGroupCount: 40,
    },
    visualScriptingNodeCount: customNodes.length,
    visualScriptingEventCount: customNodes.filter((node) => node.isEvent).length,
    visualScriptingCategoryCount: new Set(customNodes.map((node) => node.category)).size,
    manual: {
      fileName: "COMPLETE_UNITY_VISUAL_SCRIPTING_MANUAL_v2.2 (1).md",
      sha256: "E8D358EC2D010377DB24FD0B281818DAD19BAFFC64E61F61CA46166CD64A4F6E",
      version: "2.2",
    },
    components: BANTER_COMPONENT_CATALOG_METADATA,
  },
  observedSourceProfiles: [
    { packageVersion: "2.9.0", source: "observed package source", matchedCatalogNodes: 46 },
    { packageVersion: "3.0.0", source: "observed package source", matchedCatalogNodes: 67 },
    {
      packageVersion: "3.1.1",
      source: "git",
      requestedVersion: "https://github.com/SideQuestVR/BanterSDK.git#feature/ora",
      revision: "36263c6dc490e6b059ef5a885ed08875c306f250",
      matchedCatalogNodes: 162,
    },
    { packageVersion: "3.1.2", source: "registry", matchedCatalogNodes: 75 },
    {
      packageVersion: "3.2.1",
      source: "git",
      requestedVersion: "https://github.com/SideQuestVR/BanterSDK.git#dev",
      revision: "44e873c3dea26a2d4e12bd2f837d614da926c54f",
      matchedCatalogNodes: 162,
    },
    {
      packageVersion: "3.2.2",
      source: "registry",
      packageCacheFingerprint: "c893607975bb44f319445b533b421d184f6a5285",
      matchedCatalogNodes: 162,
    },
  ],
  interpretation: [
    "Counts describe C# class presence in observed package source trees, not proof that every node imports or executes in a specific Unity project.",
    "Semantic version alone is not sufficient: observed git and registry builds with nearby versions contain different node sets.",
    "Use get_banter_sdk_info for the selected project's requested source, resolved package metadata, revision, and live source coverage.",
  ],
} as const;
