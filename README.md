# Ask Kowhai — SharePoint floating chat

See the [documentation index](docs/README.md) for the handover Word document, original diagrams, and comprehensive architecture SVG/PNG.

The SPFx customizer checks the configured Entra group and mounts a floating chat
panel. Opening the panel loads MSAL, the Copilot Studio SDK, and WebChat lazily.
Select **Sign in to chat** to authenticate using Microsoft authorization code
flow with PKCE. No client secret is used. Close/reopen retains the conversation
until SharePoint disposes the extension or the page reloads.

## Configuration

Runtime settings are SPFx extension properties, not constants in the UI code:

| Property | Purpose |
| --- | --- |
| `clientId` | Entra SPA Application (client) ID |
| `tenantId` | Entra Directory (tenant) ID |
| `environmentId` | Copilot Studio environment ID |
| `schemaName` | Agent schema name, not display name |
| `redirectUri` | Registered SPA callback on the SharePoint tenant |
| `allowedGroupId` | Group object ID that controls launcher visibility |
| `chatTitle` | Heading, tooltip, accessible name |
| `iconUrl` | HTTPS URL or web-relative path, e.g. `SiteAssets/uptec-chat.png` |

Edit `config/serve.json` for local debugging. New site installations use
`sharepoint/assets/elements.xml`. `ClientSideInstance.xml` mirrors these settings
but is not included by the current package configuration. Do not register both.
The previous `chatUrl` iframe property is no longer used.

For existing installations, update the existing custom action's
`ClientSideComponentProperties`; replacing the package alone may retain its old
properties. Public IDs and settings can be stored here; never store credentials.
`agentconfig.txt` is reference material, not runtime configuration.

## Entra and Copilot Studio setup

The configured app is `933a24db-023e-41c1-ab6a-2873aef8c631` in tenant
`3d5a2372-e0bb-4405-9831-4d8c4917ffde`.

Register this exact Single-page application redirect URI (no trailing slash):

```
https://aiskillsnz.sharepoint.com/sites/FrontLine
```

Leave implicit grant disabled. Add delegated Power Platform API permission
`CopilotStudio.Copilots.Invoke` and obtain consent under the tenant policy.
The redirect remains the SharePoint site when scripts are served from localhost.
Keep the agent published with **Authenticate with Microsoft**, and ensure the
signed-in account is allowed to use the agent. Launcher group membership does not
replace agent authorization.

## Local test

Use a supported Node version from `package.json` (22.14+ within v22, or the listed
v24/v26 ranges). Run:

```
npm install
npx heft start --nobrowser
```

In another terminal run `npm run debug:url`. Open the printed full URL in the
Edge profile signed into AiSkills. Old bookmarked debug URLs contain old
properties; regenerate the URL after configuration changes. Allow debug scripts
and local network access when prompted. Open the icon, select Sign in to chat,
complete sign-in/consent, then send a harmless test question and a follow-up.
Confirm close/reopen retains the conversation. Test a nonmember sees no launcher.

Sign-in errors include the redirect URI in the panel. `AADSTS50011` means the
redirect does not match the registration. Cancellation leaves the sign-in UI
available for retry. Silent-token interaction errors ask for a fresh button click
so popup sign-in remains associated with a user gesture. A conversation uses the
SDK token acquired at connection time; after token expiry, reload and sign in
again. Automatic refresh of an active connection is not implemented.

## Build and deployment

`npm run build` compiles, lints, runs authentication unit tests, and packages
`sharepoint/solution/aiskillsahrepoint.sppkg`. Unit tests mock Microsoft services;
a live sign-in and response must still be verified in the tenant. Bump solution
and feature versions when publishing an upgrade, replace/deploy the package in
the App Catalog, update the site app as needed, and reconcile registration
properties. Local `heft start` does not update deployed pages.

The SDK/Agents Activity versions are pinned to
`1.10.0-beta.7.g65f69dfa27`, following Microsoft's current SharePoint example for
both standard and newer agent runtimes. These are prerelease dependencies; review
before production rollout. WebChat is pinned to released `4.19.2`. Uploads are
hidden in this integration.

Reference: https://microsoft.github.io/CopilotStudioSamples/ui/embed/sharepoint-customizer/
