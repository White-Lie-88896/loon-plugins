# Loon Plugins

Personal Loon plugin collection.

## Sunlogin AdBlock

Direct plugin URL:

```text
https://raw.githubusercontent.com/White-Lie-88896/loon-plugins/main/sunlogin/sunlogin-adblock.plugin
```

Loon import URL:

```text
loon://import?plugin=https%3A%2F%2Fraw.githubusercontent.com%2FWhite-Lie-88896%2Floon-plugins%2Fmain%2Fsunlogin%2Fsunlogin-adblock.plugin
```

Files:

- `sunlogin/sunlogin-adblock.plugin`
- `sunlogin/sunlogin-ad-cleaner.js`
- `sunlogin/install.html`
- `tools/test-sunlogin-cleaner.js`
- `tools/analyze-har.js`

Local testing:

```text
node tools/test-sunlogin-cleaner.js response.json
node tools/analyze-har.js capture.har
```
