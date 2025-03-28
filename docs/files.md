# Files

## File Structure

### Frontend

We have the scripts directory that you can run in the terminal or in CI (soon), the app itself is in the src directory.

### GLB files

### Backend

## File naming

### File Naming Convention Standards for GLB files

General Pattern

[modelType]_[version]_[attributes].glb
Attribute Ordering

    Primary identifier (e.g., shape)

    Dimensions (LxWxH)

    Material (if relevant)

    Special features

It is important to think about the default attributes that a model might have. E.g. most chairs have armrests, so we should specifically say no_armrests if they do not.

If this is the first time making a type of component,naming itself can be quite varied, as long as it follows a clear structure that can be broken down via a [handler logic]('/docs/handlerlogic.md'). However, if the handler logic already exists and has been approved, then any following models should adhere to this. If you think there are some missing attributes in the interface, feel free to submit a PR.

Examples

    16:9 Monitor v2 32": 16_9_monitor_2_32in_curved.glb

    L-shaped Desk 200x100x90cm wood top: l-desk_200cm_100cm_90cm_wood.glb

    Black Leather Gaming Chair with no armrests: gaming_chair_black_leather_no_armrests.glb

### File Naming Convention Standards for .tsx Models
