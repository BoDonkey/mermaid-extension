<h1>Mermaid Diagrams For ApostropheCMS</h1>
  <p>
    <a aria-label="Apostrophe logo" href="https://v3.docs.apostrophecms.org">
      <img src="https://img.shields.io/badge/MADE%20FOR%20Apostrophe%203-000000.svg?style=for-the-badge&logo=Apostrophe&labelColor=6516dd">
    </a>
    <a aria-label="License" href="https://github.com/apostrophecms/module-template/blob/main/LICENSE.md">
      <img alt="" src="https://img.shields.io/static/v1?style=for-the-badge&labelColor=000000&label=License&message=MIT&color=3DA639">
    </a>
  </p>
This module adds the Mermaid Diagram package for use in an ApostropheCMS project. This package allows for the addition of a number of different diagrams as outlined in the [package documentation](https://mermaid.js.org/).

## Installation

To install the module, use the command line to run this command in an Apostrophe project's root directory:

```
npm install https://github.com/BoDonkey/mermaid-extension.git
```

## Usage

Add the mermaid-widget extension module in the `app.js` file:

```javascript
require('apostrophe')({
  shortName: 'my-project',
  modules: {
    'mermaid-widget': {}
  }
});
```

The widget can then be added to any area in the `widget` property.