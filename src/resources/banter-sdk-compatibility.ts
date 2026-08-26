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
  publicReleaseValidationMatrix: {
    sourceRepository: "https://github.com/SideQuestVR/BanterSDK.git",
    selectionPolicy: "Latest public patch tag from each Banter SDK 3.x minor line represented by a public release",
    unityVersion: "6000.3.2f1",
    visualScriptingVersion: "1.9.9",
    testFrameworkVersion: "1.6.0",
    profiles: [
      {
        releaseTag: "3.0.2",
        packageVersion: "3.0.2",
        revision: "a25b261db11d7ced12704a3a9ffc83778da3afd6",
        result: "package compilation failed",
        diagnosticCodes: ["CS0619", "CS0029", "CS0266"],
        evidence: "Unity 6 rejects the SDK's legacy PhysicMaterial types and conversions before graph validation can run.",
      },
      {
        releaseTag: "3.1.2",
        packageVersion: "3.1.2",
        revision: "c75593e029cfcb7aecca6a880082f6d5d6853883",
        result: "package compilation failed",
        diagnosticCodes: ["CS0619", "CS0029", "CS0266"],
        evidence: "Unity 6 rejects the SDK's legacy PhysicMaterial types and conversions before graph validation can run.",
      },
      {
        releaseTag: "3.2.2",
        packageVersion: "3.2.2",
        revision: "8cff56ed80a7f694d0de204a4fa7bfc660f6d503",
        result: "passed",
        diagnosticCodes: [],
        evidence: "Generated OnGrab import, ScriptMachine attachment persistence, SDK allow-list acceptance, forbidden-unit rejection, and validator recovery passed.",
      },
    ],
  },
  observedUnityValidationProfiles: [
    {
      packageVersion: "3.2.2",
      packageCacheFingerprint: "c893607975bb44f319445b533b421d184f6a5285",
      unityVersion: "2022.3.39f1",
      visualScriptingVersion: "1.9.4",
      result: "package compilation failed",
      evidence: [
        "The package source references UnityEngine.PhysicsMaterial and PhysicsMaterialCombine, which are unavailable in this clean Unity 2022 project.",
        "The package metadata declares Unity 2022.3.39f1, so metadata alone is not a sufficient compatibility guarantee for this fingerprint.",
      ],
    },
    {
      packageVersion: "3.2.2",
      packageCacheFingerprint: "c893607975bb44f319445b533b421d184f6a5285",
      unityVersion: "6000.3.2f1",
      visualScriptingVersion: "1.9.9",
      result: "passed",
      evidence: [
        "A Creator Works MCP-generated Banter.VisualScripting.OnGrab graph imported with no missing elements.",
        "Banter.SDKEditor.ValidateVisualScripting.CheckVsNodes returned true.",
        "A disposable custom Unit imported successfully and produced Banter's exact forbidden-element diagnostics.",
      ],
    },
  ],
  interpretation: [
    "Counts describe C# class presence in observed package source trees, not proof that every node imports or executes in a specific Unity project.",
    "Semantic version alone is not sufficient: observed git and registry builds with nearby versions contain different node sets.",
    "Use get_banter_sdk_info for the selected project's requested source, resolved package metadata, revision, and live source coverage.",
    "The public release matrix succeeds when every pinned release matches its observed outcome; a known package-compilation incompatibility is not a full integration pass.",
    "Use validate_vs_graph_in_unity after writing a graph, then validate_banter_visual_scripting for the SDK's project-wide allow-list decision.",
  ],
} as const;
