# Banter Custom Visual Scripting Nodes

Generated from: C:/Users/bobman/Downloads/AllCustomNodes (1).asset
Generated at: 2026-07-01T08:47:02.845Z

## Summary

- Total graph elements: 202
- Banter custom node instances: 162
- Unique Banter custom node types: 162
- Graph group labels: 40

## Category Counts

- AI: 11
- Browser: 6
- Controller: 4
- File: 1
- Files: 1
- Held Events: 11
- Leaderboard: 5
- Networking: 7
- Player/Actions: 7
- Player/Input: 10
- PlayerEvents: 1
- Space: 4
- Trigger: 1
- UI/Elements: 1
- UI/Elements/Container: 3
- UI/Elements/Controls: 8
- UI/Elements/Display: 2
- UI/Events: 2
- UI/Hierarchy: 4
- UI/Panel: 3
- UI/Properties: 2
- UI/Properties/State: 2
- UI/Properties/Text: 2
- UI/Properties/Value: 2
- UI/Styles: 2
- UI/Styles/Appearance: 4
- UI/Styles/Border: 2
- UI/Styles/Layout: 6
- UI/Styles/Spacing: 2
- UI/Styles/Typography: 2
- UI/UXML: 2
- Ungrouped: 13
- User: 17
- Utils: 12

## Nodes

### AiImage

- Full type: `Banter.VisualScripting.AiImage`
- Category: AI
- Sample GUID: `1f488113-4c62-41b0-956f-3d1a8c995131`
- Version: `A`
- Event-like: no
- Sample position: x=-528, y=-228

| Default value key | Type | Default |
|---|---|---|
| Prompt | `System.String` | `""` |
| Ratio | `Banter.SDK.AiImageRatio` | `"_1_1"` |

### AiModel

- Full type: `Banter.VisualScripting.AiModel`
- Category: AI
- Sample GUID: `8f8ba425-764b-4c2d-81e9-4d7ed94b6d27`
- Version: `A`
- Event-like: no
- Sample position: x=-336, y=-228

| Default value key | Type | Default |
|---|---|---|
| Base64 Image | `System.String` | `""` |
| Detail | `Banter.SDK.AiModelSimplify` | `"med"` |
| Texture Size | `System.Int32` | `1024` |

### Base64ToCDN

- Full type: `Banter.VisualScripting.Base64ToCDN`
- Category: AI
- Sample GUID: `bcdd7d7b-4ded-48a9-818c-af777dba0696`
- Version: `A`
- Event-like: no
- Sample position: x=-528, y=-384

| Default value key | Type | Default |
|---|---|---|
| Filename | `System.String` | `""` |
| Base64 String | `System.String` | `""` |

### ObjectTexToBase64

- Full type: `Banter.VisualScripting.ObjectTexToBase64`
- Category: AI
- Sample GUID: `b27e249e-e021-4c53-97d3-4bfac69fee5f`
- Version: `A`
- Event-like: no
- Sample position: x=-312, y=-372

| Default value key | Type | Default |
|---|---|---|
| Material Index | `System.Int32` | `0` |
| gameObject |  | `null` |

### OnAiImage

- Full type: `Banter.VisualScripting.OnAiImage`
- Category: AI
- Sample GUID: `f30215a2-4cb8-47ec-9af3-48755d92f046`
- Version: `A`
- Event-like: yes
- Sample position: x=-468, y=-3852
- Serialized fields: `coroutine`

No serialized default values in the sample asset.
### OnAiModel

- Full type: `Banter.VisualScripting.OnAiModel`
- Category: AI
- Sample GUID: `59173e7f-e947-4f41-8640-d4efafde2805`
- Version: `A`
- Event-like: yes
- Sample position: x=-300, y=-3852
- Serialized fields: `coroutine`

No serialized default values in the sample asset.

### OnBase64CDNLink

- Full type: `Banter.VisualScripting.OnBase64CDNLink`
- Category: AI
- Sample GUID: `b0db24d1-37cb-4d99-9c3f-7658505fa919`
- Version: `A`
- Event-like: yes
- Sample position: x=-132, y=-3852
- Serialized fields: `coroutine`

No serialized default values in the sample asset.

### OnCameraSnap

- Full type: `Banter.VisualScripting.OnCameraSnap`
- Category: AI
- Sample GUID: `3e966b43-aa5a-4d68-929f-fc707f3936ef`
- Version: `A`
- Event-like: yes
- Sample position: x=84, y=-3852
- Serialized fields: `coroutine`

No serialized default values in the sample asset.

### OnSTT

- Full type: `Banter.VisualScripting.OnSTT`
- Category: AI
- Sample GUID: `4bfbbc70-d551-41ab-baac-c9210b68f8b4`
- Version: `A`
- Event-like: yes
- Sample position: x=288, y=-3852
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| Return ID | `System.String` | `""` |

### StartSTT

- Full type: `Banter.VisualScripting.StartSTT`
- Category: AI
- Sample GUID: `848295e4-6e57-4330-bc7d-a7a9fef62692`
- Version: `A`
- Event-like: no
- Sample position: x=-528, y=-48

| Default value key | Type | Default |
|---|---|---|
| Detect Speech | `System.Boolean` | `false` |

### StopSTT

- Full type: `Banter.VisualScripting.StopSTT`
- Category: AI
- Sample GUID: `431843f1-039e-4238-ab95-f401d65988ee`
- Version: `A`
- Event-like: no
- Sample position: x=-300, y=-48

| Default value key | Type | Default |
|---|---|---|
| Return Id | `System.String` | `""` |

### InjectJS

- Full type: `Banter.VisualScripting.InjectJS`
- Category: Browser
- Sample GUID: `a83e1a05-52e8-4bf2-8e67-3b42f8a07221`
- Version: `A`
- Event-like: no
- Sample position: x=-552, y=144

| Default value key | Type | Default |
|---|---|---|
| BullSchript | `System.String` | `""` |
| Return ID | `System.String` | `""` |

### MenuOpenUrl

- Full type: `Banter.VisualScripting.MenuOpenUrl`
- Category: Browser
- Sample GUID: `571d6a0c-f62f-4884-b4ba-092b0d81b6df`
- Version: `A`
- Event-like: no
- Sample position: x=-360, y=144

| Default value key | Type | Default |
|---|---|---|
| Url | `System.String` | `""` |

### OnJsReturnValue

- Full type: `Banter.VisualScripting.OnJsReturnValue`
- Category: Browser
- Sample GUID: `dec6f98c-cb7e-4a3e-b852-831d4136e3bd`
- Version: `A`
- Event-like: yes
- Sample position: x=-456, y=-3564
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| Return ID | `System.String` | `""` |

### OnReceiveBrowserMessage

- Full type: `Banter.VisualScripting.OnReceiveBrowserMessage`
- Category: Browser
- Sample GUID: `12733845-7424-4e3a-8ae8-ab4bb4f188fd`
- Version: `A`
- Event-like: yes
- Sample position: x=-228, y=-3564
- Serialized fields: `coroutine`

No serialized default values in the sample asset.

### OnReceiveMenuBrowserMessage

- Full type: `Banter.VisualScripting.OnReceiveMenuBrowserMessage`
- Category: Browser
- Sample GUID: `6b47c595-594c-45f1-8b61-e4c9cf9b9e11`
- Version: `A`
- Event-like: yes
- Sample position: x=60, y=-3564
- Serialized fields: `coroutine`

No serialized default values in the sample asset.

### ReadJsFromFile

- Full type: `Banter.VisualScripting.ReadJsFromFile`
- Category: Browser
- Sample GUID: `9c3fc61e-c356-482e-b5cc-7b4d759bb22c`
- Version: `A`
- Event-like: no
- Sample position: x=-132, y=156

No serialized default values in the sample asset.

### OnControllerAxisUpdate

- Full type: `Banter.VisualScripting.OnControllerAxisUpdate`
- Category: Controller
- Sample GUID: `806cf1c6-87cb-40dc-aa73-f18be109f164`
- Version: `A`
- Event-like: yes
- Sample position: x=-492, y=-3276
- Serialized fields: `coroutine`

No serialized default values in the sample asset.

### OnControllerButtonPressed

- Full type: `Banter.VisualScripting.OnControllerButtonPressed`
- Category: Controller
- Sample GUID: `5a194b5e-6276-4fc0-a51b-d285a086a4a4`
- Version: `A`
- Event-like: yes
- Sample position: x=-324, y=-3264
- Serialized fields: `coroutine`

No serialized default values in the sample asset.

### OnControllerButtonReleased

- Full type: `Banter.VisualScripting.OnControllerButtonReleased`
- Category: Controller
- Sample GUID: `2d7ce5ba-8c3a-4ad0-ac77-1a572a0b760f`
- Version: `A`
- Event-like: yes
- Sample position: x=-132, y=-3264
- Serialized fields: `coroutine`

No serialized default values in the sample asset.

### OnTriggerAxisUpdate

- Full type: `Banter.VisualScripting.OnTriggerAxisUpdate`
- Category: Controller
- Sample GUID: `dc9d427d-09ff-46bf-b903-98e043059c55`
- Version: `A`
- Event-like: yes
- Sample position: x=60, y=-3264
- Serialized fields: `coroutine`

No serialized default values in the sample asset.

### SelectFile

- Full type: `Banter.VisualScripting.SelectFile`
- Category: File
- Sample GUID: `322bf42e-ac1b-4854-93d0-af8af9a27762`
- Version: `A`
- Event-like: no
- Sample position: x=-552, y=432

| Default value key | Type | Default |
|---|---|---|
| Type | `Banter.SDK.SelectFileType` | `"GLB"` |

### OnSelectFile

- Full type: `Banter.VisualScripting.OnSelectFile`
- Category: Files
- Sample GUID: `7de41d53-8af8-42f8-aa94-54d89f909a00`
- Version: `A`
- Event-like: yes
- Sample position: x=-492, y=-2976
- Serialized fields: `coroutine`

No serialized default values in the sample asset.

### OnGrab

- Full type: `Banter.VisualScripting.OnGrab`
- Category: Held Events
- Sample GUID: `de8a6871-bb28-4be4-96e2-887ecd2a09d5`
- Version: `A`
- Event-like: yes
- Sample position: x=-516, y=-2712
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| banterHeldEvents |  | `null` |

### OnGunTrigger

- Full type: `Banter.VisualScripting.OnGunTrigger`
- Category: Held Events
- Sample GUID: `61d8e252-c385-470d-85aa-fce281feafa2`
- Version: `A`
- Event-like: yes
- Sample position: x=-264, y=-2712
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| banterHeldEvents |  | `null` |

### OnPrimaryDown

- Full type: `Banter.VisualScripting.OnPrimaryDown`
- Category: Held Events
- Sample GUID: `b9e7c592-8bbd-4cfe-a80a-26397ca65895`
- Version: `A`
- Event-like: yes
- Sample position: x=-36, y=-2712
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| banterHeldEvents |  | `null` |

### OnPrimaryUp

- Full type: `Banter.VisualScripting.OnPrimaryUp`
- Category: Held Events
- Sample GUID: `7ce9f468-b5ad-4912-91db-1a1f5f381789`
- Version: `A`
- Event-like: yes
- Sample position: x=192, y=-2712
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| banterHeldEvents |  | `null` |

### OnRelease

- Full type: `Banter.VisualScripting.OnRelease`
- Category: Held Events
- Sample GUID: `a1159f0d-e0c2-4936-a4e7-40aea5b21971`
- Version: `A`
- Event-like: yes
- Sample position: x=420, y=-2712
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| banterHeldEvents |  | `null` |

### OnSecondaryDown

- Full type: `Banter.VisualScripting.OnSecondaryDown`
- Category: Held Events
- Sample GUID: `660e9ac8-71cf-4026-8351-5fd00d6e3d86`
- Version: `A`
- Event-like: yes
- Sample position: x=648, y=-2712
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| banterHeldEvents |  | `null` |

### OnSecondaryUp

- Full type: `Banter.VisualScripting.OnSecondaryUp`
- Category: Held Events
- Sample GUID: `a79a4549-a067-421c-bc69-1c79ee2a0283`
- Version: `A`
- Event-like: yes
- Sample position: x=864, y=-2712
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| banterHeldEvents |  | `null` |

### OnThumbClickDown

- Full type: `Banter.VisualScripting.OnThumbClickDown`
- Category: Held Events
- Sample GUID: `9a77d327-0db5-4be0-ad3a-16cdaa9e402f`
- Version: `A`
- Event-like: yes
- Sample position: x=1080, y=-2712
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| banterHeldEvents |  | `null` |

### OnThumbClickUp

- Full type: `Banter.VisualScripting.OnThumbClickUp`
- Category: Held Events
- Sample GUID: `5ed21b77-783b-43da-9c06-24990663bc2f`
- Version: `A`
- Event-like: yes
- Sample position: x=1296, y=-2712
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| banterHeldEvents |  | `null` |

### OnThumbstick

- Full type: `Banter.VisualScripting.OnThumbstick`
- Category: Held Events
- Sample GUID: `5cab16c5-f22f-42f0-8330-32036fd3dd87`
- Version: `A`
- Event-like: yes
- Sample position: x=1524, y=-2712
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| banterHeldEvents |  | `null` |

### OnTrigger

- Full type: `Banter.VisualScripting.OnTrigger`
- Category: Held Events
- Sample GUID: `f2d9f06c-b1b2-49bb-aa8f-3a704b4f3a99`
- Version: `A`
- Event-like: yes
- Sample position: x=1752, y=-2712
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| banterHeldEvents |  | `null` |

### ClearScores

- Full type: `Banter.VisualScripting.ClearScores`
- Category: Leaderboard
- Sample GUID: `494e0087-9bb5-48c6-b60b-0345fcb06c01`
- Version: `A`
- Event-like: no
- Sample position: x=-528, y=648

| Default value key | Type | Default |
|---|---|---|
| Board | `System.String` | `""` |

### GetCurrentLeaderboard

- Full type: `Banter.VisualScripting.GetCurrentLeaderboard`
- Category: Leaderboard
- Sample GUID: `35a9af69-5097-4b40-bd58-652065063d0d`
- Version: `A`
- Event-like: no
- Sample position: x=-348, y=648

No serialized default values in the sample asset.

### LeaderboardError

- Full type: `Banter.VisualScripting.LeaderboardError`
- Category: Leaderboard
- Sample GUID: `a1929a3a-a28c-4c9e-a3da-65388de9e7b1`
- Version: `A`
- Event-like: yes
- Sample position: x=-516, y=-2448
- Serialized fields: `coroutine`

No serialized default values in the sample asset.

### LeaderboardUpdate

- Full type: `Banter.VisualScripting.LeaderboardUpdate`
- Category: Leaderboard
- Sample GUID: `000f2c71-20f2-4f3c-ab85-3236853073ae`
- Version: `A`
- Event-like: yes
- Sample position: x=-288, y=-2460
- Serialized fields: `coroutine`

No serialized default values in the sample asset.

### SetScore

- Full type: `Banter.VisualScripting.SetScore`
- Category: Leaderboard
- Sample GUID: `5240cd45-4824-4b4e-ab3f-d5cfe4e2e82e`
- Version: `A`
- Event-like: no
- Sample position: x=-96, y=648

| Default value key | Type | Default |
|---|---|---|
| Board | `System.String` | `""` |
| Sort | `Banter.VisualScripting.SortType` | `"ASC"` |
| Score | `System.Single` | `0` |
| Unique | `System.Boolean` | `false` |

### LoadAudioUrl

- Full type: `Banter.VisualScripting.LoadAudioUrl`
- Category: Networking
- Sample GUID: `6826914d-f478-4290-9f15-3ea5eaab0d82`
- Version: `A`
- Event-like: no
- Sample position: x=-528, y=960

| Default value key | Type | Default |
|---|---|---|
| URL | `System.String` | `""` |
| Audio Type | `UnityEngine.AudioType` | `"UNKNOWN"` |

### LoadTextureUrl

- Full type: `Banter.VisualScripting.LoadTextureUrl`
- Category: Networking
- Sample GUID: `3585d7bd-c929-4dd0-9119-33699ff69116`
- Version: `A`
- Event-like: no
- Sample position: x=144, y=972

| Default value key | Type | Default |
|---|---|---|
| URL | `System.String` | `""` |
| Generate Mipmaps | `System.Boolean` | `true` |

### LoadTextUrl

- Full type: `Banter.VisualScripting.LoadTextUrl`
- Category: Networking
- Sample GUID: `808aeb3f-928c-490c-ac69-5dd542735ad1`
- Version: `A`
- Event-like: no
- Sample position: x=-192, y=960

| Default value key | Type | Default |
|---|---|---|
| URL | `System.String` | `""` |
| Method | `System.String` | `"GET"` |
| Body | `System.String` | `""` |
| ContentType | `System.String` | `"application/json"` |

### OnOneShot

- Full type: `Banter.VisualScripting.OnOneShot`
- Category: Networking
- Sample GUID: `cb03fd55-b8bc-4c8f-b9eb-99baec2e1699`
- Version: `A`
- Event-like: yes
- Sample position: x=-528, y=-2184
- Serialized fields: `coroutine`

No serialized default values in the sample asset.

### OnSpaceStatePropsChanged

- Full type: `Banter.VisualScripting.OnSpaceStatePropsChanged`
- Category: Networking
- Sample GUID: `135db947-4444-48d7-8460-76cdc27045ac`
- Version: `A`
- Event-like: yes
- Sample position: x=-324, y=-2184
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| Property Name | `System.String` | `""` |

### SendOneShot

- Full type: `Banter.VisualScripting.SendOneShot`
- Category: Networking
- Sample GUID: `c809df48-a6ef-4278-96bd-437ebcf825cb`
- Version: `A`
- Event-like: no
- Sample position: x=432, y=984

| Default value key | Type | Default |
|---|---|---|
| Data | `System.String` | `""` |
| All Instances | `System.Boolean` | `false` |

### SetSpaceStateProp

- Full type: `Banter.VisualScripting.SetSpaceStateProp`
- Category: Networking
- Sample GUID: `ef247c98-615c-4412-b500-233114e2be49`
- Version: `A`
- Event-like: no
- Sample position: x=636, y=984

| Default value key | Type | Default |
|---|---|---|
| Property Name | `System.String` | `""` |
| Value | `System.String` | `""` |
| Is Public Property? | `System.Boolean` | `true` |

### SetCanCrouch

- Full type: `Banter.VisualScripting.SetCanCrouch`
- Category: Player/Actions
- Sample GUID: `3db9a378-ed3e-4fdf-91f8-eb0ab237c23b`
- Version: `A`
- Event-like: no
- Sample position: x=-576, y=1284

| Default value key | Type | Default |
|---|---|---|
| Can Crouch | `System.Boolean` | `true` |

### SetCanGrab

- Full type: `Banter.VisualScripting.SetCanGrab`
- Category: Player/Actions
- Sample GUID: `9d79e0c1-023c-4708-92fd-a7d8d400fd67`
- Version: `A`
- Event-like: no
- Sample position: x=-372, y=1284

| Default value key | Type | Default |
|---|---|---|
| Can Grab | `System.Boolean` | `true` |

### SetCanGrapple

- Full type: `Banter.VisualScripting.SetCanGrapple`
- Category: Player/Actions
- Sample GUID: `cef94bea-51d3-4663-a840-39094d711671`
- Version: `A`
- Event-like: no
- Sample position: x=-180, y=1284

| Default value key | Type | Default |
|---|---|---|
| Can Grapple | `System.Boolean` | `true` |

### SetCanJump

- Full type: `Banter.VisualScripting.SetCanJump`
- Category: Player/Actions
- Sample GUID: `aac3807b-f367-4797-954a-cec58f5f2bfc`
- Version: `A`
- Event-like: no
- Sample position: x=24, y=1284

| Default value key | Type | Default |
|---|---|---|
| Can Jump | `System.Boolean` | `true` |

### SetCanMove

- Full type: `Banter.VisualScripting.SetCanMove`
- Category: Player/Actions
- Sample GUID: `a95ed859-3310-405a-8d96-8dbe7cd66577`
- Version: `A`
- Event-like: no
- Sample position: x=204, y=1284

| Default value key | Type | Default |
|---|---|---|
| Can Move | `System.Boolean` | `true` |

### SetCanRotate

- Full type: `Banter.VisualScripting.SetCanRotate`
- Category: Player/Actions
- Sample GUID: `a0360fac-bb15-44fb-9b2b-fd75abaf8ba9`
- Version: `A`
- Event-like: no
- Sample position: x=384, y=1284

| Default value key | Type | Default |
|---|---|---|
| Can Rotate | `System.Boolean` | `true` |

### SetCanTeleport

- Full type: `Banter.VisualScripting.SetCanTeleport`
- Category: Player/Actions
- Sample GUID: `d87a6899-fa5c-4ef6-a2d2-11d4d24f02dd`
- Version: `A`
- Event-like: no
- Sample position: x=588, y=1284

| Default value key | Type | Default |
|---|---|---|
| Can Teleport | `System.Boolean` | `true` |

### SetBlockLeftPrimary

- Full type: `Banter.VisualScripting.SetBlockLeftPrimary`
- Category: Player/Input
- Sample GUID: `15c0b33f-9c4d-44b6-a40e-2a469a9977d7`
- Version: `A`
- Event-like: no
- Sample position: x=-576, y=1620

| Default value key | Type | Default |
|---|---|---|
| Block Left Primary | `System.Boolean` | `false` |

### SetBlockLeftSecondary

- Full type: `Banter.VisualScripting.SetBlockLeftSecondary`
- Category: Player/Input
- Sample GUID: `f27160ec-e4d9-4592-9a07-8ecc37fa6e3a`
- Version: `A`
- Event-like: no
- Sample position: x=-324, y=1620

| Default value key | Type | Default |
|---|---|---|
| Block Left Secondary | `System.Boolean` | `false` |

### SetBlockLeftThumbstick

- Full type: `Banter.VisualScripting.SetBlockLeftThumbstick`
- Category: Player/Input
- Sample GUID: `8fefb7c6-75a6-4a02-8d51-f70c30d2b1d2`
- Version: `A`
- Event-like: no
- Sample position: x=-48, y=1620

| Default value key | Type | Default |
|---|---|---|
| Block Left Thumbstick | `System.Boolean` | `false` |

### SetBlockLeftThumbstickClick

- Full type: `Banter.VisualScripting.SetBlockLeftThumbstickClick`
- Category: Player/Input
- Sample GUID: `efe9c521-b2d9-4ada-ab8f-2500517ab03f`
- Version: `A`
- Event-like: no
- Sample position: x=228, y=1620

| Default value key | Type | Default |
|---|---|---|
| Block Left Thumbstick Click | `System.Boolean` | `false` |

### SetBlockLeftTrigger

- Full type: `Banter.VisualScripting.SetBlockLeftTrigger`
- Category: Player/Input
- Sample GUID: `1c2aeec7-73ef-4efa-8f7f-ee49c1ea8ae4`
- Version: `A`
- Event-like: no
- Sample position: x=504, y=1620

| Default value key | Type | Default |
|---|---|---|
| Block Left Trigger | `System.Boolean` | `false` |

### SetBlockRightPrimary

- Full type: `Banter.VisualScripting.SetBlockRightPrimary`
- Category: Player/Input
- Sample GUID: `e8486e8b-e9e6-4c3f-8d6a-1d9a179e8744`
- Version: `A`
- Event-like: no
- Sample position: x=-576, y=1776

| Default value key | Type | Default |
|---|---|---|
| Block Right Primary | `System.Boolean` | `false` |

### SetBlockRightSecondary

- Full type: `Banter.VisualScripting.SetBlockRightSecondary`
- Category: Player/Input
- Sample GUID: `cc15ae91-ba76-4ef2-8c3e-a8821b75cdb7`
- Version: `A`
- Event-like: no
- Sample position: x=-324, y=1776

| Default value key | Type | Default |
|---|---|---|
| Block Right Secondary | `System.Boolean` | `false` |

### SetBlockRightThumbstick

- Full type: `Banter.VisualScripting.SetBlockRightThumbstick`
- Category: Player/Input
- Sample GUID: `0715cbc5-55fe-4165-8f0f-12a14e20412d`
- Version: `A`
- Event-like: no
- Sample position: x=-60, y=1776

| Default value key | Type | Default |
|---|---|---|
| Block Right Thumbstick | `System.Boolean` | `false` |

### SetBlockRightThumbstickClick

- Full type: `Banter.VisualScripting.SetBlockRightThumbstickClick`
- Category: Player/Input
- Sample GUID: `5d13f3cf-5740-4d42-b0c2-2bc978792f4a`
- Version: `A`
- Event-like: no
- Sample position: x=228, y=1788

| Default value key | Type | Default |
|---|---|---|
| Block Right Thumbstick Click | `System.Boolean` | `false` |

### SetBlockRightTrigger

- Full type: `Banter.VisualScripting.SetBlockRightTrigger`
- Category: Player/Input
- Sample GUID: `a4dcaf23-100d-4b6f-b138-c5f24d283a76`
- Version: `A`
- Event-like: no
- Sample position: x=504, y=1788

| Default value key | Type | Default |
|---|---|---|
| Block Right Trigger | `System.Boolean` | `false` |

### OnClick

- Full type: `Banter.VisualScripting.OnClick`
- Category: PlayerEvents
- Sample GUID: `daf0f13b-8e96-421b-ac84-590704eb32c9`
- Version: `A`
- Event-like: yes
- Sample position: x=-516, y=-1968
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| banterPlayerEvents |  | `null` |

### GetSpaceURL

- Full type: `Banter.VisualScripting.GetSpaceURL`
- Category: Space
- Sample GUID: `3d249782-5df1-46c5-a7ac-821fe82a0516`
- Version: `A`
- Event-like: no
- Sample position: x=-552, y=2064

No serialized default values in the sample asset.

### GetUsers

- Full type: `Banter.VisualScripting.GetUsers`
- Category: Space
- Sample GUID: `32d7e421-1daf-4d54-b35d-ef2525f69388`
- Version: `A`
- Event-like: no
- Sample position: x=-372, y=2064

No serialized default values in the sample asset.

### IsSpaceFavourited

- Full type: `Banter.VisualScripting.IsSpaceFavourited`
- Category: Space
- Sample GUID: `bcc861d1-a733-437b-bf86-6ea31aaf3005`
- Version: `A`
- Event-like: no
- Sample position: x=-192, y=2064

No serialized default values in the sample asset.

### OnGetUserState

- Full type: `Banter.VisualScripting.OnGetUserState`
- Category: Space
- Sample GUID: `1c4bc4b2-e64d-4b22-b779-f52fa28d5b89`
- Version: `A`
- Event-like: yes
- Sample position: x=-516, y=-1752
- Serialized fields: `coroutine`

No serialized default values in the sample asset.

### OnBanterTriggerEnter

- Full type: `Banter.VisualScripting.OnBanterTriggerEnter`
- Category: Trigger
- Sample GUID: `4013e0b8-2619-4f4e-b696-c699e9b3869d`
- Version: `A`
- Event-like: yes
- Sample position: x=-528, y=-1548
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| target |  | `null` |

### CreateUIElement

- Full type: `Banter.VisualScripting.CreateUIElement`
- Category: UI/Elements
- Sample GUID: `f03c4e29-3cdf-4030-b6e3-ffae4dc32a5c`
- Version: `A`
- Event-like: no
- Sample position: x=4572, y=480

| Default value key | Type | Default |
|---|---|---|
| Element Type | `Banter.VisualScripting.UIElementTypeVS` | `"Button"` |
| gameObject |  | `null` |
| Parent Element ID | `System.String` | `""` |
| Parent Element Name | `System.String` | `""` |
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### CreateUIBox

- Full type: `Banter.VisualScripting.CreateUIBox`
- Category: UI/Elements/Container
- Sample GUID: `baf8407c-3e97-4fe6-8ed4-4d2536ad0840`
- Version: `A`
- Event-like: no
- Sample position: x=3828, y=-312

| Default value key | Type | Default |
|---|---|---|
| gameObject |  | `null` |
| Parent Element ID | `System.String` | `""` |
| Parent Element Name | `System.String` | `""` |
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### CreateUIFoldout

- Full type: `Banter.VisualScripting.CreateUIFoldout`
- Category: UI/Elements/Container
- Sample GUID: `31c77e08-478d-4ac2-b13f-003d5dda1a97`
- Version: `A`
- Event-like: no
- Sample position: x=4176, y=-312

| Default value key | Type | Default |
|---|---|---|
| gameObject |  | `null` |
| Parent Element ID | `System.String` | `""` |
| Parent Element Name | `System.String` | `""` |
| Text | `System.String` | `"Foldout"` |
| Is Collapsed | `System.Boolean` | `false` |
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### CreateUIScrollView

- Full type: `Banter.VisualScripting.CreateUIScrollView`
- Category: UI/Elements/Container
- Sample GUID: `4f673214-2f7e-42be-8f63-dd9c1c5762f4`
- Version: `A`
- Event-like: no
- Sample position: x=4524, y=-312

| Default value key | Type | Default |
|---|---|---|
| gameObject |  | `null` |
| Parent Element ID | `System.String` | `""` |
| Parent Element Name | `System.String` | `""` |
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### CreateUIButton

- Full type: `Banter.VisualScripting.CreateUIButton`
- Category: UI/Elements/Controls
- Sample GUID: `7320b2a3-5741-43d2-86b8-a1e2d0242902`
- Version: `A`
- Event-like: no
- Sample position: x=3816, y=96

| Default value key | Type | Default |
|---|---|---|
| gameObject |  | `null` |
| Parent Element ID | `System.String` | `""` |
| Parent Element Name | `System.String` | `""` |
| Text | `System.String` | `"Button"` |
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### CreateUIDropdown

- Full type: `Banter.VisualScripting.CreateUIDropdown`
- Category: UI/Elements/Controls
- Sample GUID: `3eaa8ac1-8195-40ea-928a-02078f782852`
- Version: `A`
- Event-like: no
- Sample position: x=4152, y=96

| Default value key | Type | Default |
|---|---|---|
| gameObject |  | `null` |
| Parent Element ID | `System.String` | `""` |
| Parent Element Name | `System.String` | `""` |
| Default Index | `System.Int32` | `0` |
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### CreateUIFloatField

- Full type: `Banter.VisualScripting.CreateUIFloatField`
- Category: UI/Elements/Controls
- Sample GUID: `381b2437-78f3-47e5-b660-0733990d6bdd`
- Version: `A`
- Event-like: no
- Sample position: x=4500, y=108

| Default value key | Type | Default |
|---|---|---|
| gameObject |  | `null` |
| Parent Element ID | `System.String` | `""` |
| Parent Element Name | `System.String` | `""` |
| Initial Value | `System.Single` | `0` |
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### CreateUIIntField

- Full type: `Banter.VisualScripting.CreateUIIntField`
- Category: UI/Elements/Controls
- Sample GUID: `d1568a7d-c9bc-4487-b586-8e1baad92170`
- Version: `A`
- Event-like: no
- Sample position: x=4848, y=108

| Default value key | Type | Default |
|---|---|---|
| gameObject |  | `null` |
| Parent Element ID | `System.String` | `""` |
| Parent Element Name | `System.String` | `""` |
| Initial Value | `System.Int32` | `0` |
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### CreateUILabel

- Full type: `Banter.VisualScripting.CreateUILabel`
- Category: UI/Elements/Controls
- Sample GUID: `1a035d09-0152-4df1-a4c2-8a7e0455ef32`
- Version: `A`
- Event-like: no
- Sample position: x=5196, y=108

| Default value key | Type | Default |
|---|---|---|
| gameObject |  | `null` |
| Parent Element ID | `System.String` | `""` |
| Parent Element Name | `System.String` | `""` |
| Text | `System.String` | `"Label"` |
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### CreateUISlider

- Full type: `Banter.VisualScripting.CreateUISlider`
- Category: UI/Elements/Controls
- Sample GUID: `c474ffdf-d504-46ef-bb10-0480782eb9b0`
- Version: `A`
- Event-like: no
- Sample position: x=5532, y=108

| Default value key | Type | Default |
|---|---|---|
| gameObject |  | `null` |
| Parent Element ID | `System.String` | `""` |
| Parent Element Name | `System.String` | `""` |
| Min Value | `System.Single` | `0` |
| Max Value | `System.Single` | `100` |
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### CreateUITextField

- Full type: `Banter.VisualScripting.CreateUITextField`
- Category: UI/Elements/Controls
- Sample GUID: `ab474391-5660-4f45-a120-e8c03137ff94`
- Version: `A`
- Event-like: no
- Sample position: x=5868, y=108

| Default value key | Type | Default |
|---|---|---|
| gameObject |  | `null` |
| Parent Element ID | `System.String` | `""` |
| Parent Element Name | `System.String` | `""` |
| Placeholder | `System.String` | `""` |
| Initial Value | `System.String` | `""` |
| Is Password | `System.Boolean` | `false` |
| Is Multiline | `System.Boolean` | `false` |
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### CreateUIToggle

- Full type: `Banter.VisualScripting.CreateUIToggle`
- Category: UI/Elements/Controls
- Sample GUID: `63ce6003-bd30-4bbe-804d-032237e2b982`
- Version: `A`
- Event-like: no
- Sample position: x=6204, y=108

| Default value key | Type | Default |
|---|---|---|
| gameObject |  | `null` |
| Parent Element ID | `System.String` | `""` |
| Parent Element Name | `System.String` | `""` |
| Checked | `System.Boolean` | `false` |
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### CreateUIImage

- Full type: `Banter.VisualScripting.CreateUIImage`
- Category: UI/Elements/Display
- Sample GUID: `18cccc11-5396-4948-b555-3dd5d7b0b4a2`
- Version: `A`
- Event-like: no
- Sample position: x=3804, y=504

| Default value key | Type | Default |
|---|---|---|
| gameObject |  | `null` |
| Parent Element ID | `System.String` | `""` |
| Parent Element Name | `System.String` | `""` |
| Texture |  | `null` |
| Sprite |  | `null` |
| Tint Color | `UnityEngine.Color` | `null` |
| Scale Mode | `UnityEngine.ScaleMode` | `"ScaleToFit"` |
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### CreateUIProgressBar

- Full type: `Banter.VisualScripting.CreateUIProgressBar`
- Category: UI/Elements/Display
- Sample GUID: `055a093c-7dba-4a75-b970-a5c168a09991`
- Version: `A`
- Event-like: no
- Sample position: x=4164, y=504

| Default value key | Type | Default |
|---|---|---|
| gameObject |  | `null` |
| Parent Element ID | `System.String` | `""` |
| Parent Element Name | `System.String` | `""` |
| Initial Value | `System.Single` | `0` |
| Min Value | `System.Single` | `0` |
| Max Value | `System.Single` | `100` |
| Title | `System.String` | `""` |
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### RegisterUIClick

- Full type: `Banter.VisualScripting.RegisterUIClick`
- Category: UI/Events
- Sample GUID: `806e834e-f33c-42fe-8b4e-3f649be96023`
- Version: `A`
- Event-like: no
- Sample position: x=3780, y=1104

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### RegisterUIEvent

- Full type: `Banter.VisualScripting.RegisterUIEvent`
- Category: UI/Events
- Sample GUID: `ebd120ce-c76c-4432-86cb-d185917769fb`
- Version: `A`
- Event-like: no
- Sample position: x=4008, y=1104

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Event Type | `Banter.UI.Bridge.UIEventType` | `"Click"` |

### AttachUIChild

- Full type: `Banter.VisualScripting.AttachUIChild`
- Category: UI/Hierarchy
- Sample GUID: `c9ae64e5-2879-4fab-affd-017c31ce6042`
- Version: `A`
- Event-like: no
- Sample position: x=3756, y=1524

| Default value key | Type | Default |
|---|---|---|
| Parent Element ID | `System.String` | `""` |
| Parent Element Name | `System.String` | `""` |
| Child Element ID | `System.String` | `""` |
| Child Element Name | `System.String` | `""` |
| Index | `System.Int32` | `-1` |

### DestroyUIElement

- Full type: `Banter.VisualScripting.DestroyUIElement`
- Category: UI/Hierarchy
- Sample GUID: `19d2f7d9-dd81-4f0f-8b9c-4b688105cc96`
- Version: `A`
- Event-like: no
- Sample position: x=4020, y=1536

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### DetachUIChild

- Full type: `Banter.VisualScripting.DetachUIChild`
- Category: UI/Hierarchy
- Sample GUID: `4a1d95f0-bdca-4c1f-88d6-63f82d0b2f5e`
- Version: `A`
- Event-like: no
- Sample position: x=4248, y=1536

| Default value key | Type | Default |
|---|---|---|
| Parent Element ID | `System.String` | `""` |
| Parent Element Name | `System.String` | `""` |
| Child Element ID | `System.String` | `""` |
| Child Element Name | `System.String` | `""` |

### SetUIParent

- Full type: `Banter.VisualScripting.SetUIParent`
- Category: UI/Hierarchy
- Sample GUID: `63302ae4-5703-426c-90c4-e8bb2251851a`
- Version: `A`
- Event-like: no
- Sample position: x=4512, y=1536

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| New Parent ID | `System.String` | `""` |
| New Parent Name | `System.String` | `""` |

### CreateUIPanel

- Full type: `Banter.VisualScripting.CreateUIPanel`
- Category: UI/Panel
- Sample GUID: `b8e0652e-ee77-4b2b-97b9-51e291bb5f06`
- Version: `A`
- Event-like: no
- Sample position: x=3768, y=2040

| Default value key | Type | Default |
|---|---|---|
| gameObject |  | `null` |
| Resolution | `UnityEngine.Vector2` | `null` |
| Screen Space | `System.Boolean` | `false` |

### DestroyUIPanel

- Full type: `Banter.VisualScripting.DestroyUIPanel`
- Category: UI/Panel
- Sample GUID: `6fe1047c-e6ae-41e8-a873-550dc279ffe5`
- Version: `A`
- Event-like: no
- Sample position: x=4032, y=2040

No serialized default values in the sample asset.

### GetUIPanel

- Full type: `Banter.VisualScripting.GetUIPanel`
- Category: UI/Panel
- Sample GUID: `e07a785a-2c4f-4c48-96bf-9235a3f399a9`
- Version: `A`
- Event-like: no
- Sample position: x=4224, y=2040

| Default value key | Type | Default |
|---|---|---|
| gameObject |  | `null` |

### GetUIProperty

- Full type: `Banter.VisualScripting.GetUIProperty`
- Category: UI/Properties
- Sample GUID: `14a807ed-ee6d-47c2-b27e-3ff454affe91`
- Version: `A`
- Event-like: no
- Sample position: x=3756, y=3372

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Property | `Banter.VisualScripting.UIPropertyNameVS` | `"Text"` |

### SetUIProperty

- Full type: `Banter.VisualScripting.SetUIProperty`
- Category: UI/Properties
- Sample GUID: `e5200760-6e8d-48cb-99dd-0c7ba4f8529d`
- Version: `A`
- Event-like: no
- Sample position: x=4080, y=3372

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Property | `Banter.VisualScripting.UIPropertyNameVS` | `"Text"` |

### SetUIEnabled

- Full type: `Banter.VisualScripting.SetUIEnabled`
- Category: UI/Properties/State
- Sample GUID: `92d3f068-771c-4fa8-8b3e-71999bc3588e`
- Version: `A`
- Event-like: no
- Sample position: x=3768, y=2532

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Enabled | `System.Boolean` | `true` |

### SetUIVisible

- Full type: `Banter.VisualScripting.SetUIVisible`
- Category: UI/Properties/State
- Sample GUID: `22e5c35f-26ac-475f-a7c2-2e477777c5d3`
- Version: `A`
- Event-like: no
- Sample position: x=4008, y=2544

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Visible | `System.Boolean` | `true` |

### GetUIText

- Full type: `Banter.VisualScripting.GetUIText`
- Category: UI/Properties/Text
- Sample GUID: `6eefd591-510a-4f61-a1f0-19a57e7df840`
- Version: `A`
- Event-like: no
- Sample position: x=3756, y=2808

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### SetUIText

- Full type: `Banter.VisualScripting.SetUIText`
- Category: UI/Properties/Text
- Sample GUID: `bc15c45f-7cde-4e59-9f64-3652005669a0`
- Version: `A`
- Event-like: no
- Sample position: x=4032, y=2808

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Text | `System.String` | `""` |

### GetUIValue

- Full type: `Banter.VisualScripting.GetUIValue`
- Category: UI/Properties/Value
- Sample GUID: `eed4d5b0-3dc2-4cc2-8b5e-905e57151fa4`
- Version: `A`
- Event-like: no
- Sample position: x=3780, y=3072

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### SetUIValue

- Full type: `Banter.VisualScripting.SetUIValue`
- Category: UI/Properties/Value
- Sample GUID: `b303988e-8449-4183-9ffe-2f63fd3b3a4b`
- Version: `A`
- Event-like: no
- Sample position: x=4032, y=3072

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Value | `System.Single` | `0` |

### GetUIStyle

- Full type: `Banter.VisualScripting.GetUIStyle`
- Category: UI/Styles
- Sample GUID: `972299d2-dad4-47e6-a3e8-c46c197fd422`
- Version: `A`
- Event-like: no
- Sample position: x=3744, y=5976

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Style Property | `Banter.UI.Bridge.UIStyleProperty` | `"BackgroundColor"` |

### SetUIStyle

- Full type: `Banter.VisualScripting.SetUIStyle`
- Category: UI/Styles
- Sample GUID: `c7f8d09e-0e51-4a79-b959-4987cade5642`
- Version: `A`
- Event-like: no
- Sample position: x=4152, y=5976

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Style Property | `Banter.UI.Bridge.UIStyleProperty` | `"BackgroundColor"` |
| Style Value | `System.String` | `""` |

### GetUIAppearance

- Full type: `Banter.VisualScripting.GetUIAppearance`
- Category: UI/Styles/Appearance
- Sample GUID: `e6cd2dd5-dda5-4048-ae34-7e4421612e8e`
- Version: `A`
- Event-like: no
- Sample position: x=3792, y=3984

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### GetUIBackground

- Full type: `Banter.VisualScripting.GetUIBackground`
- Category: UI/Styles/Appearance
- Sample GUID: `bf6d420e-5c76-4f1c-9443-f1c2d4b57e9c`
- Version: `A`
- Event-like: no
- Sample position: x=4140, y=3972

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### SetUIAppearance

- Full type: `Banter.VisualScripting.SetUIAppearance`
- Category: UI/Styles/Appearance
- Sample GUID: `2e0cce2b-e374-4eff-aec1-0659fd17cbb7`
- Version: `A`
- Event-like: no
- Sample position: x=4488, y=3972

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Background Color | `UnityEngine.Color` | `null` |
| Opacity | `System.Single` | `1` |
| Display | `Banter.VisualScripting.UIDisplay` | `"Flex"` |
| Visibility | `Banter.VisualScripting.UIVisibility` | `"Visible"` |

### SetUIBackground

- Full type: `Banter.VisualScripting.SetUIBackground`
- Category: UI/Styles/Appearance
- Sample GUID: `a782c82b-2faa-4dce-9998-3424cdf24946`
- Version: `A`
- Event-like: no
- Sample position: x=4776, y=3972

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Background Type | `Banter.VisualScripting.BackgroundType` | `"Color"` |
| Texture |  | `null` |
| Render Texture |  | `null` |
| Sprite |  | `null` |
| Vector Image |  | `null` |
| Color | `UnityEngine.Color` | `null` |
| Tint Color | `UnityEngine.Color` | `null` |

### GetUIBorder

- Full type: `Banter.VisualScripting.GetUIBorder`
- Category: UI/Styles/Border
- Sample GUID: `01c6c469-1b14-44d2-97c4-2d80c505cbd3`
- Version: `A`
- Event-like: no
- Sample position: x=3792, y=4356

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### SetUIBorder

- Full type: `Banter.VisualScripting.SetUIBorder`
- Category: UI/Styles/Border
- Sample GUID: `cd6b1fd9-93ed-48fd-8387-c95c7f163831`
- Version: `A`
- Event-like: no
- Sample position: x=4176, y=4356

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Border Width | `System.Single` | `1` |
| Border Color | `UnityEngine.Color` | `null` |
| Border Radius | `System.Single` | `0` |
| Top Left Radius | `System.Single` | `0` |
| Top Right Radius | `System.Single` | `0` |
| Bottom Left Radius | `System.Single` | `0` |
| Bottom Right Radius | `System.Single` | `0` |

### GetUIFlexbox

- Full type: `Banter.VisualScripting.GetUIFlexbox`
- Category: UI/Styles/Layout
- Sample GUID: `0778619c-1827-41f9-bd43-96911fafb881`
- Version: `A`
- Event-like: no
- Sample position: x=3744, y=4728

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### GetUIPosition

- Full type: `Banter.VisualScripting.GetUIPosition`
- Category: UI/Styles/Layout
- Sample GUID: `36bdc7a1-0eab-40b5-b627-1dbb47190e2b`
- Version: `A`
- Event-like: no
- Sample position: x=4056, y=4728

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### GetUISize

- Full type: `Banter.VisualScripting.GetUISize`
- Category: UI/Styles/Layout
- Sample GUID: `f907e364-bef9-4e0c-8da0-2e2646191818`
- Version: `A`
- Event-like: no
- Sample position: x=4344, y=4740

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### SetUIFlexbox

- Full type: `Banter.VisualScripting.SetUIFlexbox`
- Category: UI/Styles/Layout
- Sample GUID: `6290c752-266b-43ce-ba5a-39ce192128a3`
- Version: `A`
- Event-like: no
- Sample position: x=4644, y=4728

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Flex Direction | `Banter.VisualScripting.UIFlexDirection` | `"Column"` |
| Justify Content | `Banter.VisualScripting.UIJustifyContent` | `"FlexStart"` |
| Align Items | `Banter.VisualScripting.UIAlignItems` | `"Stretch"` |
| Flex Wrap | `Banter.VisualScripting.UIFlexWrap` | `"NoWrap"` |
| Flex Grow | `System.Single` | `0` |
| Flex Shrink | `System.Single` | `1` |

### SetUIPosition

- Full type: `Banter.VisualScripting.SetUIPosition`
- Category: UI/Styles/Layout
- Sample GUID: `fd087696-e4f5-4931-b1d7-6fb5d883b250`
- Version: `A`
- Event-like: no
- Sample position: x=4944, y=4728

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Position | `Banter.VisualScripting.UIPositionType` | `"Relative"` |
| Left | `System.Single` | `0` |
| Top | `System.Single` | `0` |
| Right | `System.Single` | `0` |
| Bottom | `System.Single` | `0` |
| Left Unit | `Banter.VisualScripting.LengthUnit` | `"Pixel"` |
| Top Unit | `Banter.VisualScripting.LengthUnit` | `"Pixel"` |
| Right Unit | `Banter.VisualScripting.LengthUnit` | `"Pixel"` |
| Bottom Unit | `Banter.VisualScripting.LengthUnit` | `"Pixel"` |

### SetUISize

- Full type: `Banter.VisualScripting.SetUISize`
- Category: UI/Styles/Layout
- Sample GUID: `49ac667c-2019-40dc-b368-e3952ad510c1`
- Version: `A`
- Event-like: no
- Sample position: x=5172, y=4728

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Width | `System.Single` | `100` |
| Height | `System.Single` | `50` |
| Width Unit | `Banter.VisualScripting.SetUISize+LengthUnit` | `"Pixel"` |
| Height Unit | `Banter.VisualScripting.SetUISize+LengthUnit` | `"Pixel"` |

### GetUISpacing

- Full type: `Banter.VisualScripting.GetUISpacing`
- Category: UI/Styles/Spacing
- Sample GUID: `ed43e83f-4f7d-4a9f-a96c-0c0bb32c9187`
- Version: `A`
- Event-like: no
- Sample position: x=3756, y=5148

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### SetUISpacing

- Full type: `Banter.VisualScripting.SetUISpacing`
- Category: UI/Styles/Spacing
- Sample GUID: `c81162b8-27f4-429a-9165-9da485579a90`
- Version: `A`
- Event-like: no
- Sample position: x=4104, y=5148

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Margin Top | `System.Single` | `0` |
| Margin Right | `System.Single` | `0` |
| Margin Bottom | `System.Single` | `0` |
| Margin Left | `System.Single` | `0` |
| Padding Top | `System.Single` | `0` |
| Padding Right | `System.Single` | `0` |
| Padding Bottom | `System.Single` | `0` |
| Padding Left | `System.Single` | `0` |
| Unit | `Banter.VisualScripting.LengthUnit` | `"Pixel"` |

### GetUITypography

- Full type: `Banter.VisualScripting.GetUITypography`
- Category: UI/Styles/Typography
- Sample GUID: `9d80edaa-fe1f-4573-aca5-394f897259b1`
- Version: `A`
- Event-like: no
- Sample position: x=3744, y=5592

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |

### SetUITypography

- Full type: `Banter.VisualScripting.SetUITypography`
- Category: UI/Styles/Typography
- Sample GUID: `4c4300ed-e742-41e0-bfb1-c9c63d6f5a46`
- Version: `A`
- Event-like: no
- Sample position: x=4080, y=5580

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Font Size | `System.Single` | `14` |
| Font Style | `Banter.VisualScripting.UIFontStyle` | `"Normal"` |
| Font Weight | `Banter.VisualScripting.UIFontWeight` | `"Normal"` |
| Text Align | `Banter.VisualScripting.UITextAlign` | `"Left"` |
| Text Color | `UnityEngine.Color` | `null` |
| Line Height | `System.Single` | `0` |
| Letter Spacing | `System.Single` | `0` |
| White Space | `Banter.VisualScripting.UIWhiteSpace` | `"Normal"` |

### LoadUXMLAsset

- Full type: `Banter.VisualScripting.LoadUXMLAsset`
- Category: UI/UXML
- Sample GUID: `4cd738f9-dfb6-4e45-bd6b-4c10067a3d38`
- Version: `A`
- Event-like: no
- Sample position: x=3780, y=6600

| Default value key | Type | Default |
|---|---|---|
| gameObject |  | `null` |
| UXML Asset |  | `null` |
| Resource Path | `System.String` | `""` |

### ProcessUXMLTree

- Full type: `Banter.VisualScripting.ProcessUXMLTree`
- Category: UI/UXML
- Sample GUID: `fcc34a9d-ea39-428e-88bd-65084e4839ca`
- Version: `A`
- Event-like: no
- Sample position: x=4152, y=6624

| Default value key | Type | Default |
|---|---|---|
| gameObject |  | `null` |
| UI Document |  | `null` |
| Element Prefix | `System.String` | `"uxml"` |

### OnDropdownChanged

- Full type: `Banter.VisualScripting.OnDropdownChanged`
- Category: Ungrouped
- Sample GUID: `ccd86e5b-5994-4d46-8612-aaf8f260235c`
- Version: `A`
- Event-like: yes
- Sample position: x=3924, y=-3576
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Auto Register | `System.Boolean` | `true` |

### OnIntFieldChanged

- Full type: `Banter.VisualScripting.OnIntFieldChanged`
- Category: Ungrouped
- Sample GUID: `771bf63e-8838-49e0-8826-a972ee2a9672`
- Version: `A`
- Event-like: yes
- Sample position: x=3924, y=-3384
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Auto Register | `System.Boolean` | `true` |

### OnMinMaxSliderChanged

- Full type: `Banter.VisualScripting.OnMinMaxSliderChanged`
- Category: Ungrouped
- Sample GUID: `050878c5-78b0-4735-b25b-e622cfcf4d77`
- Version: `A`
- Event-like: yes
- Sample position: x=3924, y=-3204
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Auto Register | `System.Boolean` | `true` |

### OnRadioButtonChanged

- Full type: `Banter.VisualScripting.OnRadioButtonChanged`
- Category: Ungrouped
- Sample GUID: `16931f10-edd2-4caf-ae6e-4a1c7c17d548`
- Version: `A`
- Event-like: yes
- Sample position: x=3924, y=-2988
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Auto Register | `System.Boolean` | `true` |

### OnRadioButtonGroupChanged

- Full type: `Banter.VisualScripting.OnRadioButtonGroupChanged`
- Category: Ungrouped
- Sample GUID: `13efcdc9-6ff4-4b2e-b0fd-8653a3ecc3a5`
- Version: `A`
- Event-like: yes
- Sample position: x=3924, y=-2832
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Auto Register | `System.Boolean` | `true` |

### OnSliderChanged

- Full type: `Banter.VisualScripting.OnSliderChanged`
- Category: Ungrouped
- Sample GUID: `c8b5e8af-f0a6-4d72-9626-1a9b75a20903`
- Version: `A`
- Event-like: yes
- Sample position: x=3936, y=-2652
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Auto Register | `System.Boolean` | `true` |

### OnSliderIntChanged

- Full type: `Banter.VisualScripting.OnSliderIntChanged`
- Category: Ungrouped
- Sample GUID: `b6d311b7-49c3-4fcc-b47e-066409df0ec4`
- Version: `A`
- Event-like: yes
- Sample position: x=3924, y=-2472
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Auto Register | `System.Boolean` | `true` |

### OnTextFieldChanged

- Full type: `Banter.VisualScripting.OnTextFieldChanged`
- Category: Ungrouped
- Sample GUID: `2671b6c9-173f-4c70-af11-48f739a80de8`
- Version: `A`
- Event-like: yes
- Sample position: x=3912, y=-2292
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Auto Register | `System.Boolean` | `true` |

### OnToggleChanged

- Full type: `Banter.VisualScripting.OnToggleChanged`
- Category: Ungrouped
- Sample GUID: `6c2748c8-80f8-4c0f-bb23-bd6a24e39518`
- Version: `A`
- Event-like: yes
- Sample position: x=3912, y=-2136
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Auto Register | `System.Boolean` | `true` |

### OnUIChange

- Full type: `Banter.VisualScripting.OnUIChange`
- Category: Ungrouped
- Sample GUID: `b63c21a4-5316-4948-9b0f-a2d834332a60`
- Version: `A`
- Event-like: yes
- Sample position: x=3900, y=-1980
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Auto Register | `System.Boolean` | `true` |

### OnUIClick

- Full type: `Banter.VisualScripting.OnUIClick`
- Category: Ungrouped
- Sample GUID: `7ba2d564-c626-4b1c-a1e1-99fa6e404143`
- Version: `A`
- Event-like: yes
- Sample position: x=3900, y=-1800
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Auto Register | `System.Boolean` | `true` |

### OnUIKeyboardEvent

- Full type: `Banter.VisualScripting.OnUIKeyboardEvent`
- Category: Ungrouped
- Sample GUID: `8461695a-a585-4492-a88f-02c15930f853`
- Version: `A`
- Event-like: yes
- Sample position: x=3900, y=-1620
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Keyboard Event | `Banter.VisualScripting.UIKeyboardEventType` | `"KeyDown"` |
| Auto Register | `System.Boolean` | `true` |

### OnUIMouseEvent

- Full type: `Banter.VisualScripting.OnUIMouseEvent`
- Category: Ungrouped
- Sample GUID: `80b07938-0c2b-4790-bcb6-3c0e5e2e11f0`
- Version: `A`
- Event-like: yes
- Sample position: x=3888, y=-1428
- Serialized fields: `coroutine`

| Default value key | Type | Default |
|---|---|---|
| Element ID | `System.String` | `""` |
| Element Name | `System.String` | `""` |
| Mouse Event | `Banter.VisualScripting.UIMouseEventType` | `"Click"` |
| Auto Register | `System.Boolean` | `true` |

### AddPlayerForce

- Full type: `Banter.VisualScripting.AddPlayerForce`
- Category: User
- Sample GUID: `6bc7a8d3-be3c-4284-ad67-c67f10a26951`
- Version: `A`
- Event-like: no
- Sample position: x=-564, y=2316

| Default value key | Type | Default |
|---|---|---|
| Force | `UnityEngine.Vector3` | `null` |
| Mode | `UnityEngine.ForceMode` | `"Force"` |

### AddToastMessage

- Full type: `Banter.VisualScripting.AddToastMessage`
- Category: User
- Sample GUID: `0b0a98e9-4598-420d-849e-1cb4774d7574`
- Version: `A`
- Event-like: no
- Sample position: x=-360, y=2316

| Default value key | Type | Default |
|---|---|---|
| Message | `System.String` | `""` |
| Color | `UnityEngine.Color` | `null` |
| Timeout | `System.Int32` | `5` |
| Delay | `System.Int32` | `0` |

### GetLocalUserInfo

- Full type: `Banter.VisualScripting.GetLocalUserInfo`
- Category: User
- Sample GUID: `eb8830c9-bcdd-4e7b-a724-65dd6cb49b16`
- Version: `A`
- Event-like: no
- Sample position: x=120, y=2328

No serialized default values in the sample asset.

### GetLocalUserState

- Full type: `Banter.VisualScripting.GetLocalUserState`
- Category: User
- Sample GUID: `0fdaa720-5eea-4dbc-b1d9-513392cc41ad`
- Version: `A`
- Event-like: no
- Sample position: x=804, y=2328

No serialized default values in the sample asset.

### GetUserInfo

- Full type: `Banter.VisualScripting.GetUserInfo`
- Category: User
- Sample GUID: `7d68deb6-50f1-4c57-b4cf-ee4656b07177`
- Version: `A`
- Event-like: no
- Sample position: x=-144, y=2316

| Default value key | Type | Default |
|---|---|---|
| id, uid, or name | `System.String` | `""` |

### GetUserLanguage

- Full type: `Banter.VisualScripting.GetUserLanguage`
- Category: User
- Sample GUID: `d8006260-4627-4fa4-bdcc-6497aa95ad0f`
- Version: `A`
- Event-like: no
- Sample position: x=312, y=2328

No serialized default values in the sample asset.

### GetUserSavedValue

- Full type: `Banter.VisualScripting.GetUserSavedValue`
- Category: User
- Sample GUID: `ba1bc049-6f29-4ec6-9415-98efc902ebed`
- Version: `A`
- Event-like: no
- Sample position: x=1008, y=2328

| Default value key | Type | Default |
|---|---|---|
| Key | `System.String` | `""` |
| UserId Or Me | `System.String` | `"me"` |

### GetUserState

- Full type: `Banter.VisualScripting.GetUserState`
- Category: User
- Sample GUID: `bd79e98b-27c8-478f-898e-bc3b27857deb`
- Version: `A`
- Event-like: no
- Sample position: x=540, y=2328

| Default value key | Type | Default |
|---|---|---|
| id, uid, or name | `System.String` | `""` |

### GetVoiceVolume

- Full type: `Banter.VisualScripting.GetVoiceVolume`
- Category: User
- Sample GUID: `d63fe1ce-cef7-40db-abb5-6f74884fc3ac`
- Version: `A`
- Event-like: no
- Sample position: x=1716, y=2328

No serialized default values in the sample asset.

### LockPlayer

- Full type: `Banter.VisualScripting.LockPlayer`
- Category: User
- Sample GUID: `d0e22329-35c8-4fa4-bb43-c9b53136aa2e`
- Version: `A`
- Event-like: no
- Sample position: x=1932, y=2328

No serialized default values in the sample asset.

### OnUserJoined

- Full type: `Banter.VisualScripting.OnUserJoined`
- Category: User
- Sample GUID: `d70e2059-8cf2-42fe-bcc6-b8856f6d79e6`
- Version: `A`
- Event-like: yes
- Sample position: x=-540, y=-1308
- Serialized fields: `coroutine`

No serialized default values in the sample asset.

### OnUserLeft

- Full type: `Banter.VisualScripting.OnUserLeft`
- Category: User
- Sample GUID: `b1e25679-865d-44ea-8a1a-35c0fb6b8c2b`
- Version: `A`
- Event-like: yes
- Sample position: x=-372, y=-1308
- Serialized fields: `coroutine`

No serialized default values in the sample asset.

### RemoveUserSavedValue

- Full type: `Banter.VisualScripting.RemoveUserSavedValue`
- Category: User
- Sample GUID: `f501c668-36ec-4f4f-969a-a4aa8968024e`
- Version: `A`
- Event-like: no
- Sample position: x=1476, y=2328

| Default value key | Type | Default |
|---|---|---|
| Key | `System.String` | `""` |
| UserId Or Me | `System.String` | `"me"` |

### SetAvatar

- Full type: `Banter.VisualScripting.SetAvatar`
- Category: User
- Sample GUID: `8508747d-96cd-406f-b9f7-8e25682a17ef`
- Version: `A`
- Event-like: no
- Sample position: x=2316, y=2328

| Default value key | Type | Default |
|---|---|---|
| Local Avatar URL | `System.String` | `""` |
| Remote Avatar URL | `System.String` | `""` |

### SetUserSavedValue

- Full type: `Banter.VisualScripting.SetUserSavedValue`
- Category: User
- Sample GUID: `67914ffd-7c61-49e1-af11-2c11960bf21e`
- Version: `A`
- Event-like: no
- Sample position: x=1248, y=2328

| Default value key | Type | Default |
|---|---|---|
| Key | `System.String` | `""` |
| UserId Or Me | `System.String` | `"me"` |
| Value | `System.String` | `""` |

### TeleportTo

- Full type: `Banter.VisualScripting.TeleportTo`
- Category: User
- Sample GUID: `cdf1dbbc-06d4-40fa-b341-23c2b445f028`
- Version: `A`
- Event-like: no
- Sample position: x=2568, y=2328

| Default value key | Type | Default |
|---|---|---|
| Position | `UnityEngine.Vector3` | `null` |
| Rotation | `System.Single` | `0` |
| Rotation Vector | `UnityEngine.Vector3` | `null` |
| Stop Velocity | `System.Boolean` | `false` |
| Is Spawn | `System.Boolean` | `false` |

### UnlockPlayer

- Full type: `Banter.VisualScripting.UnlockPlayer`
- Category: User
- Sample GUID: `d553f2e1-4384-4944-81c0-f0128b45e8e5`
- Version: `A`
- Event-like: no
- Sample position: x=2112, y=2328

No serialized default values in the sample asset.

### AudioListenerSpectrumData

- Full type: `Banter.VisualScripting.AudioListenerSpectrumData`
- Category: Utils
- Sample GUID: `f588b002-c1f7-44dc-85d2-dd118e7ca26e`
- Version: `A`
- Event-like: no
- Sample position: x=84, y=2784

| Default value key | Type | Default |
|---|---|---|
| Channels | `System.Int32` | `64` |
| Window | `UnityEngine.FFTWindow` | `"Rectangular"` |

### AudioSourceSpectrumData

- Full type: `Banter.VisualScripting.AudioSourceSpectrumData`
- Category: Utils
- Sample GUID: `8650bd67-8035-408d-9750-174630b47979`
- Version: `A`
- Event-like: no
- Sample position: x=432, y=2784

| Default value key | Type | Default |
|---|---|---|
| AudioSource |  | `null` |
| Channels | `System.Int32` | `64` |
| Window | `UnityEngine.FFTWindow` | `"Rectangular"` |

### ColorUtilityTryParseHtmlString

- Full type: `Banter.VisualScripting.ColorUtilityTryParseHtmlString`
- Category: Utils
- Sample GUID: `02fa5f95-499f-4afc-b5a4-497b3470c9b5`
- Version: `A`
- Event-like: no
- Sample position: x=-636, y=2784

| Default value key | Type | Default |
|---|---|---|
| Hex code | `System.String` | `"#000000"` |

### CopyToClipboard

- Full type: `Banter.VisualScripting.CopyToClipboard`
- Category: Utils
- Sample GUID: `bb629833-45f9-4b9e-a27a-22fbbdf8deac`
- Version: `A`
- Event-like: no
- Sample position: x=-360, y=2784

| Default value key | Type | Default |
|---|---|---|
| String | `System.String` | `""` |

### GetPlatform

- Full type: `Banter.VisualScripting.GetPlatform`
- Category: Utils
- Sample GUID: `17ab2180-9042-481b-be14-2e05354f510c`
- Version: `A`
- Event-like: no
- Sample position: x=-120, y=2784

No serialized default values in the sample asset.

### OnGlobalEvent

- Full type: `Banter.VisualScripting.OnGlobalEvent`
- Category: Utils
- Sample GUID: `33054d17-08ac-4fff-b6e3-a8f0224b136d`
- Version: `A`
- Event-like: yes
- Sample position: x=-540, y=-1116
- Serialized fields: `argumentCount`, `coroutine`

| Default value key | Type | Default |
|---|---|---|
| name | `System.String` | `""` |

### OnSpaceBrowserTexture

- Full type: `Banter.VisualScripting.OnSpaceBrowserTexture`
- Category: Utils
- Sample GUID: `14ec79fc-0040-4c92-a3b9-6af2496b636c`
- Version: `A`
- Event-like: yes
- Sample position: x=-336, y=-1116
- Serialized fields: `coroutine`

No serialized default values in the sample asset.

### ParseStringInvariant

- Full type: `Banter.VisualScripting.ParseStringInvariant`
- Category: Utils
- Sample GUID: `d38ce2e9-05d8-4a84-8239-f115a34d409e`
- Version: `A`
- Event-like: no
- Sample position: x=780, y=2784

| Default value key | Type | Default |
|---|---|---|
| string | `System.String` | `""` |

### SendGlobalEvent

- Full type: `Banter.VisualScripting.SendGlobalEvent`
- Category: Utils
- Sample GUID: `eef3fd49-913e-4fa5-ba14-0d3ea133cd77`
- Version: `A`
- Event-like: no
- Sample position: x=984, y=2784
- Serialized fields: `argumentCount`

| Default value key | Type | Default |
|---|---|---|
| name | `System.String` | `""` |

### ToStringInvariant

- Full type: `Banter.VisualScripting.ToStringInvariant`
- Category: Utils
- Sample GUID: `a111782d-3586-4ca7-9806-ae8a7e87fbaf`
- Version: `A`
- Event-like: no
- Sample position: x=1212, y=2784

| Default value key | Type | Default |
|---|---|---|
| float | `System.Single` | `0` |

### TriggerUnityEvent

- Full type: `Banter.VisualScripting.TriggerUnityEvent`
- Category: Utils
- Sample GUID: `23a15610-79be-4ab9-ae35-9bd2479b4124`
- Version: `A`
- Event-like: no
- Sample position: x=1404, y=2784
- Serialized fields: `triggered`, `trigger`, `$id`

| Default value key | Type | Default |
|---|---|---|
| Target |  | `null` |

### UnEscapeUrl

- Full type: `Banter.VisualScripting.UnEscapeUrl`
- Category: Utils
- Sample GUID: `94ded006-2dfc-4b6f-b0e8-84f14a2d6753`
- Version: `A`
- Event-like: no
- Sample position: x=1692, y=2784

No serialized default values in the sample asset.
