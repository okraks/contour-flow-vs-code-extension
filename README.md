# Contourflow README

ContourFlow is a highly opinionated code formatter for typescript files. It's highly opinionated because the main motivation to create it was to align with coding standards on a legacy project.

## Code Formatting Rules (Features)

- Adds 3 empty lines after a set of import statements, empty lines between consecutive import statements are preserved

- Adds semicolons to the ends of all import statements

- Ensures there are 3 empty lines before a return statement in a .tsx file

- Ensures there is 1 empty line before a return in a .ts file

- Ensures there are exactly 2 lines between functions in a .ts file

- Ensures there is exactly 1 line between functions in a .tsx file

- Ensures there is 1 line between a return statement and end of the function block 



## Requirements

Works with only TypeScript files (.ts and .tsx)

## Extension Settings


This extension contributes the following settings:

* ` "editor.defaultFormatter": "okraks.contourflow"`: Enable/disable this extension.


## Known Issues

N/A. I'd appreciate any feedback from your testing

## Release Notes

Users appreciate release notes as you update your extension.

### 0.0.1

Initial release with initial set of rules (see features)


