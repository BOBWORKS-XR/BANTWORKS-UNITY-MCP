/**
 * Generated Banter custom Visual Scripting node catalog.
 * Source: AllCustomNodes (1).asset
 * Source SHA256: 5F26A646B71FCC0C6215B880476F4F7623DD9B11F64208254A538B10998C0C94
 * Generated at: 2026-07-01T08:47:02.845Z
 */

export interface BanterCustomVSDefaultValue {
  name: string;
  type: string | null;
  defaultValue: unknown;
}

export interface BanterCustomVSNode {
  name: string;
  fullType: string;
  category: string;
  position: { x: number; y: number } | null;
  sampleGuid: string;
  version: string | null;
  isEvent: boolean;
  defaultValues: BanterCustomVSDefaultValue[];
  serializedFields: Record<string, unknown>;
}

export const BANTER_CUSTOM_VS_NODES = {
  "AiImage": {
    "name": "AiImage",
    "fullType": "Banter.VisualScripting.AiImage",
    "category": "AI",
    "position": {
      "x": -528,
      "y": -228
    },
    "sampleGuid": "1f488113-4c62-41b0-956f-3d1a8c995131",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Prompt",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Ratio",
        "type": "Banter.SDK.AiImageRatio",
        "defaultValue": "_1_1"
      }
    ],
    "serializedFields": {}
  },
  "AiModel": {
    "name": "AiModel",
    "fullType": "Banter.VisualScripting.AiModel",
    "category": "AI",
    "position": {
      "x": -336,
      "y": -228
    },
    "sampleGuid": "8f8ba425-764b-4c2d-81e9-4d7ed94b6d27",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Base64 Image",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Detail",
        "type": "Banter.SDK.AiModelSimplify",
        "defaultValue": "med"
      },
      {
        "name": "Texture Size",
        "type": "System.Int32",
        "defaultValue": 1024
      }
    ],
    "serializedFields": {}
  },
  "Base64ToCDN": {
    "name": "Base64ToCDN",
    "fullType": "Banter.VisualScripting.Base64ToCDN",
    "category": "AI",
    "position": {
      "x": -528,
      "y": -384
    },
    "sampleGuid": "bcdd7d7b-4ded-48a9-818c-af777dba0696",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Filename",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Base64 String",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "ObjectTexToBase64": {
    "name": "ObjectTexToBase64",
    "fullType": "Banter.VisualScripting.ObjectTexToBase64",
    "category": "AI",
    "position": {
      "x": -312,
      "y": -372
    },
    "sampleGuid": "b27e249e-e021-4c53-97d3-4bfac69fee5f",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Material Index",
        "type": "System.Int32",
        "defaultValue": 0
      },
      {
        "name": "gameObject",
        "type": null,
        "defaultValue": null
      }
    ],
    "serializedFields": {}
  },
  "OnAiImage": {
    "name": "OnAiImage",
    "fullType": "Banter.VisualScripting.OnAiImage",
    "category": "AI",
    "position": {
      "x": -468,
      "y": -3852
    },
    "sampleGuid": "f30215a2-4cb8-47ec-9af3-48755d92f046",
    "version": "A",
    "isEvent": true,
    "defaultValues": [],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnAiModel": {
    "name": "OnAiModel",
    "fullType": "Banter.VisualScripting.OnAiModel",
    "category": "AI",
    "position": {
      "x": -300,
      "y": -3852
    },
    "sampleGuid": "59173e7f-e947-4f41-8640-d4efafde2805",
    "version": "A",
    "isEvent": true,
    "defaultValues": [],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnBase64CDNLink": {
    "name": "OnBase64CDNLink",
    "fullType": "Banter.VisualScripting.OnBase64CDNLink",
    "category": "AI",
    "position": {
      "x": -132,
      "y": -3852
    },
    "sampleGuid": "b0db24d1-37cb-4d99-9c3f-7658505fa919",
    "version": "A",
    "isEvent": true,
    "defaultValues": [],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnCameraSnap": {
    "name": "OnCameraSnap",
    "fullType": "Banter.VisualScripting.OnCameraSnap",
    "category": "AI",
    "position": {
      "x": 84,
      "y": -3852
    },
    "sampleGuid": "3e966b43-aa5a-4d68-929f-fc707f3936ef",
    "version": "A",
    "isEvent": true,
    "defaultValues": [],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnSTT": {
    "name": "OnSTT",
    "fullType": "Banter.VisualScripting.OnSTT",
    "category": "AI",
    "position": {
      "x": 288,
      "y": -3852
    },
    "sampleGuid": "4bfbbc70-d551-41ab-baac-c9210b68f8b4",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "Return ID",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "StartSTT": {
    "name": "StartSTT",
    "fullType": "Banter.VisualScripting.StartSTT",
    "category": "AI",
    "position": {
      "x": -528,
      "y": -48
    },
    "sampleGuid": "848295e4-6e57-4330-bc7d-a7a9fef62692",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Detect Speech",
        "type": "System.Boolean",
        "defaultValue": false
      }
    ],
    "serializedFields": {}
  },
  "StopSTT": {
    "name": "StopSTT",
    "fullType": "Banter.VisualScripting.StopSTT",
    "category": "AI",
    "position": {
      "x": -300,
      "y": -48
    },
    "sampleGuid": "431843f1-039e-4238-ab95-f401d65988ee",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Return Id",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "InjectJS": {
    "name": "InjectJS",
    "fullType": "Banter.VisualScripting.InjectJS",
    "category": "Browser",
    "position": {
      "x": -552,
      "y": 144
    },
    "sampleGuid": "a83e1a05-52e8-4bf2-8e67-3b42f8a07221",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "BullSchript",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Return ID",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "MenuOpenUrl": {
    "name": "MenuOpenUrl",
    "fullType": "Banter.VisualScripting.MenuOpenUrl",
    "category": "Browser",
    "position": {
      "x": -360,
      "y": 144
    },
    "sampleGuid": "571d6a0c-f62f-4884-b4ba-092b0d81b6df",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Url",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "OnJsReturnValue": {
    "name": "OnJsReturnValue",
    "fullType": "Banter.VisualScripting.OnJsReturnValue",
    "category": "Browser",
    "position": {
      "x": -456,
      "y": -3564
    },
    "sampleGuid": "dec6f98c-cb7e-4a3e-b852-831d4136e3bd",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "Return ID",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnReceiveBrowserMessage": {
    "name": "OnReceiveBrowserMessage",
    "fullType": "Banter.VisualScripting.OnReceiveBrowserMessage",
    "category": "Browser",
    "position": {
      "x": -228,
      "y": -3564
    },
    "sampleGuid": "12733845-7424-4e3a-8ae8-ab4bb4f188fd",
    "version": "A",
    "isEvent": true,
    "defaultValues": [],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnReceiveMenuBrowserMessage": {
    "name": "OnReceiveMenuBrowserMessage",
    "fullType": "Banter.VisualScripting.OnReceiveMenuBrowserMessage",
    "category": "Browser",
    "position": {
      "x": 60,
      "y": -3564
    },
    "sampleGuid": "6b47c595-594c-45f1-8b61-e4c9cf9b9e11",
    "version": "A",
    "isEvent": true,
    "defaultValues": [],
    "serializedFields": {
      "coroutine": false
    }
  },
  "ReadJsFromFile": {
    "name": "ReadJsFromFile",
    "fullType": "Banter.VisualScripting.ReadJsFromFile",
    "category": "Browser",
    "position": {
      "x": -132,
      "y": 156
    },
    "sampleGuid": "9c3fc61e-c356-482e-b5cc-7b4d759bb22c",
    "version": "A",
    "isEvent": false,
    "defaultValues": [],
    "serializedFields": {}
  },
  "OnControllerAxisUpdate": {
    "name": "OnControllerAxisUpdate",
    "fullType": "Banter.VisualScripting.OnControllerAxisUpdate",
    "category": "Controller",
    "position": {
      "x": -492,
      "y": -3276
    },
    "sampleGuid": "806cf1c6-87cb-40dc-aa73-f18be109f164",
    "version": "A",
    "isEvent": true,
    "defaultValues": [],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnControllerButtonPressed": {
    "name": "OnControllerButtonPressed",
    "fullType": "Banter.VisualScripting.OnControllerButtonPressed",
    "category": "Controller",
    "position": {
      "x": -324,
      "y": -3264
    },
    "sampleGuid": "5a194b5e-6276-4fc0-a51b-d285a086a4a4",
    "version": "A",
    "isEvent": true,
    "defaultValues": [],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnControllerButtonReleased": {
    "name": "OnControllerButtonReleased",
    "fullType": "Banter.VisualScripting.OnControllerButtonReleased",
    "category": "Controller",
    "position": {
      "x": -132,
      "y": -3264
    },
    "sampleGuid": "2d7ce5ba-8c3a-4ad0-ac77-1a572a0b760f",
    "version": "A",
    "isEvent": true,
    "defaultValues": [],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnTriggerAxisUpdate": {
    "name": "OnTriggerAxisUpdate",
    "fullType": "Banter.VisualScripting.OnTriggerAxisUpdate",
    "category": "Controller",
    "position": {
      "x": 60,
      "y": -3264
    },
    "sampleGuid": "dc9d427d-09ff-46bf-b903-98e043059c55",
    "version": "A",
    "isEvent": true,
    "defaultValues": [],
    "serializedFields": {
      "coroutine": false
    }
  },
  "SelectFile": {
    "name": "SelectFile",
    "fullType": "Banter.VisualScripting.SelectFile",
    "category": "File",
    "position": {
      "x": -552,
      "y": 432
    },
    "sampleGuid": "322bf42e-ac1b-4854-93d0-af8af9a27762",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Type",
        "type": "Banter.SDK.SelectFileType",
        "defaultValue": "GLB"
      }
    ],
    "serializedFields": {}
  },
  "OnSelectFile": {
    "name": "OnSelectFile",
    "fullType": "Banter.VisualScripting.OnSelectFile",
    "category": "Files",
    "position": {
      "x": -492,
      "y": -2976
    },
    "sampleGuid": "7de41d53-8af8-42f8-aa94-54d89f909a00",
    "version": "A",
    "isEvent": true,
    "defaultValues": [],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnGrab": {
    "name": "OnGrab",
    "fullType": "Banter.VisualScripting.OnGrab",
    "category": "Held Events",
    "position": {
      "x": -516,
      "y": -2712
    },
    "sampleGuid": "de8a6871-bb28-4be4-96e2-887ecd2a09d5",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "banterHeldEvents",
        "type": null,
        "defaultValue": null
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnGunTrigger": {
    "name": "OnGunTrigger",
    "fullType": "Banter.VisualScripting.OnGunTrigger",
    "category": "Held Events",
    "position": {
      "x": -264,
      "y": -2712
    },
    "sampleGuid": "61d8e252-c385-470d-85aa-fce281feafa2",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "banterHeldEvents",
        "type": null,
        "defaultValue": null
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnPrimaryDown": {
    "name": "OnPrimaryDown",
    "fullType": "Banter.VisualScripting.OnPrimaryDown",
    "category": "Held Events",
    "position": {
      "x": -36,
      "y": -2712
    },
    "sampleGuid": "b9e7c592-8bbd-4cfe-a80a-26397ca65895",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "banterHeldEvents",
        "type": null,
        "defaultValue": null
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnPrimaryUp": {
    "name": "OnPrimaryUp",
    "fullType": "Banter.VisualScripting.OnPrimaryUp",
    "category": "Held Events",
    "position": {
      "x": 192,
      "y": -2712
    },
    "sampleGuid": "7ce9f468-b5ad-4912-91db-1a1f5f381789",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "banterHeldEvents",
        "type": null,
        "defaultValue": null
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnRelease": {
    "name": "OnRelease",
    "fullType": "Banter.VisualScripting.OnRelease",
    "category": "Held Events",
    "position": {
      "x": 420,
      "y": -2712
    },
    "sampleGuid": "a1159f0d-e0c2-4936-a4e7-40aea5b21971",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "banterHeldEvents",
        "type": null,
        "defaultValue": null
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnSecondaryDown": {
    "name": "OnSecondaryDown",
    "fullType": "Banter.VisualScripting.OnSecondaryDown",
    "category": "Held Events",
    "position": {
      "x": 648,
      "y": -2712
    },
    "sampleGuid": "660e9ac8-71cf-4026-8351-5fd00d6e3d86",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "banterHeldEvents",
        "type": null,
        "defaultValue": null
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnSecondaryUp": {
    "name": "OnSecondaryUp",
    "fullType": "Banter.VisualScripting.OnSecondaryUp",
    "category": "Held Events",
    "position": {
      "x": 864,
      "y": -2712
    },
    "sampleGuid": "a79a4549-a067-421c-bc69-1c79ee2a0283",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "banterHeldEvents",
        "type": null,
        "defaultValue": null
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnThumbClickDown": {
    "name": "OnThumbClickDown",
    "fullType": "Banter.VisualScripting.OnThumbClickDown",
    "category": "Held Events",
    "position": {
      "x": 1080,
      "y": -2712
    },
    "sampleGuid": "9a77d327-0db5-4be0-ad3a-16cdaa9e402f",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "banterHeldEvents",
        "type": null,
        "defaultValue": null
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnThumbClickUp": {
    "name": "OnThumbClickUp",
    "fullType": "Banter.VisualScripting.OnThumbClickUp",
    "category": "Held Events",
    "position": {
      "x": 1296,
      "y": -2712
    },
    "sampleGuid": "5ed21b77-783b-43da-9c06-24990663bc2f",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "banterHeldEvents",
        "type": null,
        "defaultValue": null
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnThumbstick": {
    "name": "OnThumbstick",
    "fullType": "Banter.VisualScripting.OnThumbstick",
    "category": "Held Events",
    "position": {
      "x": 1524,
      "y": -2712
    },
    "sampleGuid": "5cab16c5-f22f-42f0-8330-32036fd3dd87",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "banterHeldEvents",
        "type": null,
        "defaultValue": null
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnTrigger": {
    "name": "OnTrigger",
    "fullType": "Banter.VisualScripting.OnTrigger",
    "category": "Held Events",
    "position": {
      "x": 1752,
      "y": -2712
    },
    "sampleGuid": "f2d9f06c-b1b2-49bb-aa8f-3a704b4f3a99",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "banterHeldEvents",
        "type": null,
        "defaultValue": null
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "ClearScores": {
    "name": "ClearScores",
    "fullType": "Banter.VisualScripting.ClearScores",
    "category": "Leaderboard",
    "position": {
      "x": -528,
      "y": 648
    },
    "sampleGuid": "494e0087-9bb5-48c6-b60b-0345fcb06c01",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Board",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "GetCurrentLeaderboard": {
    "name": "GetCurrentLeaderboard",
    "fullType": "Banter.VisualScripting.GetCurrentLeaderboard",
    "category": "Leaderboard",
    "position": {
      "x": -348,
      "y": 648
    },
    "sampleGuid": "35a9af69-5097-4b40-bd58-652065063d0d",
    "version": "A",
    "isEvent": false,
    "defaultValues": [],
    "serializedFields": {}
  },
  "LeaderboardError": {
    "name": "LeaderboardError",
    "fullType": "Banter.VisualScripting.LeaderboardError",
    "category": "Leaderboard",
    "position": {
      "x": -516,
      "y": -2448
    },
    "sampleGuid": "a1929a3a-a28c-4c9e-a3da-65388de9e7b1",
    "version": "A",
    "isEvent": true,
    "defaultValues": [],
    "serializedFields": {
      "coroutine": false
    }
  },
  "LeaderboardUpdate": {
    "name": "LeaderboardUpdate",
    "fullType": "Banter.VisualScripting.LeaderboardUpdate",
    "category": "Leaderboard",
    "position": {
      "x": -288,
      "y": -2460
    },
    "sampleGuid": "000f2c71-20f2-4f3c-ab85-3236853073ae",
    "version": "A",
    "isEvent": true,
    "defaultValues": [],
    "serializedFields": {
      "coroutine": false
    }
  },
  "SetScore": {
    "name": "SetScore",
    "fullType": "Banter.VisualScripting.SetScore",
    "category": "Leaderboard",
    "position": {
      "x": -96,
      "y": 648
    },
    "sampleGuid": "5240cd45-4824-4b4e-ab3f-d5cfe4e2e82e",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Board",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Sort",
        "type": "Banter.VisualScripting.SortType",
        "defaultValue": "ASC"
      },
      {
        "name": "Score",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Unique",
        "type": "System.Boolean",
        "defaultValue": false
      }
    ],
    "serializedFields": {}
  },
  "LoadAudioUrl": {
    "name": "LoadAudioUrl",
    "fullType": "Banter.VisualScripting.LoadAudioUrl",
    "category": "Networking",
    "position": {
      "x": -528,
      "y": 960
    },
    "sampleGuid": "6826914d-f478-4290-9f15-3ea5eaab0d82",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "URL",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Audio Type",
        "type": "UnityEngine.AudioType",
        "defaultValue": "UNKNOWN"
      }
    ],
    "serializedFields": {}
  },
  "LoadTextureUrl": {
    "name": "LoadTextureUrl",
    "fullType": "Banter.VisualScripting.LoadTextureUrl",
    "category": "Networking",
    "position": {
      "x": 144,
      "y": 972
    },
    "sampleGuid": "3585d7bd-c929-4dd0-9119-33699ff69116",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "URL",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Generate Mipmaps",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {}
  },
  "LoadTextUrl": {
    "name": "LoadTextUrl",
    "fullType": "Banter.VisualScripting.LoadTextUrl",
    "category": "Networking",
    "position": {
      "x": -192,
      "y": 960
    },
    "sampleGuid": "808aeb3f-928c-490c-ac69-5dd542735ad1",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "URL",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Method",
        "type": "System.String",
        "defaultValue": "GET"
      },
      {
        "name": "Body",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "ContentType",
        "type": "System.String",
        "defaultValue": "application/json"
      }
    ],
    "serializedFields": {}
  },
  "OnOneShot": {
    "name": "OnOneShot",
    "fullType": "Banter.VisualScripting.OnOneShot",
    "category": "Networking",
    "position": {
      "x": -528,
      "y": -2184
    },
    "sampleGuid": "cb03fd55-b8bc-4c8f-b9eb-99baec2e1699",
    "version": "A",
    "isEvent": true,
    "defaultValues": [],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnSpaceStatePropsChanged": {
    "name": "OnSpaceStatePropsChanged",
    "fullType": "Banter.VisualScripting.OnSpaceStatePropsChanged",
    "category": "Networking",
    "position": {
      "x": -324,
      "y": -2184
    },
    "sampleGuid": "135db947-4444-48d7-8460-76cdc27045ac",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "Property Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "SendOneShot": {
    "name": "SendOneShot",
    "fullType": "Banter.VisualScripting.SendOneShot",
    "category": "Networking",
    "position": {
      "x": 432,
      "y": 984
    },
    "sampleGuid": "c809df48-a6ef-4278-96bd-437ebcf825cb",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Data",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "All Instances",
        "type": "System.Boolean",
        "defaultValue": false
      }
    ],
    "serializedFields": {}
  },
  "SetSpaceStateProp": {
    "name": "SetSpaceStateProp",
    "fullType": "Banter.VisualScripting.SetSpaceStateProp",
    "category": "Networking",
    "position": {
      "x": 636,
      "y": 984
    },
    "sampleGuid": "ef247c98-615c-4412-b500-233114e2be49",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Property Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Value",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Is Public Property?",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {}
  },
  "SetCanCrouch": {
    "name": "SetCanCrouch",
    "fullType": "Banter.VisualScripting.SetCanCrouch",
    "category": "Player/Actions",
    "position": {
      "x": -576,
      "y": 1284
    },
    "sampleGuid": "3db9a378-ed3e-4fdf-91f8-eb0ab237c23b",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Can Crouch",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {}
  },
  "SetCanGrab": {
    "name": "SetCanGrab",
    "fullType": "Banter.VisualScripting.SetCanGrab",
    "category": "Player/Actions",
    "position": {
      "x": -372,
      "y": 1284
    },
    "sampleGuid": "9d79e0c1-023c-4708-92fd-a7d8d400fd67",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Can Grab",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {}
  },
  "SetCanGrapple": {
    "name": "SetCanGrapple",
    "fullType": "Banter.VisualScripting.SetCanGrapple",
    "category": "Player/Actions",
    "position": {
      "x": -180,
      "y": 1284
    },
    "sampleGuid": "cef94bea-51d3-4663-a840-39094d711671",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Can Grapple",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {}
  },
  "SetCanJump": {
    "name": "SetCanJump",
    "fullType": "Banter.VisualScripting.SetCanJump",
    "category": "Player/Actions",
    "position": {
      "x": 24,
      "y": 1284
    },
    "sampleGuid": "aac3807b-f367-4797-954a-cec58f5f2bfc",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Can Jump",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {}
  },
  "SetCanMove": {
    "name": "SetCanMove",
    "fullType": "Banter.VisualScripting.SetCanMove",
    "category": "Player/Actions",
    "position": {
      "x": 204,
      "y": 1284
    },
    "sampleGuid": "a95ed859-3310-405a-8d96-8dbe7cd66577",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Can Move",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {}
  },
  "SetCanRotate": {
    "name": "SetCanRotate",
    "fullType": "Banter.VisualScripting.SetCanRotate",
    "category": "Player/Actions",
    "position": {
      "x": 384,
      "y": 1284
    },
    "sampleGuid": "a0360fac-bb15-44fb-9b2b-fd75abaf8ba9",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Can Rotate",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {}
  },
  "SetCanTeleport": {
    "name": "SetCanTeleport",
    "fullType": "Banter.VisualScripting.SetCanTeleport",
    "category": "Player/Actions",
    "position": {
      "x": 588,
      "y": 1284
    },
    "sampleGuid": "d87a6899-fa5c-4ef6-a2d2-11d4d24f02dd",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Can Teleport",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {}
  },
  "SetBlockLeftPrimary": {
    "name": "SetBlockLeftPrimary",
    "fullType": "Banter.VisualScripting.SetBlockLeftPrimary",
    "category": "Player/Input",
    "position": {
      "x": -576,
      "y": 1620
    },
    "sampleGuid": "15c0b33f-9c4d-44b6-a40e-2a469a9977d7",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Block Left Primary",
        "type": "System.Boolean",
        "defaultValue": false
      }
    ],
    "serializedFields": {}
  },
  "SetBlockLeftSecondary": {
    "name": "SetBlockLeftSecondary",
    "fullType": "Banter.VisualScripting.SetBlockLeftSecondary",
    "category": "Player/Input",
    "position": {
      "x": -324,
      "y": 1620
    },
    "sampleGuid": "f27160ec-e4d9-4592-9a07-8ecc37fa6e3a",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Block Left Secondary",
        "type": "System.Boolean",
        "defaultValue": false
      }
    ],
    "serializedFields": {}
  },
  "SetBlockLeftThumbstick": {
    "name": "SetBlockLeftThumbstick",
    "fullType": "Banter.VisualScripting.SetBlockLeftThumbstick",
    "category": "Player/Input",
    "position": {
      "x": -48,
      "y": 1620
    },
    "sampleGuid": "8fefb7c6-75a6-4a02-8d51-f70c30d2b1d2",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Block Left Thumbstick",
        "type": "System.Boolean",
        "defaultValue": false
      }
    ],
    "serializedFields": {}
  },
  "SetBlockLeftThumbstickClick": {
    "name": "SetBlockLeftThumbstickClick",
    "fullType": "Banter.VisualScripting.SetBlockLeftThumbstickClick",
    "category": "Player/Input",
    "position": {
      "x": 228,
      "y": 1620
    },
    "sampleGuid": "efe9c521-b2d9-4ada-ab8f-2500517ab03f",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Block Left Thumbstick Click",
        "type": "System.Boolean",
        "defaultValue": false
      }
    ],
    "serializedFields": {}
  },
  "SetBlockLeftTrigger": {
    "name": "SetBlockLeftTrigger",
    "fullType": "Banter.VisualScripting.SetBlockLeftTrigger",
    "category": "Player/Input",
    "position": {
      "x": 504,
      "y": 1620
    },
    "sampleGuid": "1c2aeec7-73ef-4efa-8f7f-ee49c1ea8ae4",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Block Left Trigger",
        "type": "System.Boolean",
        "defaultValue": false
      }
    ],
    "serializedFields": {}
  },
  "SetBlockRightPrimary": {
    "name": "SetBlockRightPrimary",
    "fullType": "Banter.VisualScripting.SetBlockRightPrimary",
    "category": "Player/Input",
    "position": {
      "x": -576,
      "y": 1776
    },
    "sampleGuid": "e8486e8b-e9e6-4c3f-8d6a-1d9a179e8744",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Block Right Primary",
        "type": "System.Boolean",
        "defaultValue": false
      }
    ],
    "serializedFields": {}
  },
  "SetBlockRightSecondary": {
    "name": "SetBlockRightSecondary",
    "fullType": "Banter.VisualScripting.SetBlockRightSecondary",
    "category": "Player/Input",
    "position": {
      "x": -324,
      "y": 1776
    },
    "sampleGuid": "cc15ae91-ba76-4ef2-8c3e-a8821b75cdb7",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Block Right Secondary",
        "type": "System.Boolean",
        "defaultValue": false
      }
    ],
    "serializedFields": {}
  },
  "SetBlockRightThumbstick": {
    "name": "SetBlockRightThumbstick",
    "fullType": "Banter.VisualScripting.SetBlockRightThumbstick",
    "category": "Player/Input",
    "position": {
      "x": -60,
      "y": 1776
    },
    "sampleGuid": "0715cbc5-55fe-4165-8f0f-12a14e20412d",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Block Right Thumbstick",
        "type": "System.Boolean",
        "defaultValue": false
      }
    ],
    "serializedFields": {}
  },
  "SetBlockRightThumbstickClick": {
    "name": "SetBlockRightThumbstickClick",
    "fullType": "Banter.VisualScripting.SetBlockRightThumbstickClick",
    "category": "Player/Input",
    "position": {
      "x": 228,
      "y": 1788
    },
    "sampleGuid": "5d13f3cf-5740-4d42-b0c2-2bc978792f4a",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Block Right Thumbstick Click",
        "type": "System.Boolean",
        "defaultValue": false
      }
    ],
    "serializedFields": {}
  },
  "SetBlockRightTrigger": {
    "name": "SetBlockRightTrigger",
    "fullType": "Banter.VisualScripting.SetBlockRightTrigger",
    "category": "Player/Input",
    "position": {
      "x": 504,
      "y": 1788
    },
    "sampleGuid": "a4dcaf23-100d-4b6f-b138-c5f24d283a76",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Block Right Trigger",
        "type": "System.Boolean",
        "defaultValue": false
      }
    ],
    "serializedFields": {}
  },
  "OnClick": {
    "name": "OnClick",
    "fullType": "Banter.VisualScripting.OnClick",
    "category": "PlayerEvents",
    "position": {
      "x": -516,
      "y": -1968
    },
    "sampleGuid": "daf0f13b-8e96-421b-ac84-590704eb32c9",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "banterPlayerEvents",
        "type": null,
        "defaultValue": null
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "GetSpaceURL": {
    "name": "GetSpaceURL",
    "fullType": "Banter.VisualScripting.GetSpaceURL",
    "category": "Space",
    "position": {
      "x": -552,
      "y": 2064
    },
    "sampleGuid": "3d249782-5df1-46c5-a7ac-821fe82a0516",
    "version": "A",
    "isEvent": false,
    "defaultValues": [],
    "serializedFields": {}
  },
  "GetUsers": {
    "name": "GetUsers",
    "fullType": "Banter.VisualScripting.GetUsers",
    "category": "Space",
    "position": {
      "x": -372,
      "y": 2064
    },
    "sampleGuid": "32d7e421-1daf-4d54-b35d-ef2525f69388",
    "version": "A",
    "isEvent": false,
    "defaultValues": [],
    "serializedFields": {}
  },
  "IsSpaceFavourited": {
    "name": "IsSpaceFavourited",
    "fullType": "Banter.VisualScripting.IsSpaceFavourited",
    "category": "Space",
    "position": {
      "x": -192,
      "y": 2064
    },
    "sampleGuid": "bcc861d1-a733-437b-bf86-6ea31aaf3005",
    "version": "A",
    "isEvent": false,
    "defaultValues": [],
    "serializedFields": {}
  },
  "OnGetUserState": {
    "name": "OnGetUserState",
    "fullType": "Banter.VisualScripting.OnGetUserState",
    "category": "Space",
    "position": {
      "x": -516,
      "y": -1752
    },
    "sampleGuid": "1c4bc4b2-e64d-4b22-b779-f52fa28d5b89",
    "version": "A",
    "isEvent": true,
    "defaultValues": [],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnBanterTriggerEnter": {
    "name": "OnBanterTriggerEnter",
    "fullType": "Banter.VisualScripting.OnBanterTriggerEnter",
    "category": "Trigger",
    "position": {
      "x": -528,
      "y": -1548
    },
    "sampleGuid": "4013e0b8-2619-4f4e-b696-c699e9b3869d",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "target",
        "type": null,
        "defaultValue": null
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "CreateUIElement": {
    "name": "CreateUIElement",
    "fullType": "Banter.VisualScripting.CreateUIElement",
    "category": "UI/Elements",
    "position": {
      "x": 4572,
      "y": 480
    },
    "sampleGuid": "f03c4e29-3cdf-4030-b6e3-ffae4dc32a5c",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element Type",
        "type": "Banter.VisualScripting.UIElementTypeVS",
        "defaultValue": "Button"
      },
      {
        "name": "gameObject",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Parent Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Parent Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "CreateUIBox": {
    "name": "CreateUIBox",
    "fullType": "Banter.VisualScripting.CreateUIBox",
    "category": "UI/Elements/Container",
    "position": {
      "x": 3828,
      "y": -312
    },
    "sampleGuid": "baf8407c-3e97-4fe6-8ed4-4d2536ad0840",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "gameObject",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Parent Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Parent Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "CreateUIFoldout": {
    "name": "CreateUIFoldout",
    "fullType": "Banter.VisualScripting.CreateUIFoldout",
    "category": "UI/Elements/Container",
    "position": {
      "x": 4176,
      "y": -312
    },
    "sampleGuid": "31c77e08-478d-4ac2-b13f-003d5dda1a97",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "gameObject",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Parent Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Parent Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Text",
        "type": "System.String",
        "defaultValue": "Foldout"
      },
      {
        "name": "Is Collapsed",
        "type": "System.Boolean",
        "defaultValue": false
      },
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "CreateUIScrollView": {
    "name": "CreateUIScrollView",
    "fullType": "Banter.VisualScripting.CreateUIScrollView",
    "category": "UI/Elements/Container",
    "position": {
      "x": 4524,
      "y": -312
    },
    "sampleGuid": "4f673214-2f7e-42be-8f63-dd9c1c5762f4",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "gameObject",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Parent Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Parent Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "CreateUIButton": {
    "name": "CreateUIButton",
    "fullType": "Banter.VisualScripting.CreateUIButton",
    "category": "UI/Elements/Controls",
    "position": {
      "x": 3816,
      "y": 96
    },
    "sampleGuid": "7320b2a3-5741-43d2-86b8-a1e2d0242902",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "gameObject",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Parent Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Parent Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Text",
        "type": "System.String",
        "defaultValue": "Button"
      },
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "CreateUIDropdown": {
    "name": "CreateUIDropdown",
    "fullType": "Banter.VisualScripting.CreateUIDropdown",
    "category": "UI/Elements/Controls",
    "position": {
      "x": 4152,
      "y": 96
    },
    "sampleGuid": "3eaa8ac1-8195-40ea-928a-02078f782852",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "gameObject",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Parent Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Parent Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Default Index",
        "type": "System.Int32",
        "defaultValue": 0
      },
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "CreateUIFloatField": {
    "name": "CreateUIFloatField",
    "fullType": "Banter.VisualScripting.CreateUIFloatField",
    "category": "UI/Elements/Controls",
    "position": {
      "x": 4500,
      "y": 108
    },
    "sampleGuid": "381b2437-78f3-47e5-b660-0733990d6bdd",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "gameObject",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Parent Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Parent Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Initial Value",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "CreateUIIntField": {
    "name": "CreateUIIntField",
    "fullType": "Banter.VisualScripting.CreateUIIntField",
    "category": "UI/Elements/Controls",
    "position": {
      "x": 4848,
      "y": 108
    },
    "sampleGuid": "d1568a7d-c9bc-4487-b586-8e1baad92170",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "gameObject",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Parent Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Parent Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Initial Value",
        "type": "System.Int32",
        "defaultValue": 0
      },
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "CreateUILabel": {
    "name": "CreateUILabel",
    "fullType": "Banter.VisualScripting.CreateUILabel",
    "category": "UI/Elements/Controls",
    "position": {
      "x": 5196,
      "y": 108
    },
    "sampleGuid": "1a035d09-0152-4df1-a4c2-8a7e0455ef32",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "gameObject",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Parent Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Parent Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Text",
        "type": "System.String",
        "defaultValue": "Label"
      },
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "CreateUISlider": {
    "name": "CreateUISlider",
    "fullType": "Banter.VisualScripting.CreateUISlider",
    "category": "UI/Elements/Controls",
    "position": {
      "x": 5532,
      "y": 108
    },
    "sampleGuid": "c474ffdf-d504-46ef-bb10-0480782eb9b0",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "gameObject",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Parent Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Parent Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Min Value",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Max Value",
        "type": "System.Single",
        "defaultValue": 100
      },
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "CreateUITextField": {
    "name": "CreateUITextField",
    "fullType": "Banter.VisualScripting.CreateUITextField",
    "category": "UI/Elements/Controls",
    "position": {
      "x": 5868,
      "y": 108
    },
    "sampleGuid": "ab474391-5660-4f45-a120-e8c03137ff94",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "gameObject",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Parent Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Parent Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Placeholder",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Initial Value",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Is Password",
        "type": "System.Boolean",
        "defaultValue": false
      },
      {
        "name": "Is Multiline",
        "type": "System.Boolean",
        "defaultValue": false
      },
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "CreateUIToggle": {
    "name": "CreateUIToggle",
    "fullType": "Banter.VisualScripting.CreateUIToggle",
    "category": "UI/Elements/Controls",
    "position": {
      "x": 6204,
      "y": 108
    },
    "sampleGuid": "63ce6003-bd30-4bbe-804d-032237e2b982",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "gameObject",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Parent Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Parent Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Checked",
        "type": "System.Boolean",
        "defaultValue": false
      },
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "CreateUIImage": {
    "name": "CreateUIImage",
    "fullType": "Banter.VisualScripting.CreateUIImage",
    "category": "UI/Elements/Display",
    "position": {
      "x": 3804,
      "y": 504
    },
    "sampleGuid": "18cccc11-5396-4948-b555-3dd5d7b0b4a2",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "gameObject",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Parent Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Parent Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Texture",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Sprite",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Tint Color",
        "type": "UnityEngine.Color",
        "defaultValue": null
      },
      {
        "name": "Scale Mode",
        "type": "UnityEngine.ScaleMode",
        "defaultValue": "ScaleToFit"
      },
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "CreateUIProgressBar": {
    "name": "CreateUIProgressBar",
    "fullType": "Banter.VisualScripting.CreateUIProgressBar",
    "category": "UI/Elements/Display",
    "position": {
      "x": 4164,
      "y": 504
    },
    "sampleGuid": "055a093c-7dba-4a75-b970-a5c168a09991",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "gameObject",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Parent Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Parent Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Initial Value",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Min Value",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Max Value",
        "type": "System.Single",
        "defaultValue": 100
      },
      {
        "name": "Title",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "RegisterUIClick": {
    "name": "RegisterUIClick",
    "fullType": "Banter.VisualScripting.RegisterUIClick",
    "category": "UI/Events",
    "position": {
      "x": 3780,
      "y": 1104
    },
    "sampleGuid": "806e834e-f33c-42fe-8b4e-3f649be96023",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "RegisterUIEvent": {
    "name": "RegisterUIEvent",
    "fullType": "Banter.VisualScripting.RegisterUIEvent",
    "category": "UI/Events",
    "position": {
      "x": 4008,
      "y": 1104
    },
    "sampleGuid": "ebd120ce-c76c-4432-86cb-d185917769fb",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Event Type",
        "type": "Banter.UI.Bridge.UIEventType",
        "defaultValue": "Click"
      }
    ],
    "serializedFields": {}
  },
  "AttachUIChild": {
    "name": "AttachUIChild",
    "fullType": "Banter.VisualScripting.AttachUIChild",
    "category": "UI/Hierarchy",
    "position": {
      "x": 3756,
      "y": 1524
    },
    "sampleGuid": "c9ae64e5-2879-4fab-affd-017c31ce6042",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Parent Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Parent Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Child Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Child Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Index",
        "type": "System.Int32",
        "defaultValue": -1
      }
    ],
    "serializedFields": {}
  },
  "DestroyUIElement": {
    "name": "DestroyUIElement",
    "fullType": "Banter.VisualScripting.DestroyUIElement",
    "category": "UI/Hierarchy",
    "position": {
      "x": 4020,
      "y": 1536
    },
    "sampleGuid": "19d2f7d9-dd81-4f0f-8b9c-4b688105cc96",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "DetachUIChild": {
    "name": "DetachUIChild",
    "fullType": "Banter.VisualScripting.DetachUIChild",
    "category": "UI/Hierarchy",
    "position": {
      "x": 4248,
      "y": 1536
    },
    "sampleGuid": "4a1d95f0-bdca-4c1f-88d6-63f82d0b2f5e",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Parent Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Parent Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Child Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Child Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "SetUIParent": {
    "name": "SetUIParent",
    "fullType": "Banter.VisualScripting.SetUIParent",
    "category": "UI/Hierarchy",
    "position": {
      "x": 4512,
      "y": 1536
    },
    "sampleGuid": "63302ae4-5703-426c-90c4-e8bb2251851a",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "New Parent ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "New Parent Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "CreateUIPanel": {
    "name": "CreateUIPanel",
    "fullType": "Banter.VisualScripting.CreateUIPanel",
    "category": "UI/Panel",
    "position": {
      "x": 3768,
      "y": 2040
    },
    "sampleGuid": "b8e0652e-ee77-4b2b-97b9-51e291bb5f06",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "gameObject",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Resolution",
        "type": "UnityEngine.Vector2",
        "defaultValue": null
      },
      {
        "name": "Screen Space",
        "type": "System.Boolean",
        "defaultValue": false
      }
    ],
    "serializedFields": {}
  },
  "DestroyUIPanel": {
    "name": "DestroyUIPanel",
    "fullType": "Banter.VisualScripting.DestroyUIPanel",
    "category": "UI/Panel",
    "position": {
      "x": 4032,
      "y": 2040
    },
    "sampleGuid": "6fe1047c-e6ae-41e8-a873-550dc279ffe5",
    "version": "A",
    "isEvent": false,
    "defaultValues": [],
    "serializedFields": {}
  },
  "GetUIPanel": {
    "name": "GetUIPanel",
    "fullType": "Banter.VisualScripting.GetUIPanel",
    "category": "UI/Panel",
    "position": {
      "x": 4224,
      "y": 2040
    },
    "sampleGuid": "e07a785a-2c4f-4c48-96bf-9235a3f399a9",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "gameObject",
        "type": null,
        "defaultValue": null
      }
    ],
    "serializedFields": {}
  },
  "GetUIProperty": {
    "name": "GetUIProperty",
    "fullType": "Banter.VisualScripting.GetUIProperty",
    "category": "UI/Properties",
    "position": {
      "x": 3756,
      "y": 3372
    },
    "sampleGuid": "14a807ed-ee6d-47c2-b27e-3ff454affe91",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Property",
        "type": "Banter.VisualScripting.UIPropertyNameVS",
        "defaultValue": "Text"
      }
    ],
    "serializedFields": {}
  },
  "SetUIProperty": {
    "name": "SetUIProperty",
    "fullType": "Banter.VisualScripting.SetUIProperty",
    "category": "UI/Properties",
    "position": {
      "x": 4080,
      "y": 3372
    },
    "sampleGuid": "e5200760-6e8d-48cb-99dd-0c7ba4f8529d",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Property",
        "type": "Banter.VisualScripting.UIPropertyNameVS",
        "defaultValue": "Text"
      }
    ],
    "serializedFields": {}
  },
  "SetUIEnabled": {
    "name": "SetUIEnabled",
    "fullType": "Banter.VisualScripting.SetUIEnabled",
    "category": "UI/Properties/State",
    "position": {
      "x": 3768,
      "y": 2532
    },
    "sampleGuid": "92d3f068-771c-4fa8-8b3e-71999bc3588e",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Enabled",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {}
  },
  "SetUIVisible": {
    "name": "SetUIVisible",
    "fullType": "Banter.VisualScripting.SetUIVisible",
    "category": "UI/Properties/State",
    "position": {
      "x": 4008,
      "y": 2544
    },
    "sampleGuid": "22e5c35f-26ac-475f-a7c2-2e477777c5d3",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Visible",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {}
  },
  "GetUIText": {
    "name": "GetUIText",
    "fullType": "Banter.VisualScripting.GetUIText",
    "category": "UI/Properties/Text",
    "position": {
      "x": 3756,
      "y": 2808
    },
    "sampleGuid": "6eefd591-510a-4f61-a1f0-19a57e7df840",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "SetUIText": {
    "name": "SetUIText",
    "fullType": "Banter.VisualScripting.SetUIText",
    "category": "UI/Properties/Text",
    "position": {
      "x": 4032,
      "y": 2808
    },
    "sampleGuid": "bc15c45f-7cde-4e59-9f64-3652005669a0",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Text",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "GetUIValue": {
    "name": "GetUIValue",
    "fullType": "Banter.VisualScripting.GetUIValue",
    "category": "UI/Properties/Value",
    "position": {
      "x": 3780,
      "y": 3072
    },
    "sampleGuid": "eed4d5b0-3dc2-4cc2-8b5e-905e57151fa4",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "SetUIValue": {
    "name": "SetUIValue",
    "fullType": "Banter.VisualScripting.SetUIValue",
    "category": "UI/Properties/Value",
    "position": {
      "x": 4032,
      "y": 3072
    },
    "sampleGuid": "b303988e-8449-4183-9ffe-2f63fd3b3a4b",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Value",
        "type": "System.Single",
        "defaultValue": 0
      }
    ],
    "serializedFields": {}
  },
  "GetUIStyle": {
    "name": "GetUIStyle",
    "fullType": "Banter.VisualScripting.GetUIStyle",
    "category": "UI/Styles",
    "position": {
      "x": 3744,
      "y": 5976
    },
    "sampleGuid": "972299d2-dad4-47e6-a3e8-c46c197fd422",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Style Property",
        "type": "Banter.UI.Bridge.UIStyleProperty",
        "defaultValue": "BackgroundColor"
      }
    ],
    "serializedFields": {}
  },
  "SetUIStyle": {
    "name": "SetUIStyle",
    "fullType": "Banter.VisualScripting.SetUIStyle",
    "category": "UI/Styles",
    "position": {
      "x": 4152,
      "y": 5976
    },
    "sampleGuid": "c7f8d09e-0e51-4a79-b959-4987cade5642",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Style Property",
        "type": "Banter.UI.Bridge.UIStyleProperty",
        "defaultValue": "BackgroundColor"
      },
      {
        "name": "Style Value",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "GetUIAppearance": {
    "name": "GetUIAppearance",
    "fullType": "Banter.VisualScripting.GetUIAppearance",
    "category": "UI/Styles/Appearance",
    "position": {
      "x": 3792,
      "y": 3984
    },
    "sampleGuid": "e6cd2dd5-dda5-4048-ae34-7e4421612e8e",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "GetUIBackground": {
    "name": "GetUIBackground",
    "fullType": "Banter.VisualScripting.GetUIBackground",
    "category": "UI/Styles/Appearance",
    "position": {
      "x": 4140,
      "y": 3972
    },
    "sampleGuid": "bf6d420e-5c76-4f1c-9443-f1c2d4b57e9c",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "SetUIAppearance": {
    "name": "SetUIAppearance",
    "fullType": "Banter.VisualScripting.SetUIAppearance",
    "category": "UI/Styles/Appearance",
    "position": {
      "x": 4488,
      "y": 3972
    },
    "sampleGuid": "2e0cce2b-e374-4eff-aec1-0659fd17cbb7",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Background Color",
        "type": "UnityEngine.Color",
        "defaultValue": null
      },
      {
        "name": "Opacity",
        "type": "System.Single",
        "defaultValue": 1
      },
      {
        "name": "Display",
        "type": "Banter.VisualScripting.UIDisplay",
        "defaultValue": "Flex"
      },
      {
        "name": "Visibility",
        "type": "Banter.VisualScripting.UIVisibility",
        "defaultValue": "Visible"
      }
    ],
    "serializedFields": {}
  },
  "SetUIBackground": {
    "name": "SetUIBackground",
    "fullType": "Banter.VisualScripting.SetUIBackground",
    "category": "UI/Styles/Appearance",
    "position": {
      "x": 4776,
      "y": 3972
    },
    "sampleGuid": "a782c82b-2faa-4dce-9998-3424cdf24946",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Background Type",
        "type": "Banter.VisualScripting.BackgroundType",
        "defaultValue": "Color"
      },
      {
        "name": "Texture",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Render Texture",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Sprite",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Vector Image",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Color",
        "type": "UnityEngine.Color",
        "defaultValue": null
      },
      {
        "name": "Tint Color",
        "type": "UnityEngine.Color",
        "defaultValue": null
      }
    ],
    "serializedFields": {}
  },
  "GetUIBorder": {
    "name": "GetUIBorder",
    "fullType": "Banter.VisualScripting.GetUIBorder",
    "category": "UI/Styles/Border",
    "position": {
      "x": 3792,
      "y": 4356
    },
    "sampleGuid": "01c6c469-1b14-44d2-97c4-2d80c505cbd3",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "SetUIBorder": {
    "name": "SetUIBorder",
    "fullType": "Banter.VisualScripting.SetUIBorder",
    "category": "UI/Styles/Border",
    "position": {
      "x": 4176,
      "y": 4356
    },
    "sampleGuid": "cd6b1fd9-93ed-48fd-8387-c95c7f163831",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Border Width",
        "type": "System.Single",
        "defaultValue": 1
      },
      {
        "name": "Border Color",
        "type": "UnityEngine.Color",
        "defaultValue": null
      },
      {
        "name": "Border Radius",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Top Left Radius",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Top Right Radius",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Bottom Left Radius",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Bottom Right Radius",
        "type": "System.Single",
        "defaultValue": 0
      }
    ],
    "serializedFields": {}
  },
  "GetUIFlexbox": {
    "name": "GetUIFlexbox",
    "fullType": "Banter.VisualScripting.GetUIFlexbox",
    "category": "UI/Styles/Layout",
    "position": {
      "x": 3744,
      "y": 4728
    },
    "sampleGuid": "0778619c-1827-41f9-bd43-96911fafb881",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "GetUIPosition": {
    "name": "GetUIPosition",
    "fullType": "Banter.VisualScripting.GetUIPosition",
    "category": "UI/Styles/Layout",
    "position": {
      "x": 4056,
      "y": 4728
    },
    "sampleGuid": "36bdc7a1-0eab-40b5-b627-1dbb47190e2b",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "GetUISize": {
    "name": "GetUISize",
    "fullType": "Banter.VisualScripting.GetUISize",
    "category": "UI/Styles/Layout",
    "position": {
      "x": 4344,
      "y": 4740
    },
    "sampleGuid": "f907e364-bef9-4e0c-8da0-2e2646191818",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "SetUIFlexbox": {
    "name": "SetUIFlexbox",
    "fullType": "Banter.VisualScripting.SetUIFlexbox",
    "category": "UI/Styles/Layout",
    "position": {
      "x": 4644,
      "y": 4728
    },
    "sampleGuid": "6290c752-266b-43ce-ba5a-39ce192128a3",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Flex Direction",
        "type": "Banter.VisualScripting.UIFlexDirection",
        "defaultValue": "Column"
      },
      {
        "name": "Justify Content",
        "type": "Banter.VisualScripting.UIJustifyContent",
        "defaultValue": "FlexStart"
      },
      {
        "name": "Align Items",
        "type": "Banter.VisualScripting.UIAlignItems",
        "defaultValue": "Stretch"
      },
      {
        "name": "Flex Wrap",
        "type": "Banter.VisualScripting.UIFlexWrap",
        "defaultValue": "NoWrap"
      },
      {
        "name": "Flex Grow",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Flex Shrink",
        "type": "System.Single",
        "defaultValue": 1
      }
    ],
    "serializedFields": {}
  },
  "SetUIPosition": {
    "name": "SetUIPosition",
    "fullType": "Banter.VisualScripting.SetUIPosition",
    "category": "UI/Styles/Layout",
    "position": {
      "x": 4944,
      "y": 4728
    },
    "sampleGuid": "fd087696-e4f5-4931-b1d7-6fb5d883b250",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Position",
        "type": "Banter.VisualScripting.UIPositionType",
        "defaultValue": "Relative"
      },
      {
        "name": "Left",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Top",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Right",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Bottom",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Left Unit",
        "type": "Banter.VisualScripting.LengthUnit",
        "defaultValue": "Pixel"
      },
      {
        "name": "Top Unit",
        "type": "Banter.VisualScripting.LengthUnit",
        "defaultValue": "Pixel"
      },
      {
        "name": "Right Unit",
        "type": "Banter.VisualScripting.LengthUnit",
        "defaultValue": "Pixel"
      },
      {
        "name": "Bottom Unit",
        "type": "Banter.VisualScripting.LengthUnit",
        "defaultValue": "Pixel"
      }
    ],
    "serializedFields": {}
  },
  "SetUISize": {
    "name": "SetUISize",
    "fullType": "Banter.VisualScripting.SetUISize",
    "category": "UI/Styles/Layout",
    "position": {
      "x": 5172,
      "y": 4728
    },
    "sampleGuid": "49ac667c-2019-40dc-b368-e3952ad510c1",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Width",
        "type": "System.Single",
        "defaultValue": 100
      },
      {
        "name": "Height",
        "type": "System.Single",
        "defaultValue": 50
      },
      {
        "name": "Width Unit",
        "type": "Banter.VisualScripting.SetUISize+LengthUnit",
        "defaultValue": "Pixel"
      },
      {
        "name": "Height Unit",
        "type": "Banter.VisualScripting.SetUISize+LengthUnit",
        "defaultValue": "Pixel"
      }
    ],
    "serializedFields": {}
  },
  "GetUISpacing": {
    "name": "GetUISpacing",
    "fullType": "Banter.VisualScripting.GetUISpacing",
    "category": "UI/Styles/Spacing",
    "position": {
      "x": 3756,
      "y": 5148
    },
    "sampleGuid": "ed43e83f-4f7d-4a9f-a96c-0c0bb32c9187",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "SetUISpacing": {
    "name": "SetUISpacing",
    "fullType": "Banter.VisualScripting.SetUISpacing",
    "category": "UI/Styles/Spacing",
    "position": {
      "x": 4104,
      "y": 5148
    },
    "sampleGuid": "c81162b8-27f4-429a-9165-9da485579a90",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Margin Top",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Margin Right",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Margin Bottom",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Margin Left",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Padding Top",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Padding Right",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Padding Bottom",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Padding Left",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Unit",
        "type": "Banter.VisualScripting.LengthUnit",
        "defaultValue": "Pixel"
      }
    ],
    "serializedFields": {}
  },
  "GetUITypography": {
    "name": "GetUITypography",
    "fullType": "Banter.VisualScripting.GetUITypography",
    "category": "UI/Styles/Typography",
    "position": {
      "x": 3744,
      "y": 5592
    },
    "sampleGuid": "9d80edaa-fe1f-4573-aca5-394f897259b1",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "SetUITypography": {
    "name": "SetUITypography",
    "fullType": "Banter.VisualScripting.SetUITypography",
    "category": "UI/Styles/Typography",
    "position": {
      "x": 4080,
      "y": 5580
    },
    "sampleGuid": "4c4300ed-e742-41e0-bfb1-c9c63d6f5a46",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Font Size",
        "type": "System.Single",
        "defaultValue": 14
      },
      {
        "name": "Font Style",
        "type": "Banter.VisualScripting.UIFontStyle",
        "defaultValue": "Normal"
      },
      {
        "name": "Font Weight",
        "type": "Banter.VisualScripting.UIFontWeight",
        "defaultValue": "Normal"
      },
      {
        "name": "Text Align",
        "type": "Banter.VisualScripting.UITextAlign",
        "defaultValue": "Left"
      },
      {
        "name": "Text Color",
        "type": "UnityEngine.Color",
        "defaultValue": null
      },
      {
        "name": "Line Height",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Letter Spacing",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "White Space",
        "type": "Banter.VisualScripting.UIWhiteSpace",
        "defaultValue": "Normal"
      }
    ],
    "serializedFields": {}
  },
  "LoadUXMLAsset": {
    "name": "LoadUXMLAsset",
    "fullType": "Banter.VisualScripting.LoadUXMLAsset",
    "category": "UI/UXML",
    "position": {
      "x": 3780,
      "y": 6600
    },
    "sampleGuid": "4cd738f9-dfb6-4e45-bd6b-4c10067a3d38",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "gameObject",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "UXML Asset",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Resource Path",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "ProcessUXMLTree": {
    "name": "ProcessUXMLTree",
    "fullType": "Banter.VisualScripting.ProcessUXMLTree",
    "category": "UI/UXML",
    "position": {
      "x": 4152,
      "y": 6624
    },
    "sampleGuid": "fcc34a9d-ea39-428e-88bd-65084e4839ca",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "gameObject",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "UI Document",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Element Prefix",
        "type": "System.String",
        "defaultValue": "uxml"
      }
    ],
    "serializedFields": {}
  },
  "OnDropdownChanged": {
    "name": "OnDropdownChanged",
    "fullType": "Banter.VisualScripting.OnDropdownChanged",
    "category": "Ungrouped",
    "position": {
      "x": 3924,
      "y": -3576
    },
    "sampleGuid": "ccd86e5b-5994-4d46-8612-aaf8f260235c",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Auto Register",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnIntFieldChanged": {
    "name": "OnIntFieldChanged",
    "fullType": "Banter.VisualScripting.OnIntFieldChanged",
    "category": "Ungrouped",
    "position": {
      "x": 3924,
      "y": -3384
    },
    "sampleGuid": "771bf63e-8838-49e0-8826-a972ee2a9672",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Auto Register",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnMinMaxSliderChanged": {
    "name": "OnMinMaxSliderChanged",
    "fullType": "Banter.VisualScripting.OnMinMaxSliderChanged",
    "category": "Ungrouped",
    "position": {
      "x": 3924,
      "y": -3204
    },
    "sampleGuid": "050878c5-78b0-4735-b25b-e622cfcf4d77",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Auto Register",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnRadioButtonChanged": {
    "name": "OnRadioButtonChanged",
    "fullType": "Banter.VisualScripting.OnRadioButtonChanged",
    "category": "Ungrouped",
    "position": {
      "x": 3924,
      "y": -2988
    },
    "sampleGuid": "16931f10-edd2-4caf-ae6e-4a1c7c17d548",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Auto Register",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnRadioButtonGroupChanged": {
    "name": "OnRadioButtonGroupChanged",
    "fullType": "Banter.VisualScripting.OnRadioButtonGroupChanged",
    "category": "Ungrouped",
    "position": {
      "x": 3924,
      "y": -2832
    },
    "sampleGuid": "13efcdc9-6ff4-4b2e-b0fd-8653a3ecc3a5",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Auto Register",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnSliderChanged": {
    "name": "OnSliderChanged",
    "fullType": "Banter.VisualScripting.OnSliderChanged",
    "category": "Ungrouped",
    "position": {
      "x": 3936,
      "y": -2652
    },
    "sampleGuid": "c8b5e8af-f0a6-4d72-9626-1a9b75a20903",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Auto Register",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnSliderIntChanged": {
    "name": "OnSliderIntChanged",
    "fullType": "Banter.VisualScripting.OnSliderIntChanged",
    "category": "Ungrouped",
    "position": {
      "x": 3924,
      "y": -2472
    },
    "sampleGuid": "b6d311b7-49c3-4fcc-b47e-066409df0ec4",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Auto Register",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnTextFieldChanged": {
    "name": "OnTextFieldChanged",
    "fullType": "Banter.VisualScripting.OnTextFieldChanged",
    "category": "Ungrouped",
    "position": {
      "x": 3912,
      "y": -2292
    },
    "sampleGuid": "2671b6c9-173f-4c70-af11-48f739a80de8",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Auto Register",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnToggleChanged": {
    "name": "OnToggleChanged",
    "fullType": "Banter.VisualScripting.OnToggleChanged",
    "category": "Ungrouped",
    "position": {
      "x": 3912,
      "y": -2136
    },
    "sampleGuid": "6c2748c8-80f8-4c0f-bb23-bd6a24e39518",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Auto Register",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnUIChange": {
    "name": "OnUIChange",
    "fullType": "Banter.VisualScripting.OnUIChange",
    "category": "Ungrouped",
    "position": {
      "x": 3900,
      "y": -1980
    },
    "sampleGuid": "b63c21a4-5316-4948-9b0f-a2d834332a60",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Auto Register",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnUIClick": {
    "name": "OnUIClick",
    "fullType": "Banter.VisualScripting.OnUIClick",
    "category": "Ungrouped",
    "position": {
      "x": 3900,
      "y": -1800
    },
    "sampleGuid": "7ba2d564-c626-4b1c-a1e1-99fa6e404143",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Auto Register",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnUIKeyboardEvent": {
    "name": "OnUIKeyboardEvent",
    "fullType": "Banter.VisualScripting.OnUIKeyboardEvent",
    "category": "Ungrouped",
    "position": {
      "x": 3900,
      "y": -1620
    },
    "sampleGuid": "8461695a-a585-4492-a88f-02c15930f853",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Keyboard Event",
        "type": "Banter.VisualScripting.UIKeyboardEventType",
        "defaultValue": "KeyDown"
      },
      {
        "name": "Auto Register",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnUIMouseEvent": {
    "name": "OnUIMouseEvent",
    "fullType": "Banter.VisualScripting.OnUIMouseEvent",
    "category": "Ungrouped",
    "position": {
      "x": 3888,
      "y": -1428
    },
    "sampleGuid": "80b07938-0c2b-4790-bcb6-3c0e5e2e11f0",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "Element ID",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Element Name",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Mouse Event",
        "type": "Banter.VisualScripting.UIMouseEventType",
        "defaultValue": "Click"
      },
      {
        "name": "Auto Register",
        "type": "System.Boolean",
        "defaultValue": true
      }
    ],
    "serializedFields": {
      "coroutine": false
    }
  },
  "AddPlayerForce": {
    "name": "AddPlayerForce",
    "fullType": "Banter.VisualScripting.AddPlayerForce",
    "category": "User",
    "position": {
      "x": -564,
      "y": 2316
    },
    "sampleGuid": "6bc7a8d3-be3c-4284-ad67-c67f10a26951",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Force",
        "type": "UnityEngine.Vector3",
        "defaultValue": null
      },
      {
        "name": "Mode",
        "type": "UnityEngine.ForceMode",
        "defaultValue": "Force"
      }
    ],
    "serializedFields": {}
  },
  "AddToastMessage": {
    "name": "AddToastMessage",
    "fullType": "Banter.VisualScripting.AddToastMessage",
    "category": "User",
    "position": {
      "x": -360,
      "y": 2316
    },
    "sampleGuid": "0b0a98e9-4598-420d-849e-1cb4774d7574",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Message",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Color",
        "type": "UnityEngine.Color",
        "defaultValue": null
      },
      {
        "name": "Timeout",
        "type": "System.Int32",
        "defaultValue": 5
      },
      {
        "name": "Delay",
        "type": "System.Int32",
        "defaultValue": 0
      }
    ],
    "serializedFields": {}
  },
  "GetLocalUserInfo": {
    "name": "GetLocalUserInfo",
    "fullType": "Banter.VisualScripting.GetLocalUserInfo",
    "category": "User",
    "position": {
      "x": 120,
      "y": 2328
    },
    "sampleGuid": "eb8830c9-bcdd-4e7b-a724-65dd6cb49b16",
    "version": "A",
    "isEvent": false,
    "defaultValues": [],
    "serializedFields": {}
  },
  "GetLocalUserState": {
    "name": "GetLocalUserState",
    "fullType": "Banter.VisualScripting.GetLocalUserState",
    "category": "User",
    "position": {
      "x": 804,
      "y": 2328
    },
    "sampleGuid": "0fdaa720-5eea-4dbc-b1d9-513392cc41ad",
    "version": "A",
    "isEvent": false,
    "defaultValues": [],
    "serializedFields": {}
  },
  "GetUserInfo": {
    "name": "GetUserInfo",
    "fullType": "Banter.VisualScripting.GetUserInfo",
    "category": "User",
    "position": {
      "x": -144,
      "y": 2316
    },
    "sampleGuid": "7d68deb6-50f1-4c57-b4cf-ee4656b07177",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "id, uid, or name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "GetUserLanguage": {
    "name": "GetUserLanguage",
    "fullType": "Banter.VisualScripting.GetUserLanguage",
    "category": "User",
    "position": {
      "x": 312,
      "y": 2328
    },
    "sampleGuid": "d8006260-4627-4fa4-bdcc-6497aa95ad0f",
    "version": "A",
    "isEvent": false,
    "defaultValues": [],
    "serializedFields": {}
  },
  "GetUserSavedValue": {
    "name": "GetUserSavedValue",
    "fullType": "Banter.VisualScripting.GetUserSavedValue",
    "category": "User",
    "position": {
      "x": 1008,
      "y": 2328
    },
    "sampleGuid": "ba1bc049-6f29-4ec6-9415-98efc902ebed",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Key",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "UserId Or Me",
        "type": "System.String",
        "defaultValue": "me"
      }
    ],
    "serializedFields": {}
  },
  "GetUserState": {
    "name": "GetUserState",
    "fullType": "Banter.VisualScripting.GetUserState",
    "category": "User",
    "position": {
      "x": 540,
      "y": 2328
    },
    "sampleGuid": "bd79e98b-27c8-478f-898e-bc3b27857deb",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "id, uid, or name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "GetVoiceVolume": {
    "name": "GetVoiceVolume",
    "fullType": "Banter.VisualScripting.GetVoiceVolume",
    "category": "User",
    "position": {
      "x": 1716,
      "y": 2328
    },
    "sampleGuid": "d63fe1ce-cef7-40db-abb5-6f74884fc3ac",
    "version": "A",
    "isEvent": false,
    "defaultValues": [],
    "serializedFields": {}
  },
  "LockPlayer": {
    "name": "LockPlayer",
    "fullType": "Banter.VisualScripting.LockPlayer",
    "category": "User",
    "position": {
      "x": 1932,
      "y": 2328
    },
    "sampleGuid": "d0e22329-35c8-4fa4-bb43-c9b53136aa2e",
    "version": "A",
    "isEvent": false,
    "defaultValues": [],
    "serializedFields": {}
  },
  "OnUserJoined": {
    "name": "OnUserJoined",
    "fullType": "Banter.VisualScripting.OnUserJoined",
    "category": "User",
    "position": {
      "x": -540,
      "y": -1308
    },
    "sampleGuid": "d70e2059-8cf2-42fe-bcc6-b8856f6d79e6",
    "version": "A",
    "isEvent": true,
    "defaultValues": [],
    "serializedFields": {
      "coroutine": false
    }
  },
  "OnUserLeft": {
    "name": "OnUserLeft",
    "fullType": "Banter.VisualScripting.OnUserLeft",
    "category": "User",
    "position": {
      "x": -372,
      "y": -1308
    },
    "sampleGuid": "b1e25679-865d-44ea-8a1a-35c0fb6b8c2b",
    "version": "A",
    "isEvent": true,
    "defaultValues": [],
    "serializedFields": {
      "coroutine": false
    }
  },
  "RemoveUserSavedValue": {
    "name": "RemoveUserSavedValue",
    "fullType": "Banter.VisualScripting.RemoveUserSavedValue",
    "category": "User",
    "position": {
      "x": 1476,
      "y": 2328
    },
    "sampleGuid": "f501c668-36ec-4f4f-969a-a4aa8968024e",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Key",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "UserId Or Me",
        "type": "System.String",
        "defaultValue": "me"
      }
    ],
    "serializedFields": {}
  },
  "SetAvatar": {
    "name": "SetAvatar",
    "fullType": "Banter.VisualScripting.SetAvatar",
    "category": "User",
    "position": {
      "x": 2316,
      "y": 2328
    },
    "sampleGuid": "8508747d-96cd-406f-b9f7-8e25682a17ef",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Local Avatar URL",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "Remote Avatar URL",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "SetUserSavedValue": {
    "name": "SetUserSavedValue",
    "fullType": "Banter.VisualScripting.SetUserSavedValue",
    "category": "User",
    "position": {
      "x": 1248,
      "y": 2328
    },
    "sampleGuid": "67914ffd-7c61-49e1-af11-2c11960bf21e",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Key",
        "type": "System.String",
        "defaultValue": ""
      },
      {
        "name": "UserId Or Me",
        "type": "System.String",
        "defaultValue": "me"
      },
      {
        "name": "Value",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "TeleportTo": {
    "name": "TeleportTo",
    "fullType": "Banter.VisualScripting.TeleportTo",
    "category": "User",
    "position": {
      "x": 2568,
      "y": 2328
    },
    "sampleGuid": "cdf1dbbc-06d4-40fa-b341-23c2b445f028",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Position",
        "type": "UnityEngine.Vector3",
        "defaultValue": null
      },
      {
        "name": "Rotation",
        "type": "System.Single",
        "defaultValue": 0
      },
      {
        "name": "Rotation Vector",
        "type": "UnityEngine.Vector3",
        "defaultValue": null
      },
      {
        "name": "Stop Velocity",
        "type": "System.Boolean",
        "defaultValue": false
      },
      {
        "name": "Is Spawn",
        "type": "System.Boolean",
        "defaultValue": false
      }
    ],
    "serializedFields": {}
  },
  "UnlockPlayer": {
    "name": "UnlockPlayer",
    "fullType": "Banter.VisualScripting.UnlockPlayer",
    "category": "User",
    "position": {
      "x": 2112,
      "y": 2328
    },
    "sampleGuid": "d553f2e1-4384-4944-81c0-f0128b45e8e5",
    "version": "A",
    "isEvent": false,
    "defaultValues": [],
    "serializedFields": {}
  },
  "AudioListenerSpectrumData": {
    "name": "AudioListenerSpectrumData",
    "fullType": "Banter.VisualScripting.AudioListenerSpectrumData",
    "category": "Utils",
    "position": {
      "x": 84,
      "y": 2784
    },
    "sampleGuid": "f588b002-c1f7-44dc-85d2-dd118e7ca26e",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Channels",
        "type": "System.Int32",
        "defaultValue": 64
      },
      {
        "name": "Window",
        "type": "UnityEngine.FFTWindow",
        "defaultValue": "Rectangular"
      }
    ],
    "serializedFields": {}
  },
  "AudioSourceSpectrumData": {
    "name": "AudioSourceSpectrumData",
    "fullType": "Banter.VisualScripting.AudioSourceSpectrumData",
    "category": "Utils",
    "position": {
      "x": 432,
      "y": 2784
    },
    "sampleGuid": "8650bd67-8035-408d-9750-174630b47979",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "AudioSource",
        "type": null,
        "defaultValue": null
      },
      {
        "name": "Channels",
        "type": "System.Int32",
        "defaultValue": 64
      },
      {
        "name": "Window",
        "type": "UnityEngine.FFTWindow",
        "defaultValue": "Rectangular"
      }
    ],
    "serializedFields": {}
  },
  "ColorUtilityTryParseHtmlString": {
    "name": "ColorUtilityTryParseHtmlString",
    "fullType": "Banter.VisualScripting.ColorUtilityTryParseHtmlString",
    "category": "Utils",
    "position": {
      "x": -636,
      "y": 2784
    },
    "sampleGuid": "02fa5f95-499f-4afc-b5a4-497b3470c9b5",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Hex code",
        "type": "System.String",
        "defaultValue": "#000000"
      }
    ],
    "serializedFields": {}
  },
  "CopyToClipboard": {
    "name": "CopyToClipboard",
    "fullType": "Banter.VisualScripting.CopyToClipboard",
    "category": "Utils",
    "position": {
      "x": -360,
      "y": 2784
    },
    "sampleGuid": "bb629833-45f9-4b9e-a27a-22fbbdf8deac",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "String",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "GetPlatform": {
    "name": "GetPlatform",
    "fullType": "Banter.VisualScripting.GetPlatform",
    "category": "Utils",
    "position": {
      "x": -120,
      "y": 2784
    },
    "sampleGuid": "17ab2180-9042-481b-be14-2e05354f510c",
    "version": "A",
    "isEvent": false,
    "defaultValues": [],
    "serializedFields": {}
  },
  "OnGlobalEvent": {
    "name": "OnGlobalEvent",
    "fullType": "Banter.VisualScripting.OnGlobalEvent",
    "category": "Utils",
    "position": {
      "x": -540,
      "y": -1116
    },
    "sampleGuid": "33054d17-08ac-4fff-b6e3-a8f0224b136d",
    "version": "A",
    "isEvent": true,
    "defaultValues": [
      {
        "name": "name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {
      "argumentCount": 0,
      "coroutine": false
    }
  },
  "OnSpaceBrowserTexture": {
    "name": "OnSpaceBrowserTexture",
    "fullType": "Banter.VisualScripting.OnSpaceBrowserTexture",
    "category": "Utils",
    "position": {
      "x": -336,
      "y": -1116
    },
    "sampleGuid": "14ec79fc-0040-4c92-a3b9-6af2496b636c",
    "version": "A",
    "isEvent": true,
    "defaultValues": [],
    "serializedFields": {
      "coroutine": false
    }
  },
  "ParseStringInvariant": {
    "name": "ParseStringInvariant",
    "fullType": "Banter.VisualScripting.ParseStringInvariant",
    "category": "Utils",
    "position": {
      "x": 780,
      "y": 2784
    },
    "sampleGuid": "d38ce2e9-05d8-4a84-8239-f115a34d409e",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "string",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {}
  },
  "SendGlobalEvent": {
    "name": "SendGlobalEvent",
    "fullType": "Banter.VisualScripting.SendGlobalEvent",
    "category": "Utils",
    "position": {
      "x": 984,
      "y": 2784
    },
    "sampleGuid": "eef3fd49-913e-4fa5-ba14-0d3ea133cd77",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "name",
        "type": "System.String",
        "defaultValue": ""
      }
    ],
    "serializedFields": {
      "argumentCount": 0
    }
  },
  "ToStringInvariant": {
    "name": "ToStringInvariant",
    "fullType": "Banter.VisualScripting.ToStringInvariant",
    "category": "Utils",
    "position": {
      "x": 1212,
      "y": 2784
    },
    "sampleGuid": "a111782d-3586-4ca7-9806-ae8a7e87fbaf",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "float",
        "type": "System.Single",
        "defaultValue": 0
      }
    ],
    "serializedFields": {}
  },
  "TriggerUnityEvent": {
    "name": "TriggerUnityEvent",
    "fullType": "Banter.VisualScripting.TriggerUnityEvent",
    "category": "Utils",
    "position": {
      "x": 1404,
      "y": 2784
    },
    "sampleGuid": "23a15610-79be-4ab9-ae35-9bd2479b4124",
    "version": "A",
    "isEvent": false,
    "defaultValues": [
      {
        "name": "Target",
        "type": null,
        "defaultValue": null
      }
    ],
    "serializedFields": {
      "triggered": {
        "unit": {
          "$ref": "51"
        }
      },
      "trigger": {
        "unit": {
          "$ref": "51"
        }
      },
      "$id": "51"
    }
  },
  "UnEscapeUrl": {
    "name": "UnEscapeUrl",
    "fullType": "Banter.VisualScripting.UnEscapeUrl",
    "category": "Utils",
    "position": {
      "x": 1692,
      "y": 2784
    },
    "sampleGuid": "94ded006-2dfc-4b6f-b0e8-84f14a2d6753",
    "version": "A",
    "isEvent": false,
    "defaultValues": [],
    "serializedFields": {}
  }
} satisfies Record<string, BanterCustomVSNode>;

export const BANTER_CUSTOM_VS_NODE_LOG = "# Banter Custom Visual Scripting Nodes\n\nGenerated from: C:/Users/bobman/Downloads/AllCustomNodes (1).asset\nGenerated at: 2026-07-01T08:47:02.845Z\n\n## Summary\n\n- Total graph elements: 202\n- Banter custom node instances: 162\n- Unique Banter custom node types: 162\n- Graph group labels: 40\n\n## Category Counts\n\n- AI: 11\n- Browser: 6\n- Controller: 4\n- File: 1\n- Files: 1\n- Held Events: 11\n- Leaderboard: 5\n- Networking: 7\n- Player/Actions: 7\n- Player/Input: 10\n- PlayerEvents: 1\n- Space: 4\n- Trigger: 1\n- UI/Elements: 1\n- UI/Elements/Container: 3\n- UI/Elements/Controls: 8\n- UI/Elements/Display: 2\n- UI/Events: 2\n- UI/Hierarchy: 4\n- UI/Panel: 3\n- UI/Properties: 2\n- UI/Properties/State: 2\n- UI/Properties/Text: 2\n- UI/Properties/Value: 2\n- UI/Styles: 2\n- UI/Styles/Appearance: 4\n- UI/Styles/Border: 2\n- UI/Styles/Layout: 6\n- UI/Styles/Spacing: 2\n- UI/Styles/Typography: 2\n- UI/UXML: 2\n- Ungrouped: 13\n- User: 17\n- Utils: 12\n\n## Nodes\n\n### AiImage\n\n- Full type: `Banter.VisualScripting.AiImage`\n- Category: AI\n- Sample GUID: `1f488113-4c62-41b0-956f-3d1a8c995131`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-528, y=-228\n\n| Default value key | Type | Default |\n|---|---|---|\n| Prompt | `System.String` | `\"\"` |\n| Ratio | `Banter.SDK.AiImageRatio` | `\"_1_1\"` |\n\n### AiModel\n\n- Full type: `Banter.VisualScripting.AiModel`\n- Category: AI\n- Sample GUID: `8f8ba425-764b-4c2d-81e9-4d7ed94b6d27`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-336, y=-228\n\n| Default value key | Type | Default |\n|---|---|---|\n| Base64 Image | `System.String` | `\"\"` |\n| Detail | `Banter.SDK.AiModelSimplify` | `\"med\"` |\n| Texture Size | `System.Int32` | `1024` |\n\n### Base64ToCDN\n\n- Full type: `Banter.VisualScripting.Base64ToCDN`\n- Category: AI\n- Sample GUID: `bcdd7d7b-4ded-48a9-818c-af777dba0696`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-528, y=-384\n\n| Default value key | Type | Default |\n|---|---|---|\n| Filename | `System.String` | `\"\"` |\n| Base64 String | `System.String` | `\"\"` |\n\n### ObjectTexToBase64\n\n- Full type: `Banter.VisualScripting.ObjectTexToBase64`\n- Category: AI\n- Sample GUID: `b27e249e-e021-4c53-97d3-4bfac69fee5f`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-312, y=-372\n\n| Default value key | Type | Default |\n|---|---|---|\n| Material Index | `System.Int32` | `0` |\n| gameObject |  | `null` |\n\n### OnAiImage\n\n- Full type: `Banter.VisualScripting.OnAiImage`\n- Category: AI\n- Sample GUID: `f30215a2-4cb8-47ec-9af3-48755d92f046`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-468, y=-3852\n- Serialized fields: `coroutine`\n\nNo serialized default values in the sample asset.\n\n### OnAiModel\n\n- Full type: `Banter.VisualScripting.OnAiModel`\n- Category: AI\n- Sample GUID: `59173e7f-e947-4f41-8640-d4efafde2805`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-300, y=-3852\n- Serialized fields: `coroutine`\n\nNo serialized default values in the sample asset.\n\n### OnBase64CDNLink\n\n- Full type: `Banter.VisualScripting.OnBase64CDNLink`\n- Category: AI\n- Sample GUID: `b0db24d1-37cb-4d99-9c3f-7658505fa919`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-132, y=-3852\n- Serialized fields: `coroutine`\n\nNo serialized default values in the sample asset.\n\n### OnCameraSnap\n\n- Full type: `Banter.VisualScripting.OnCameraSnap`\n- Category: AI\n- Sample GUID: `3e966b43-aa5a-4d68-929f-fc707f3936ef`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=84, y=-3852\n- Serialized fields: `coroutine`\n\nNo serialized default values in the sample asset.\n\n### OnSTT\n\n- Full type: `Banter.VisualScripting.OnSTT`\n- Category: AI\n- Sample GUID: `4bfbbc70-d551-41ab-baac-c9210b68f8b4`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=288, y=-3852\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| Return ID | `System.String` | `\"\"` |\n\n### StartSTT\n\n- Full type: `Banter.VisualScripting.StartSTT`\n- Category: AI\n- Sample GUID: `848295e4-6e57-4330-bc7d-a7a9fef62692`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-528, y=-48\n\n| Default value key | Type | Default |\n|---|---|---|\n| Detect Speech | `System.Boolean` | `false` |\n\n### StopSTT\n\n- Full type: `Banter.VisualScripting.StopSTT`\n- Category: AI\n- Sample GUID: `431843f1-039e-4238-ab95-f401d65988ee`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-300, y=-48\n\n| Default value key | Type | Default |\n|---|---|---|\n| Return Id | `System.String` | `\"\"` |\n\n### InjectJS\n\n- Full type: `Banter.VisualScripting.InjectJS`\n- Category: Browser\n- Sample GUID: `a83e1a05-52e8-4bf2-8e67-3b42f8a07221`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-552, y=144\n\n| Default value key | Type | Default |\n|---|---|---|\n| BullSchript | `System.String` | `\"\"` |\n| Return ID | `System.String` | `\"\"` |\n\n### MenuOpenUrl\n\n- Full type: `Banter.VisualScripting.MenuOpenUrl`\n- Category: Browser\n- Sample GUID: `571d6a0c-f62f-4884-b4ba-092b0d81b6df`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-360, y=144\n\n| Default value key | Type | Default |\n|---|---|---|\n| Url | `System.String` | `\"\"` |\n\n### OnJsReturnValue\n\n- Full type: `Banter.VisualScripting.OnJsReturnValue`\n- Category: Browser\n- Sample GUID: `dec6f98c-cb7e-4a3e-b852-831d4136e3bd`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-456, y=-3564\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| Return ID | `System.String` | `\"\"` |\n\n### OnReceiveBrowserMessage\n\n- Full type: `Banter.VisualScripting.OnReceiveBrowserMessage`\n- Category: Browser\n- Sample GUID: `12733845-7424-4e3a-8ae8-ab4bb4f188fd`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-228, y=-3564\n- Serialized fields: `coroutine`\n\nNo serialized default values in the sample asset.\n\n### OnReceiveMenuBrowserMessage\n\n- Full type: `Banter.VisualScripting.OnReceiveMenuBrowserMessage`\n- Category: Browser\n- Sample GUID: `6b47c595-594c-45f1-8b61-e4c9cf9b9e11`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=60, y=-3564\n- Serialized fields: `coroutine`\n\nNo serialized default values in the sample asset.\n\n### ReadJsFromFile\n\n- Full type: `Banter.VisualScripting.ReadJsFromFile`\n- Category: Browser\n- Sample GUID: `9c3fc61e-c356-482e-b5cc-7b4d759bb22c`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-132, y=156\n\nNo serialized default values in the sample asset.\n\n### OnControllerAxisUpdate\n\n- Full type: `Banter.VisualScripting.OnControllerAxisUpdate`\n- Category: Controller\n- Sample GUID: `806cf1c6-87cb-40dc-aa73-f18be109f164`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-492, y=-3276\n- Serialized fields: `coroutine`\n\nNo serialized default values in the sample asset.\n\n### OnControllerButtonPressed\n\n- Full type: `Banter.VisualScripting.OnControllerButtonPressed`\n- Category: Controller\n- Sample GUID: `5a194b5e-6276-4fc0-a51b-d285a086a4a4`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-324, y=-3264\n- Serialized fields: `coroutine`\n\nNo serialized default values in the sample asset.\n\n### OnControllerButtonReleased\n\n- Full type: `Banter.VisualScripting.OnControllerButtonReleased`\n- Category: Controller\n- Sample GUID: `2d7ce5ba-8c3a-4ad0-ac77-1a572a0b760f`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-132, y=-3264\n- Serialized fields: `coroutine`\n\nNo serialized default values in the sample asset.\n\n### OnTriggerAxisUpdate\n\n- Full type: `Banter.VisualScripting.OnTriggerAxisUpdate`\n- Category: Controller\n- Sample GUID: `dc9d427d-09ff-46bf-b903-98e043059c55`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=60, y=-3264\n- Serialized fields: `coroutine`\n\nNo serialized default values in the sample asset.\n\n### SelectFile\n\n- Full type: `Banter.VisualScripting.SelectFile`\n- Category: File\n- Sample GUID: `322bf42e-ac1b-4854-93d0-af8af9a27762`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-552, y=432\n\n| Default value key | Type | Default |\n|---|---|---|\n| Type | `Banter.SDK.SelectFileType` | `\"GLB\"` |\n\n### OnSelectFile\n\n- Full type: `Banter.VisualScripting.OnSelectFile`\n- Category: Files\n- Sample GUID: `7de41d53-8af8-42f8-aa94-54d89f909a00`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-492, y=-2976\n- Serialized fields: `coroutine`\n\nNo serialized default values in the sample asset.\n\n### OnGrab\n\n- Full type: `Banter.VisualScripting.OnGrab`\n- Category: Held Events\n- Sample GUID: `de8a6871-bb28-4be4-96e2-887ecd2a09d5`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-516, y=-2712\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| banterHeldEvents |  | `null` |\n\n### OnGunTrigger\n\n- Full type: `Banter.VisualScripting.OnGunTrigger`\n- Category: Held Events\n- Sample GUID: `61d8e252-c385-470d-85aa-fce281feafa2`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-264, y=-2712\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| banterHeldEvents |  | `null` |\n\n### OnPrimaryDown\n\n- Full type: `Banter.VisualScripting.OnPrimaryDown`\n- Category: Held Events\n- Sample GUID: `b9e7c592-8bbd-4cfe-a80a-26397ca65895`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-36, y=-2712\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| banterHeldEvents |  | `null` |\n\n### OnPrimaryUp\n\n- Full type: `Banter.VisualScripting.OnPrimaryUp`\n- Category: Held Events\n- Sample GUID: `7ce9f468-b5ad-4912-91db-1a1f5f381789`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=192, y=-2712\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| banterHeldEvents |  | `null` |\n\n### OnRelease\n\n- Full type: `Banter.VisualScripting.OnRelease`\n- Category: Held Events\n- Sample GUID: `a1159f0d-e0c2-4936-a4e7-40aea5b21971`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=420, y=-2712\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| banterHeldEvents |  | `null` |\n\n### OnSecondaryDown\n\n- Full type: `Banter.VisualScripting.OnSecondaryDown`\n- Category: Held Events\n- Sample GUID: `660e9ac8-71cf-4026-8351-5fd00d6e3d86`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=648, y=-2712\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| banterHeldEvents |  | `null` |\n\n### OnSecondaryUp\n\n- Full type: `Banter.VisualScripting.OnSecondaryUp`\n- Category: Held Events\n- Sample GUID: `a79a4549-a067-421c-bc69-1c79ee2a0283`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=864, y=-2712\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| banterHeldEvents |  | `null` |\n\n### OnThumbClickDown\n\n- Full type: `Banter.VisualScripting.OnThumbClickDown`\n- Category: Held Events\n- Sample GUID: `9a77d327-0db5-4be0-ad3a-16cdaa9e402f`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=1080, y=-2712\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| banterHeldEvents |  | `null` |\n\n### OnThumbClickUp\n\n- Full type: `Banter.VisualScripting.OnThumbClickUp`\n- Category: Held Events\n- Sample GUID: `5ed21b77-783b-43da-9c06-24990663bc2f`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=1296, y=-2712\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| banterHeldEvents |  | `null` |\n\n### OnThumbstick\n\n- Full type: `Banter.VisualScripting.OnThumbstick`\n- Category: Held Events\n- Sample GUID: `5cab16c5-f22f-42f0-8330-32036fd3dd87`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=1524, y=-2712\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| banterHeldEvents |  | `null` |\n\n### OnTrigger\n\n- Full type: `Banter.VisualScripting.OnTrigger`\n- Category: Held Events\n- Sample GUID: `f2d9f06c-b1b2-49bb-aa8f-3a704b4f3a99`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=1752, y=-2712\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| banterHeldEvents |  | `null` |\n\n### ClearScores\n\n- Full type: `Banter.VisualScripting.ClearScores`\n- Category: Leaderboard\n- Sample GUID: `494e0087-9bb5-48c6-b60b-0345fcb06c01`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-528, y=648\n\n| Default value key | Type | Default |\n|---|---|---|\n| Board | `System.String` | `\"\"` |\n\n### GetCurrentLeaderboard\n\n- Full type: `Banter.VisualScripting.GetCurrentLeaderboard`\n- Category: Leaderboard\n- Sample GUID: `35a9af69-5097-4b40-bd58-652065063d0d`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-348, y=648\n\nNo serialized default values in the sample asset.\n\n### LeaderboardError\n\n- Full type: `Banter.VisualScripting.LeaderboardError`\n- Category: Leaderboard\n- Sample GUID: `a1929a3a-a28c-4c9e-a3da-65388de9e7b1`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-516, y=-2448\n- Serialized fields: `coroutine`\n\nNo serialized default values in the sample asset.\n\n### LeaderboardUpdate\n\n- Full type: `Banter.VisualScripting.LeaderboardUpdate`\n- Category: Leaderboard\n- Sample GUID: `000f2c71-20f2-4f3c-ab85-3236853073ae`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-288, y=-2460\n- Serialized fields: `coroutine`\n\nNo serialized default values in the sample asset.\n\n### SetScore\n\n- Full type: `Banter.VisualScripting.SetScore`\n- Category: Leaderboard\n- Sample GUID: `5240cd45-4824-4b4e-ab3f-d5cfe4e2e82e`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-96, y=648\n\n| Default value key | Type | Default |\n|---|---|---|\n| Board | `System.String` | `\"\"` |\n| Sort | `Banter.VisualScripting.SortType` | `\"ASC\"` |\n| Score | `System.Single` | `0` |\n| Unique | `System.Boolean` | `false` |\n\n### LoadAudioUrl\n\n- Full type: `Banter.VisualScripting.LoadAudioUrl`\n- Category: Networking\n- Sample GUID: `6826914d-f478-4290-9f15-3ea5eaab0d82`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-528, y=960\n\n| Default value key | Type | Default |\n|---|---|---|\n| URL | `System.String` | `\"\"` |\n| Audio Type | `UnityEngine.AudioType` | `\"UNKNOWN\"` |\n\n### LoadTextureUrl\n\n- Full type: `Banter.VisualScripting.LoadTextureUrl`\n- Category: Networking\n- Sample GUID: `3585d7bd-c929-4dd0-9119-33699ff69116`\n- Version: `A`\n- Event-like: no\n- Sample position: x=144, y=972\n\n| Default value key | Type | Default |\n|---|---|---|\n| URL | `System.String` | `\"\"` |\n| Generate Mipmaps | `System.Boolean` | `true` |\n\n### LoadTextUrl\n\n- Full type: `Banter.VisualScripting.LoadTextUrl`\n- Category: Networking\n- Sample GUID: `808aeb3f-928c-490c-ac69-5dd542735ad1`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-192, y=960\n\n| Default value key | Type | Default |\n|---|---|---|\n| URL | `System.String` | `\"\"` |\n| Method | `System.String` | `\"GET\"` |\n| Body | `System.String` | `\"\"` |\n| ContentType | `System.String` | `\"application/json\"` |\n\n### OnOneShot\n\n- Full type: `Banter.VisualScripting.OnOneShot`\n- Category: Networking\n- Sample GUID: `cb03fd55-b8bc-4c8f-b9eb-99baec2e1699`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-528, y=-2184\n- Serialized fields: `coroutine`\n\nNo serialized default values in the sample asset.\n\n### OnSpaceStatePropsChanged\n\n- Full type: `Banter.VisualScripting.OnSpaceStatePropsChanged`\n- Category: Networking\n- Sample GUID: `135db947-4444-48d7-8460-76cdc27045ac`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-324, y=-2184\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| Property Name | `System.String` | `\"\"` |\n\n### SendOneShot\n\n- Full type: `Banter.VisualScripting.SendOneShot`\n- Category: Networking\n- Sample GUID: `c809df48-a6ef-4278-96bd-437ebcf825cb`\n- Version: `A`\n- Event-like: no\n- Sample position: x=432, y=984\n\n| Default value key | Type | Default |\n|---|---|---|\n| Data | `System.String` | `\"\"` |\n| All Instances | `System.Boolean` | `false` |\n\n### SetSpaceStateProp\n\n- Full type: `Banter.VisualScripting.SetSpaceStateProp`\n- Category: Networking\n- Sample GUID: `ef247c98-615c-4412-b500-233114e2be49`\n- Version: `A`\n- Event-like: no\n- Sample position: x=636, y=984\n\n| Default value key | Type | Default |\n|---|---|---|\n| Property Name | `System.String` | `\"\"` |\n| Value | `System.String` | `\"\"` |\n| Is Public Property? | `System.Boolean` | `true` |\n\n### SetCanCrouch\n\n- Full type: `Banter.VisualScripting.SetCanCrouch`\n- Category: Player/Actions\n- Sample GUID: `3db9a378-ed3e-4fdf-91f8-eb0ab237c23b`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-576, y=1284\n\n| Default value key | Type | Default |\n|---|---|---|\n| Can Crouch | `System.Boolean` | `true` |\n\n### SetCanGrab\n\n- Full type: `Banter.VisualScripting.SetCanGrab`\n- Category: Player/Actions\n- Sample GUID: `9d79e0c1-023c-4708-92fd-a7d8d400fd67`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-372, y=1284\n\n| Default value key | Type | Default |\n|---|---|---|\n| Can Grab | `System.Boolean` | `true` |\n\n### SetCanGrapple\n\n- Full type: `Banter.VisualScripting.SetCanGrapple`\n- Category: Player/Actions\n- Sample GUID: `cef94bea-51d3-4663-a840-39094d711671`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-180, y=1284\n\n| Default value key | Type | Default |\n|---|---|---|\n| Can Grapple | `System.Boolean` | `true` |\n\n### SetCanJump\n\n- Full type: `Banter.VisualScripting.SetCanJump`\n- Category: Player/Actions\n- Sample GUID: `aac3807b-f367-4797-954a-cec58f5f2bfc`\n- Version: `A`\n- Event-like: no\n- Sample position: x=24, y=1284\n\n| Default value key | Type | Default |\n|---|---|---|\n| Can Jump | `System.Boolean` | `true` |\n\n### SetCanMove\n\n- Full type: `Banter.VisualScripting.SetCanMove`\n- Category: Player/Actions\n- Sample GUID: `a95ed859-3310-405a-8d96-8dbe7cd66577`\n- Version: `A`\n- Event-like: no\n- Sample position: x=204, y=1284\n\n| Default value key | Type | Default |\n|---|---|---|\n| Can Move | `System.Boolean` | `true` |\n\n### SetCanRotate\n\n- Full type: `Banter.VisualScripting.SetCanRotate`\n- Category: Player/Actions\n- Sample GUID: `a0360fac-bb15-44fb-9b2b-fd75abaf8ba9`\n- Version: `A`\n- Event-like: no\n- Sample position: x=384, y=1284\n\n| Default value key | Type | Default |\n|---|---|---|\n| Can Rotate | `System.Boolean` | `true` |\n\n### SetCanTeleport\n\n- Full type: `Banter.VisualScripting.SetCanTeleport`\n- Category: Player/Actions\n- Sample GUID: `d87a6899-fa5c-4ef6-a2d2-11d4d24f02dd`\n- Version: `A`\n- Event-like: no\n- Sample position: x=588, y=1284\n\n| Default value key | Type | Default |\n|---|---|---|\n| Can Teleport | `System.Boolean` | `true` |\n\n### SetBlockLeftPrimary\n\n- Full type: `Banter.VisualScripting.SetBlockLeftPrimary`\n- Category: Player/Input\n- Sample GUID: `15c0b33f-9c4d-44b6-a40e-2a469a9977d7`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-576, y=1620\n\n| Default value key | Type | Default |\n|---|---|---|\n| Block Left Primary | `System.Boolean` | `false` |\n\n### SetBlockLeftSecondary\n\n- Full type: `Banter.VisualScripting.SetBlockLeftSecondary`\n- Category: Player/Input\n- Sample GUID: `f27160ec-e4d9-4592-9a07-8ecc37fa6e3a`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-324, y=1620\n\n| Default value key | Type | Default |\n|---|---|---|\n| Block Left Secondary | `System.Boolean` | `false` |\n\n### SetBlockLeftThumbstick\n\n- Full type: `Banter.VisualScripting.SetBlockLeftThumbstick`\n- Category: Player/Input\n- Sample GUID: `8fefb7c6-75a6-4a02-8d51-f70c30d2b1d2`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-48, y=1620\n\n| Default value key | Type | Default |\n|---|---|---|\n| Block Left Thumbstick | `System.Boolean` | `false` |\n\n### SetBlockLeftThumbstickClick\n\n- Full type: `Banter.VisualScripting.SetBlockLeftThumbstickClick`\n- Category: Player/Input\n- Sample GUID: `efe9c521-b2d9-4ada-ab8f-2500517ab03f`\n- Version: `A`\n- Event-like: no\n- Sample position: x=228, y=1620\n\n| Default value key | Type | Default |\n|---|---|---|\n| Block Left Thumbstick Click | `System.Boolean` | `false` |\n\n### SetBlockLeftTrigger\n\n- Full type: `Banter.VisualScripting.SetBlockLeftTrigger`\n- Category: Player/Input\n- Sample GUID: `1c2aeec7-73ef-4efa-8f7f-ee49c1ea8ae4`\n- Version: `A`\n- Event-like: no\n- Sample position: x=504, y=1620\n\n| Default value key | Type | Default |\n|---|---|---|\n| Block Left Trigger | `System.Boolean` | `false` |\n\n### SetBlockRightPrimary\n\n- Full type: `Banter.VisualScripting.SetBlockRightPrimary`\n- Category: Player/Input\n- Sample GUID: `e8486e8b-e9e6-4c3f-8d6a-1d9a179e8744`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-576, y=1776\n\n| Default value key | Type | Default |\n|---|---|---|\n| Block Right Primary | `System.Boolean` | `false` |\n\n### SetBlockRightSecondary\n\n- Full type: `Banter.VisualScripting.SetBlockRightSecondary`\n- Category: Player/Input\n- Sample GUID: `cc15ae91-ba76-4ef2-8c3e-a8821b75cdb7`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-324, y=1776\n\n| Default value key | Type | Default |\n|---|---|---|\n| Block Right Secondary | `System.Boolean` | `false` |\n\n### SetBlockRightThumbstick\n\n- Full type: `Banter.VisualScripting.SetBlockRightThumbstick`\n- Category: Player/Input\n- Sample GUID: `0715cbc5-55fe-4165-8f0f-12a14e20412d`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-60, y=1776\n\n| Default value key | Type | Default |\n|---|---|---|\n| Block Right Thumbstick | `System.Boolean` | `false` |\n\n### SetBlockRightThumbstickClick\n\n- Full type: `Banter.VisualScripting.SetBlockRightThumbstickClick`\n- Category: Player/Input\n- Sample GUID: `5d13f3cf-5740-4d42-b0c2-2bc978792f4a`\n- Version: `A`\n- Event-like: no\n- Sample position: x=228, y=1788\n\n| Default value key | Type | Default |\n|---|---|---|\n| Block Right Thumbstick Click | `System.Boolean` | `false` |\n\n### SetBlockRightTrigger\n\n- Full type: `Banter.VisualScripting.SetBlockRightTrigger`\n- Category: Player/Input\n- Sample GUID: `a4dcaf23-100d-4b6f-b138-c5f24d283a76`\n- Version: `A`\n- Event-like: no\n- Sample position: x=504, y=1788\n\n| Default value key | Type | Default |\n|---|---|---|\n| Block Right Trigger | `System.Boolean` | `false` |\n\n### OnClick\n\n- Full type: `Banter.VisualScripting.OnClick`\n- Category: PlayerEvents\n- Sample GUID: `daf0f13b-8e96-421b-ac84-590704eb32c9`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-516, y=-1968\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| banterPlayerEvents |  | `null` |\n\n### GetSpaceURL\n\n- Full type: `Banter.VisualScripting.GetSpaceURL`\n- Category: Space\n- Sample GUID: `3d249782-5df1-46c5-a7ac-821fe82a0516`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-552, y=2064\n\nNo serialized default values in the sample asset.\n\n### GetUsers\n\n- Full type: `Banter.VisualScripting.GetUsers`\n- Category: Space\n- Sample GUID: `32d7e421-1daf-4d54-b35d-ef2525f69388`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-372, y=2064\n\nNo serialized default values in the sample asset.\n\n### IsSpaceFavourited\n\n- Full type: `Banter.VisualScripting.IsSpaceFavourited`\n- Category: Space\n- Sample GUID: `bcc861d1-a733-437b-bf86-6ea31aaf3005`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-192, y=2064\n\nNo serialized default values in the sample asset.\n\n### OnGetUserState\n\n- Full type: `Banter.VisualScripting.OnGetUserState`\n- Category: Space\n- Sample GUID: `1c4bc4b2-e64d-4b22-b779-f52fa28d5b89`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-516, y=-1752\n- Serialized fields: `coroutine`\n\nNo serialized default values in the sample asset.\n\n### OnBanterTriggerEnter\n\n- Full type: `Banter.VisualScripting.OnBanterTriggerEnter`\n- Category: Trigger\n- Sample GUID: `4013e0b8-2619-4f4e-b696-c699e9b3869d`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-528, y=-1548\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| target |  | `null` |\n\n### CreateUIElement\n\n- Full type: `Banter.VisualScripting.CreateUIElement`\n- Category: UI/Elements\n- Sample GUID: `f03c4e29-3cdf-4030-b6e3-ffae4dc32a5c`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4572, y=480\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element Type | `Banter.VisualScripting.UIElementTypeVS` | `\"Button\"` |\n| gameObject |  | `null` |\n| Parent Element ID | `System.String` | `\"\"` |\n| Parent Element Name | `System.String` | `\"\"` |\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### CreateUIBox\n\n- Full type: `Banter.VisualScripting.CreateUIBox`\n- Category: UI/Elements/Container\n- Sample GUID: `baf8407c-3e97-4fe6-8ed4-4d2536ad0840`\n- Version: `A`\n- Event-like: no\n- Sample position: x=3828, y=-312\n\n| Default value key | Type | Default |\n|---|---|---|\n| gameObject |  | `null` |\n| Parent Element ID | `System.String` | `\"\"` |\n| Parent Element Name | `System.String` | `\"\"` |\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### CreateUIFoldout\n\n- Full type: `Banter.VisualScripting.CreateUIFoldout`\n- Category: UI/Elements/Container\n- Sample GUID: `31c77e08-478d-4ac2-b13f-003d5dda1a97`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4176, y=-312\n\n| Default value key | Type | Default |\n|---|---|---|\n| gameObject |  | `null` |\n| Parent Element ID | `System.String` | `\"\"` |\n| Parent Element Name | `System.String` | `\"\"` |\n| Text | `System.String` | `\"Foldout\"` |\n| Is Collapsed | `System.Boolean` | `false` |\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### CreateUIScrollView\n\n- Full type: `Banter.VisualScripting.CreateUIScrollView`\n- Category: UI/Elements/Container\n- Sample GUID: `4f673214-2f7e-42be-8f63-dd9c1c5762f4`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4524, y=-312\n\n| Default value key | Type | Default |\n|---|---|---|\n| gameObject |  | `null` |\n| Parent Element ID | `System.String` | `\"\"` |\n| Parent Element Name | `System.String` | `\"\"` |\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### CreateUIButton\n\n- Full type: `Banter.VisualScripting.CreateUIButton`\n- Category: UI/Elements/Controls\n- Sample GUID: `7320b2a3-5741-43d2-86b8-a1e2d0242902`\n- Version: `A`\n- Event-like: no\n- Sample position: x=3816, y=96\n\n| Default value key | Type | Default |\n|---|---|---|\n| gameObject |  | `null` |\n| Parent Element ID | `System.String` | `\"\"` |\n| Parent Element Name | `System.String` | `\"\"` |\n| Text | `System.String` | `\"Button\"` |\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### CreateUIDropdown\n\n- Full type: `Banter.VisualScripting.CreateUIDropdown`\n- Category: UI/Elements/Controls\n- Sample GUID: `3eaa8ac1-8195-40ea-928a-02078f782852`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4152, y=96\n\n| Default value key | Type | Default |\n|---|---|---|\n| gameObject |  | `null` |\n| Parent Element ID | `System.String` | `\"\"` |\n| Parent Element Name | `System.String` | `\"\"` |\n| Default Index | `System.Int32` | `0` |\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### CreateUIFloatField\n\n- Full type: `Banter.VisualScripting.CreateUIFloatField`\n- Category: UI/Elements/Controls\n- Sample GUID: `381b2437-78f3-47e5-b660-0733990d6bdd`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4500, y=108\n\n| Default value key | Type | Default |\n|---|---|---|\n| gameObject |  | `null` |\n| Parent Element ID | `System.String` | `\"\"` |\n| Parent Element Name | `System.String` | `\"\"` |\n| Initial Value | `System.Single` | `0` |\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### CreateUIIntField\n\n- Full type: `Banter.VisualScripting.CreateUIIntField`\n- Category: UI/Elements/Controls\n- Sample GUID: `d1568a7d-c9bc-4487-b586-8e1baad92170`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4848, y=108\n\n| Default value key | Type | Default |\n|---|---|---|\n| gameObject |  | `null` |\n| Parent Element ID | `System.String` | `\"\"` |\n| Parent Element Name | `System.String` | `\"\"` |\n| Initial Value | `System.Int32` | `0` |\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### CreateUILabel\n\n- Full type: `Banter.VisualScripting.CreateUILabel`\n- Category: UI/Elements/Controls\n- Sample GUID: `1a035d09-0152-4df1-a4c2-8a7e0455ef32`\n- Version: `A`\n- Event-like: no\n- Sample position: x=5196, y=108\n\n| Default value key | Type | Default |\n|---|---|---|\n| gameObject |  | `null` |\n| Parent Element ID | `System.String` | `\"\"` |\n| Parent Element Name | `System.String` | `\"\"` |\n| Text | `System.String` | `\"Label\"` |\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### CreateUISlider\n\n- Full type: `Banter.VisualScripting.CreateUISlider`\n- Category: UI/Elements/Controls\n- Sample GUID: `c474ffdf-d504-46ef-bb10-0480782eb9b0`\n- Version: `A`\n- Event-like: no\n- Sample position: x=5532, y=108\n\n| Default value key | Type | Default |\n|---|---|---|\n| gameObject |  | `null` |\n| Parent Element ID | `System.String` | `\"\"` |\n| Parent Element Name | `System.String` | `\"\"` |\n| Min Value | `System.Single` | `0` |\n| Max Value | `System.Single` | `100` |\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### CreateUITextField\n\n- Full type: `Banter.VisualScripting.CreateUITextField`\n- Category: UI/Elements/Controls\n- Sample GUID: `ab474391-5660-4f45-a120-e8c03137ff94`\n- Version: `A`\n- Event-like: no\n- Sample position: x=5868, y=108\n\n| Default value key | Type | Default |\n|---|---|---|\n| gameObject |  | `null` |\n| Parent Element ID | `System.String` | `\"\"` |\n| Parent Element Name | `System.String` | `\"\"` |\n| Placeholder | `System.String` | `\"\"` |\n| Initial Value | `System.String` | `\"\"` |\n| Is Password | `System.Boolean` | `false` |\n| Is Multiline | `System.Boolean` | `false` |\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### CreateUIToggle\n\n- Full type: `Banter.VisualScripting.CreateUIToggle`\n- Category: UI/Elements/Controls\n- Sample GUID: `63ce6003-bd30-4bbe-804d-032237e2b982`\n- Version: `A`\n- Event-like: no\n- Sample position: x=6204, y=108\n\n| Default value key | Type | Default |\n|---|---|---|\n| gameObject |  | `null` |\n| Parent Element ID | `System.String` | `\"\"` |\n| Parent Element Name | `System.String` | `\"\"` |\n| Checked | `System.Boolean` | `false` |\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### CreateUIImage\n\n- Full type: `Banter.VisualScripting.CreateUIImage`\n- Category: UI/Elements/Display\n- Sample GUID: `18cccc11-5396-4948-b555-3dd5d7b0b4a2`\n- Version: `A`\n- Event-like: no\n- Sample position: x=3804, y=504\n\n| Default value key | Type | Default |\n|---|---|---|\n| gameObject |  | `null` |\n| Parent Element ID | `System.String` | `\"\"` |\n| Parent Element Name | `System.String` | `\"\"` |\n| Texture |  | `null` |\n| Sprite |  | `null` |\n| Tint Color | `UnityEngine.Color` | `null` |\n| Scale Mode | `UnityEngine.ScaleMode` | `\"ScaleToFit\"` |\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### CreateUIProgressBar\n\n- Full type: `Banter.VisualScripting.CreateUIProgressBar`\n- Category: UI/Elements/Display\n- Sample GUID: `055a093c-7dba-4a75-b970-a5c168a09991`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4164, y=504\n\n| Default value key | Type | Default |\n|---|---|---|\n| gameObject |  | `null` |\n| Parent Element ID | `System.String` | `\"\"` |\n| Parent Element Name | `System.String` | `\"\"` |\n| Initial Value | `System.Single` | `0` |\n| Min Value | `System.Single` | `0` |\n| Max Value | `System.Single` | `100` |\n| Title | `System.String` | `\"\"` |\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### RegisterUIClick\n\n- Full type: `Banter.VisualScripting.RegisterUIClick`\n- Category: UI/Events\n- Sample GUID: `806e834e-f33c-42fe-8b4e-3f649be96023`\n- Version: `A`\n- Event-like: no\n- Sample position: x=3780, y=1104\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### RegisterUIEvent\n\n- Full type: `Banter.VisualScripting.RegisterUIEvent`\n- Category: UI/Events\n- Sample GUID: `ebd120ce-c76c-4432-86cb-d185917769fb`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4008, y=1104\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Event Type | `Banter.UI.Bridge.UIEventType` | `\"Click\"` |\n\n### AttachUIChild\n\n- Full type: `Banter.VisualScripting.AttachUIChild`\n- Category: UI/Hierarchy\n- Sample GUID: `c9ae64e5-2879-4fab-affd-017c31ce6042`\n- Version: `A`\n- Event-like: no\n- Sample position: x=3756, y=1524\n\n| Default value key | Type | Default |\n|---|---|---|\n| Parent Element ID | `System.String` | `\"\"` |\n| Parent Element Name | `System.String` | `\"\"` |\n| Child Element ID | `System.String` | `\"\"` |\n| Child Element Name | `System.String` | `\"\"` |\n| Index | `System.Int32` | `-1` |\n\n### DestroyUIElement\n\n- Full type: `Banter.VisualScripting.DestroyUIElement`\n- Category: UI/Hierarchy\n- Sample GUID: `19d2f7d9-dd81-4f0f-8b9c-4b688105cc96`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4020, y=1536\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### DetachUIChild\n\n- Full type: `Banter.VisualScripting.DetachUIChild`\n- Category: UI/Hierarchy\n- Sample GUID: `4a1d95f0-bdca-4c1f-88d6-63f82d0b2f5e`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4248, y=1536\n\n| Default value key | Type | Default |\n|---|---|---|\n| Parent Element ID | `System.String` | `\"\"` |\n| Parent Element Name | `System.String` | `\"\"` |\n| Child Element ID | `System.String` | `\"\"` |\n| Child Element Name | `System.String` | `\"\"` |\n\n### SetUIParent\n\n- Full type: `Banter.VisualScripting.SetUIParent`\n- Category: UI/Hierarchy\n- Sample GUID: `63302ae4-5703-426c-90c4-e8bb2251851a`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4512, y=1536\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| New Parent ID | `System.String` | `\"\"` |\n| New Parent Name | `System.String` | `\"\"` |\n\n### CreateUIPanel\n\n- Full type: `Banter.VisualScripting.CreateUIPanel`\n- Category: UI/Panel\n- Sample GUID: `b8e0652e-ee77-4b2b-97b9-51e291bb5f06`\n- Version: `A`\n- Event-like: no\n- Sample position: x=3768, y=2040\n\n| Default value key | Type | Default |\n|---|---|---|\n| gameObject |  | `null` |\n| Resolution | `UnityEngine.Vector2` | `null` |\n| Screen Space | `System.Boolean` | `false` |\n\n### DestroyUIPanel\n\n- Full type: `Banter.VisualScripting.DestroyUIPanel`\n- Category: UI/Panel\n- Sample GUID: `6fe1047c-e6ae-41e8-a873-550dc279ffe5`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4032, y=2040\n\nNo serialized default values in the sample asset.\n\n### GetUIPanel\n\n- Full type: `Banter.VisualScripting.GetUIPanel`\n- Category: UI/Panel\n- Sample GUID: `e07a785a-2c4f-4c48-96bf-9235a3f399a9`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4224, y=2040\n\n| Default value key | Type | Default |\n|---|---|---|\n| gameObject |  | `null` |\n\n### GetUIProperty\n\n- Full type: `Banter.VisualScripting.GetUIProperty`\n- Category: UI/Properties\n- Sample GUID: `14a807ed-ee6d-47c2-b27e-3ff454affe91`\n- Version: `A`\n- Event-like: no\n- Sample position: x=3756, y=3372\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Property | `Banter.VisualScripting.UIPropertyNameVS` | `\"Text\"` |\n\n### SetUIProperty\n\n- Full type: `Banter.VisualScripting.SetUIProperty`\n- Category: UI/Properties\n- Sample GUID: `e5200760-6e8d-48cb-99dd-0c7ba4f8529d`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4080, y=3372\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Property | `Banter.VisualScripting.UIPropertyNameVS` | `\"Text\"` |\n\n### SetUIEnabled\n\n- Full type: `Banter.VisualScripting.SetUIEnabled`\n- Category: UI/Properties/State\n- Sample GUID: `92d3f068-771c-4fa8-8b3e-71999bc3588e`\n- Version: `A`\n- Event-like: no\n- Sample position: x=3768, y=2532\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Enabled | `System.Boolean` | `true` |\n\n### SetUIVisible\n\n- Full type: `Banter.VisualScripting.SetUIVisible`\n- Category: UI/Properties/State\n- Sample GUID: `22e5c35f-26ac-475f-a7c2-2e477777c5d3`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4008, y=2544\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Visible | `System.Boolean` | `true` |\n\n### GetUIText\n\n- Full type: `Banter.VisualScripting.GetUIText`\n- Category: UI/Properties/Text\n- Sample GUID: `6eefd591-510a-4f61-a1f0-19a57e7df840`\n- Version: `A`\n- Event-like: no\n- Sample position: x=3756, y=2808\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### SetUIText\n\n- Full type: `Banter.VisualScripting.SetUIText`\n- Category: UI/Properties/Text\n- Sample GUID: `bc15c45f-7cde-4e59-9f64-3652005669a0`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4032, y=2808\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Text | `System.String` | `\"\"` |\n\n### GetUIValue\n\n- Full type: `Banter.VisualScripting.GetUIValue`\n- Category: UI/Properties/Value\n- Sample GUID: `eed4d5b0-3dc2-4cc2-8b5e-905e57151fa4`\n- Version: `A`\n- Event-like: no\n- Sample position: x=3780, y=3072\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### SetUIValue\n\n- Full type: `Banter.VisualScripting.SetUIValue`\n- Category: UI/Properties/Value\n- Sample GUID: `b303988e-8449-4183-9ffe-2f63fd3b3a4b`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4032, y=3072\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Value | `System.Single` | `0` |\n\n### GetUIStyle\n\n- Full type: `Banter.VisualScripting.GetUIStyle`\n- Category: UI/Styles\n- Sample GUID: `972299d2-dad4-47e6-a3e8-c46c197fd422`\n- Version: `A`\n- Event-like: no\n- Sample position: x=3744, y=5976\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Style Property | `Banter.UI.Bridge.UIStyleProperty` | `\"BackgroundColor\"` |\n\n### SetUIStyle\n\n- Full type: `Banter.VisualScripting.SetUIStyle`\n- Category: UI/Styles\n- Sample GUID: `c7f8d09e-0e51-4a79-b959-4987cade5642`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4152, y=5976\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Style Property | `Banter.UI.Bridge.UIStyleProperty` | `\"BackgroundColor\"` |\n| Style Value | `System.String` | `\"\"` |\n\n### GetUIAppearance\n\n- Full type: `Banter.VisualScripting.GetUIAppearance`\n- Category: UI/Styles/Appearance\n- Sample GUID: `e6cd2dd5-dda5-4048-ae34-7e4421612e8e`\n- Version: `A`\n- Event-like: no\n- Sample position: x=3792, y=3984\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### GetUIBackground\n\n- Full type: `Banter.VisualScripting.GetUIBackground`\n- Category: UI/Styles/Appearance\n- Sample GUID: `bf6d420e-5c76-4f1c-9443-f1c2d4b57e9c`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4140, y=3972\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### SetUIAppearance\n\n- Full type: `Banter.VisualScripting.SetUIAppearance`\n- Category: UI/Styles/Appearance\n- Sample GUID: `2e0cce2b-e374-4eff-aec1-0659fd17cbb7`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4488, y=3972\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Background Color | `UnityEngine.Color` | `null` |\n| Opacity | `System.Single` | `1` |\n| Display | `Banter.VisualScripting.UIDisplay` | `\"Flex\"` |\n| Visibility | `Banter.VisualScripting.UIVisibility` | `\"Visible\"` |\n\n### SetUIBackground\n\n- Full type: `Banter.VisualScripting.SetUIBackground`\n- Category: UI/Styles/Appearance\n- Sample GUID: `a782c82b-2faa-4dce-9998-3424cdf24946`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4776, y=3972\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Background Type | `Banter.VisualScripting.BackgroundType` | `\"Color\"` |\n| Texture |  | `null` |\n| Render Texture |  | `null` |\n| Sprite |  | `null` |\n| Vector Image |  | `null` |\n| Color | `UnityEngine.Color` | `null` |\n| Tint Color | `UnityEngine.Color` | `null` |\n\n### GetUIBorder\n\n- Full type: `Banter.VisualScripting.GetUIBorder`\n- Category: UI/Styles/Border\n- Sample GUID: `01c6c469-1b14-44d2-97c4-2d80c505cbd3`\n- Version: `A`\n- Event-like: no\n- Sample position: x=3792, y=4356\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### SetUIBorder\n\n- Full type: `Banter.VisualScripting.SetUIBorder`\n- Category: UI/Styles/Border\n- Sample GUID: `cd6b1fd9-93ed-48fd-8387-c95c7f163831`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4176, y=4356\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Border Width | `System.Single` | `1` |\n| Border Color | `UnityEngine.Color` | `null` |\n| Border Radius | `System.Single` | `0` |\n| Top Left Radius | `System.Single` | `0` |\n| Top Right Radius | `System.Single` | `0` |\n| Bottom Left Radius | `System.Single` | `0` |\n| Bottom Right Radius | `System.Single` | `0` |\n\n### GetUIFlexbox\n\n- Full type: `Banter.VisualScripting.GetUIFlexbox`\n- Category: UI/Styles/Layout\n- Sample GUID: `0778619c-1827-41f9-bd43-96911fafb881`\n- Version: `A`\n- Event-like: no\n- Sample position: x=3744, y=4728\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### GetUIPosition\n\n- Full type: `Banter.VisualScripting.GetUIPosition`\n- Category: UI/Styles/Layout\n- Sample GUID: `36bdc7a1-0eab-40b5-b627-1dbb47190e2b`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4056, y=4728\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### GetUISize\n\n- Full type: `Banter.VisualScripting.GetUISize`\n- Category: UI/Styles/Layout\n- Sample GUID: `f907e364-bef9-4e0c-8da0-2e2646191818`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4344, y=4740\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### SetUIFlexbox\n\n- Full type: `Banter.VisualScripting.SetUIFlexbox`\n- Category: UI/Styles/Layout\n- Sample GUID: `6290c752-266b-43ce-ba5a-39ce192128a3`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4644, y=4728\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Flex Direction | `Banter.VisualScripting.UIFlexDirection` | `\"Column\"` |\n| Justify Content | `Banter.VisualScripting.UIJustifyContent` | `\"FlexStart\"` |\n| Align Items | `Banter.VisualScripting.UIAlignItems` | `\"Stretch\"` |\n| Flex Wrap | `Banter.VisualScripting.UIFlexWrap` | `\"NoWrap\"` |\n| Flex Grow | `System.Single` | `0` |\n| Flex Shrink | `System.Single` | `1` |\n\n### SetUIPosition\n\n- Full type: `Banter.VisualScripting.SetUIPosition`\n- Category: UI/Styles/Layout\n- Sample GUID: `fd087696-e4f5-4931-b1d7-6fb5d883b250`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4944, y=4728\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Position | `Banter.VisualScripting.UIPositionType` | `\"Relative\"` |\n| Left | `System.Single` | `0` |\n| Top | `System.Single` | `0` |\n| Right | `System.Single` | `0` |\n| Bottom | `System.Single` | `0` |\n| Left Unit | `Banter.VisualScripting.LengthUnit` | `\"Pixel\"` |\n| Top Unit | `Banter.VisualScripting.LengthUnit` | `\"Pixel\"` |\n| Right Unit | `Banter.VisualScripting.LengthUnit` | `\"Pixel\"` |\n| Bottom Unit | `Banter.VisualScripting.LengthUnit` | `\"Pixel\"` |\n\n### SetUISize\n\n- Full type: `Banter.VisualScripting.SetUISize`\n- Category: UI/Styles/Layout\n- Sample GUID: `49ac667c-2019-40dc-b368-e3952ad510c1`\n- Version: `A`\n- Event-like: no\n- Sample position: x=5172, y=4728\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Width | `System.Single` | `100` |\n| Height | `System.Single` | `50` |\n| Width Unit | `Banter.VisualScripting.SetUISize+LengthUnit` | `\"Pixel\"` |\n| Height Unit | `Banter.VisualScripting.SetUISize+LengthUnit` | `\"Pixel\"` |\n\n### GetUISpacing\n\n- Full type: `Banter.VisualScripting.GetUISpacing`\n- Category: UI/Styles/Spacing\n- Sample GUID: `ed43e83f-4f7d-4a9f-a96c-0c0bb32c9187`\n- Version: `A`\n- Event-like: no\n- Sample position: x=3756, y=5148\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### SetUISpacing\n\n- Full type: `Banter.VisualScripting.SetUISpacing`\n- Category: UI/Styles/Spacing\n- Sample GUID: `c81162b8-27f4-429a-9165-9da485579a90`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4104, y=5148\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Margin Top | `System.Single` | `0` |\n| Margin Right | `System.Single` | `0` |\n| Margin Bottom | `System.Single` | `0` |\n| Margin Left | `System.Single` | `0` |\n| Padding Top | `System.Single` | `0` |\n| Padding Right | `System.Single` | `0` |\n| Padding Bottom | `System.Single` | `0` |\n| Padding Left | `System.Single` | `0` |\n| Unit | `Banter.VisualScripting.LengthUnit` | `\"Pixel\"` |\n\n### GetUITypography\n\n- Full type: `Banter.VisualScripting.GetUITypography`\n- Category: UI/Styles/Typography\n- Sample GUID: `9d80edaa-fe1f-4573-aca5-394f897259b1`\n- Version: `A`\n- Event-like: no\n- Sample position: x=3744, y=5592\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n\n### SetUITypography\n\n- Full type: `Banter.VisualScripting.SetUITypography`\n- Category: UI/Styles/Typography\n- Sample GUID: `4c4300ed-e742-41e0-bfb1-c9c63d6f5a46`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4080, y=5580\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Font Size | `System.Single` | `14` |\n| Font Style | `Banter.VisualScripting.UIFontStyle` | `\"Normal\"` |\n| Font Weight | `Banter.VisualScripting.UIFontWeight` | `\"Normal\"` |\n| Text Align | `Banter.VisualScripting.UITextAlign` | `\"Left\"` |\n| Text Color | `UnityEngine.Color` | `null` |\n| Line Height | `System.Single` | `0` |\n| Letter Spacing | `System.Single` | `0` |\n| White Space | `Banter.VisualScripting.UIWhiteSpace` | `\"Normal\"` |\n\n### LoadUXMLAsset\n\n- Full type: `Banter.VisualScripting.LoadUXMLAsset`\n- Category: UI/UXML\n- Sample GUID: `4cd738f9-dfb6-4e45-bd6b-4c10067a3d38`\n- Version: `A`\n- Event-like: no\n- Sample position: x=3780, y=6600\n\n| Default value key | Type | Default |\n|---|---|---|\n| gameObject |  | `null` |\n| UXML Asset |  | `null` |\n| Resource Path | `System.String` | `\"\"` |\n\n### ProcessUXMLTree\n\n- Full type: `Banter.VisualScripting.ProcessUXMLTree`\n- Category: UI/UXML\n- Sample GUID: `fcc34a9d-ea39-428e-88bd-65084e4839ca`\n- Version: `A`\n- Event-like: no\n- Sample position: x=4152, y=6624\n\n| Default value key | Type | Default |\n|---|---|---|\n| gameObject |  | `null` |\n| UI Document |  | `null` |\n| Element Prefix | `System.String` | `\"uxml\"` |\n\n### OnDropdownChanged\n\n- Full type: `Banter.VisualScripting.OnDropdownChanged`\n- Category: Ungrouped\n- Sample GUID: `ccd86e5b-5994-4d46-8612-aaf8f260235c`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=3924, y=-3576\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Auto Register | `System.Boolean` | `true` |\n\n### OnIntFieldChanged\n\n- Full type: `Banter.VisualScripting.OnIntFieldChanged`\n- Category: Ungrouped\n- Sample GUID: `771bf63e-8838-49e0-8826-a972ee2a9672`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=3924, y=-3384\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Auto Register | `System.Boolean` | `true` |\n\n### OnMinMaxSliderChanged\n\n- Full type: `Banter.VisualScripting.OnMinMaxSliderChanged`\n- Category: Ungrouped\n- Sample GUID: `050878c5-78b0-4735-b25b-e622cfcf4d77`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=3924, y=-3204\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Auto Register | `System.Boolean` | `true` |\n\n### OnRadioButtonChanged\n\n- Full type: `Banter.VisualScripting.OnRadioButtonChanged`\n- Category: Ungrouped\n- Sample GUID: `16931f10-edd2-4caf-ae6e-4a1c7c17d548`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=3924, y=-2988\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Auto Register | `System.Boolean` | `true` |\n\n### OnRadioButtonGroupChanged\n\n- Full type: `Banter.VisualScripting.OnRadioButtonGroupChanged`\n- Category: Ungrouped\n- Sample GUID: `13efcdc9-6ff4-4b2e-b0fd-8653a3ecc3a5`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=3924, y=-2832\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Auto Register | `System.Boolean` | `true` |\n\n### OnSliderChanged\n\n- Full type: `Banter.VisualScripting.OnSliderChanged`\n- Category: Ungrouped\n- Sample GUID: `c8b5e8af-f0a6-4d72-9626-1a9b75a20903`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=3936, y=-2652\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Auto Register | `System.Boolean` | `true` |\n\n### OnSliderIntChanged\n\n- Full type: `Banter.VisualScripting.OnSliderIntChanged`\n- Category: Ungrouped\n- Sample GUID: `b6d311b7-49c3-4fcc-b47e-066409df0ec4`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=3924, y=-2472\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Auto Register | `System.Boolean` | `true` |\n\n### OnTextFieldChanged\n\n- Full type: `Banter.VisualScripting.OnTextFieldChanged`\n- Category: Ungrouped\n- Sample GUID: `2671b6c9-173f-4c70-af11-48f739a80de8`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=3912, y=-2292\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Auto Register | `System.Boolean` | `true` |\n\n### OnToggleChanged\n\n- Full type: `Banter.VisualScripting.OnToggleChanged`\n- Category: Ungrouped\n- Sample GUID: `6c2748c8-80f8-4c0f-bb23-bd6a24e39518`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=3912, y=-2136\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Auto Register | `System.Boolean` | `true` |\n\n### OnUIChange\n\n- Full type: `Banter.VisualScripting.OnUIChange`\n- Category: Ungrouped\n- Sample GUID: `b63c21a4-5316-4948-9b0f-a2d834332a60`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=3900, y=-1980\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Auto Register | `System.Boolean` | `true` |\n\n### OnUIClick\n\n- Full type: `Banter.VisualScripting.OnUIClick`\n- Category: Ungrouped\n- Sample GUID: `7ba2d564-c626-4b1c-a1e1-99fa6e404143`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=3900, y=-1800\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Auto Register | `System.Boolean` | `true` |\n\n### OnUIKeyboardEvent\n\n- Full type: `Banter.VisualScripting.OnUIKeyboardEvent`\n- Category: Ungrouped\n- Sample GUID: `8461695a-a585-4492-a88f-02c15930f853`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=3900, y=-1620\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Keyboard Event | `Banter.VisualScripting.UIKeyboardEventType` | `\"KeyDown\"` |\n| Auto Register | `System.Boolean` | `true` |\n\n### OnUIMouseEvent\n\n- Full type: `Banter.VisualScripting.OnUIMouseEvent`\n- Category: Ungrouped\n- Sample GUID: `80b07938-0c2b-4790-bcb6-3c0e5e2e11f0`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=3888, y=-1428\n- Serialized fields: `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| Element ID | `System.String` | `\"\"` |\n| Element Name | `System.String` | `\"\"` |\n| Mouse Event | `Banter.VisualScripting.UIMouseEventType` | `\"Click\"` |\n| Auto Register | `System.Boolean` | `true` |\n\n### AddPlayerForce\n\n- Full type: `Banter.VisualScripting.AddPlayerForce`\n- Category: User\n- Sample GUID: `6bc7a8d3-be3c-4284-ad67-c67f10a26951`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-564, y=2316\n\n| Default value key | Type | Default |\n|---|---|---|\n| Force | `UnityEngine.Vector3` | `null` |\n| Mode | `UnityEngine.ForceMode` | `\"Force\"` |\n\n### AddToastMessage\n\n- Full type: `Banter.VisualScripting.AddToastMessage`\n- Category: User\n- Sample GUID: `0b0a98e9-4598-420d-849e-1cb4774d7574`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-360, y=2316\n\n| Default value key | Type | Default |\n|---|---|---|\n| Message | `System.String` | `\"\"` |\n| Color | `UnityEngine.Color` | `null` |\n| Timeout | `System.Int32` | `5` |\n| Delay | `System.Int32` | `0` |\n\n### GetLocalUserInfo\n\n- Full type: `Banter.VisualScripting.GetLocalUserInfo`\n- Category: User\n- Sample GUID: `eb8830c9-bcdd-4e7b-a724-65dd6cb49b16`\n- Version: `A`\n- Event-like: no\n- Sample position: x=120, y=2328\n\nNo serialized default values in the sample asset.\n\n### GetLocalUserState\n\n- Full type: `Banter.VisualScripting.GetLocalUserState`\n- Category: User\n- Sample GUID: `0fdaa720-5eea-4dbc-b1d9-513392cc41ad`\n- Version: `A`\n- Event-like: no\n- Sample position: x=804, y=2328\n\nNo serialized default values in the sample asset.\n\n### GetUserInfo\n\n- Full type: `Banter.VisualScripting.GetUserInfo`\n- Category: User\n- Sample GUID: `7d68deb6-50f1-4c57-b4cf-ee4656b07177`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-144, y=2316\n\n| Default value key | Type | Default |\n|---|---|---|\n| id, uid, or name | `System.String` | `\"\"` |\n\n### GetUserLanguage\n\n- Full type: `Banter.VisualScripting.GetUserLanguage`\n- Category: User\n- Sample GUID: `d8006260-4627-4fa4-bdcc-6497aa95ad0f`\n- Version: `A`\n- Event-like: no\n- Sample position: x=312, y=2328\n\nNo serialized default values in the sample asset.\n\n### GetUserSavedValue\n\n- Full type: `Banter.VisualScripting.GetUserSavedValue`\n- Category: User\n- Sample GUID: `ba1bc049-6f29-4ec6-9415-98efc902ebed`\n- Version: `A`\n- Event-like: no\n- Sample position: x=1008, y=2328\n\n| Default value key | Type | Default |\n|---|---|---|\n| Key | `System.String` | `\"\"` |\n| UserId Or Me | `System.String` | `\"me\"` |\n\n### GetUserState\n\n- Full type: `Banter.VisualScripting.GetUserState`\n- Category: User\n- Sample GUID: `bd79e98b-27c8-478f-898e-bc3b27857deb`\n- Version: `A`\n- Event-like: no\n- Sample position: x=540, y=2328\n\n| Default value key | Type | Default |\n|---|---|---|\n| id, uid, or name | `System.String` | `\"\"` |\n\n### GetVoiceVolume\n\n- Full type: `Banter.VisualScripting.GetVoiceVolume`\n- Category: User\n- Sample GUID: `d63fe1ce-cef7-40db-abb5-6f74884fc3ac`\n- Version: `A`\n- Event-like: no\n- Sample position: x=1716, y=2328\n\nNo serialized default values in the sample asset.\n\n### LockPlayer\n\n- Full type: `Banter.VisualScripting.LockPlayer`\n- Category: User\n- Sample GUID: `d0e22329-35c8-4fa4-bb43-c9b53136aa2e`\n- Version: `A`\n- Event-like: no\n- Sample position: x=1932, y=2328\n\nNo serialized default values in the sample asset.\n\n### OnUserJoined\n\n- Full type: `Banter.VisualScripting.OnUserJoined`\n- Category: User\n- Sample GUID: `d70e2059-8cf2-42fe-bcc6-b8856f6d79e6`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-540, y=-1308\n- Serialized fields: `coroutine`\n\nNo serialized default values in the sample asset.\n\n### OnUserLeft\n\n- Full type: `Banter.VisualScripting.OnUserLeft`\n- Category: User\n- Sample GUID: `b1e25679-865d-44ea-8a1a-35c0fb6b8c2b`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-372, y=-1308\n- Serialized fields: `coroutine`\n\nNo serialized default values in the sample asset.\n\n### RemoveUserSavedValue\n\n- Full type: `Banter.VisualScripting.RemoveUserSavedValue`\n- Category: User\n- Sample GUID: `f501c668-36ec-4f4f-969a-a4aa8968024e`\n- Version: `A`\n- Event-like: no\n- Sample position: x=1476, y=2328\n\n| Default value key | Type | Default |\n|---|---|---|\n| Key | `System.String` | `\"\"` |\n| UserId Or Me | `System.String` | `\"me\"` |\n\n### SetAvatar\n\n- Full type: `Banter.VisualScripting.SetAvatar`\n- Category: User\n- Sample GUID: `8508747d-96cd-406f-b9f7-8e25682a17ef`\n- Version: `A`\n- Event-like: no\n- Sample position: x=2316, y=2328\n\n| Default value key | Type | Default |\n|---|---|---|\n| Local Avatar URL | `System.String` | `\"\"` |\n| Remote Avatar URL | `System.String` | `\"\"` |\n\n### SetUserSavedValue\n\n- Full type: `Banter.VisualScripting.SetUserSavedValue`\n- Category: User\n- Sample GUID: `67914ffd-7c61-49e1-af11-2c11960bf21e`\n- Version: `A`\n- Event-like: no\n- Sample position: x=1248, y=2328\n\n| Default value key | Type | Default |\n|---|---|---|\n| Key | `System.String` | `\"\"` |\n| UserId Or Me | `System.String` | `\"me\"` |\n| Value | `System.String` | `\"\"` |\n\n### TeleportTo\n\n- Full type: `Banter.VisualScripting.TeleportTo`\n- Category: User\n- Sample GUID: `cdf1dbbc-06d4-40fa-b341-23c2b445f028`\n- Version: `A`\n- Event-like: no\n- Sample position: x=2568, y=2328\n\n| Default value key | Type | Default |\n|---|---|---|\n| Position | `UnityEngine.Vector3` | `null` |\n| Rotation | `System.Single` | `0` |\n| Rotation Vector | `UnityEngine.Vector3` | `null` |\n| Stop Velocity | `System.Boolean` | `false` |\n| Is Spawn | `System.Boolean` | `false` |\n\n### UnlockPlayer\n\n- Full type: `Banter.VisualScripting.UnlockPlayer`\n- Category: User\n- Sample GUID: `d553f2e1-4384-4944-81c0-f0128b45e8e5`\n- Version: `A`\n- Event-like: no\n- Sample position: x=2112, y=2328\n\nNo serialized default values in the sample asset.\n\n### AudioListenerSpectrumData\n\n- Full type: `Banter.VisualScripting.AudioListenerSpectrumData`\n- Category: Utils\n- Sample GUID: `f588b002-c1f7-44dc-85d2-dd118e7ca26e`\n- Version: `A`\n- Event-like: no\n- Sample position: x=84, y=2784\n\n| Default value key | Type | Default |\n|---|---|---|\n| Channels | `System.Int32` | `64` |\n| Window | `UnityEngine.FFTWindow` | `\"Rectangular\"` |\n\n### AudioSourceSpectrumData\n\n- Full type: `Banter.VisualScripting.AudioSourceSpectrumData`\n- Category: Utils\n- Sample GUID: `8650bd67-8035-408d-9750-174630b47979`\n- Version: `A`\n- Event-like: no\n- Sample position: x=432, y=2784\n\n| Default value key | Type | Default |\n|---|---|---|\n| AudioSource |  | `null` |\n| Channels | `System.Int32` | `64` |\n| Window | `UnityEngine.FFTWindow` | `\"Rectangular\"` |\n\n### ColorUtilityTryParseHtmlString\n\n- Full type: `Banter.VisualScripting.ColorUtilityTryParseHtmlString`\n- Category: Utils\n- Sample GUID: `02fa5f95-499f-4afc-b5a4-497b3470c9b5`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-636, y=2784\n\n| Default value key | Type | Default |\n|---|---|---|\n| Hex code | `System.String` | `\"#000000\"` |\n\n### CopyToClipboard\n\n- Full type: `Banter.VisualScripting.CopyToClipboard`\n- Category: Utils\n- Sample GUID: `bb629833-45f9-4b9e-a27a-22fbbdf8deac`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-360, y=2784\n\n| Default value key | Type | Default |\n|---|---|---|\n| String | `System.String` | `\"\"` |\n\n### GetPlatform\n\n- Full type: `Banter.VisualScripting.GetPlatform`\n- Category: Utils\n- Sample GUID: `17ab2180-9042-481b-be14-2e05354f510c`\n- Version: `A`\n- Event-like: no\n- Sample position: x=-120, y=2784\n\nNo serialized default values in the sample asset.\n\n### OnGlobalEvent\n\n- Full type: `Banter.VisualScripting.OnGlobalEvent`\n- Category: Utils\n- Sample GUID: `33054d17-08ac-4fff-b6e3-a8f0224b136d`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-540, y=-1116\n- Serialized fields: `argumentCount`, `coroutine`\n\n| Default value key | Type | Default |\n|---|---|---|\n| name | `System.String` | `\"\"` |\n\n### OnSpaceBrowserTexture\n\n- Full type: `Banter.VisualScripting.OnSpaceBrowserTexture`\n- Category: Utils\n- Sample GUID: `14ec79fc-0040-4c92-a3b9-6af2496b636c`\n- Version: `A`\n- Event-like: yes\n- Sample position: x=-336, y=-1116\n- Serialized fields: `coroutine`\n\nNo serialized default values in the sample asset.\n\n### ParseStringInvariant\n\n- Full type: `Banter.VisualScripting.ParseStringInvariant`\n- Category: Utils\n- Sample GUID: `d38ce2e9-05d8-4a84-8239-f115a34d409e`\n- Version: `A`\n- Event-like: no\n- Sample position: x=780, y=2784\n\n| Default value key | Type | Default |\n|---|---|---|\n| string | `System.String` | `\"\"` |\n\n### SendGlobalEvent\n\n- Full type: `Banter.VisualScripting.SendGlobalEvent`\n- Category: Utils\n- Sample GUID: `eef3fd49-913e-4fa5-ba14-0d3ea133cd77`\n- Version: `A`\n- Event-like: no\n- Sample position: x=984, y=2784\n- Serialized fields: `argumentCount`\n\n| Default value key | Type | Default |\n|---|---|---|\n| name | `System.String` | `\"\"` |\n\n### ToStringInvariant\n\n- Full type: `Banter.VisualScripting.ToStringInvariant`\n- Category: Utils\n- Sample GUID: `a111782d-3586-4ca7-9806-ae8a7e87fbaf`\n- Version: `A`\n- Event-like: no\n- Sample position: x=1212, y=2784\n\n| Default value key | Type | Default |\n|---|---|---|\n| float | `System.Single` | `0` |\n\n### TriggerUnityEvent\n\n- Full type: `Banter.VisualScripting.TriggerUnityEvent`\n- Category: Utils\n- Sample GUID: `23a15610-79be-4ab9-ae35-9bd2479b4124`\n- Version: `A`\n- Event-like: no\n- Sample position: x=1404, y=2784\n- Serialized fields: `triggered`, `trigger`, `$id`\n\n| Default value key | Type | Default |\n|---|---|---|\n| Target |  | `null` |\n\n### UnEscapeUrl\n\n- Full type: `Banter.VisualScripting.UnEscapeUrl`\n- Category: Utils\n- Sample GUID: `94ded006-2dfc-4b6f-b0e8-84f14a2d6753`\n- Version: `A`\n- Event-like: no\n- Sample position: x=1692, y=2784\n\nNo serialized default values in the sample asset.\n";
