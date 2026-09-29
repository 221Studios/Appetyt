# App icon implementation notes

## Decision

Use one simple centered chef-hat mark on a flat orange background. Keep the source artwork square and unmasked; the platform applies the launcher mask.

## Platform constraints

- Android adaptive icons use separate foreground and background layers. Both layers use a 108×108 dp canvas, while essential foreground artwork must stay inside the centered 66×66 dp safe zone. Vectors are preferred and layers must not include their own masks or shadows.
- iOS app-icon source layers are square. iOS applies the rounded-corner mask itself, so the source image should not bake in rounded corners.
- Both platforms recommend simple, centered artwork with clean edges and enough safe space for system masking.

## Sources

- [Android adaptive icon guidance](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive)
- [Android Open Source Project adaptive icon implementation](https://source.android.com/docs/core/display/adaptive-icons)
- [Apple Human Interface Guidelines: App icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Apple asset-catalog app-icon configuration](https://developer.apple.com/documentation/xcode/configuring-your-app-icon)
