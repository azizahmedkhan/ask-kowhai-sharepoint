# Ask Kowhai reproduction and handover guide

Prepared 5 November 2026

This guide combines the tenant and billing runbook with the subsequent SharePoint Framework implementation handover. It is intended for the AiSkills team and Alex to reproduce the proof of concept, understand its current state, and complete validation before production use.

Ask Kowhai is an internal Copilot Studio assistant launched from the FrontLine SharePoint site. The initial milestone is a greeting and a small set of scripted questions; approved SharePoint knowledge and richer actions follow after the basic conversation works.

## 1 Current implementation and validation status

The implemented client is an SPFx Application Customizer. It checks the signed-in user’s Entra group membership, displays a floating icon to eligible users, and opens a chat panel. MSAL handles Microsoft sign-in, the Copilot Studio SDK connects to the agent, and Bot Framework WebChat displays the conversation. No Azure Function, App Service, or custom backend has been added.

The source handover reports a successful build and five passing authentication unit tests. These tests mock Microsoft services. Successful live sign-in, an agent response, and Azure billing have not yet been confirmed. This merged document does not independently verify the tenant, code, licensing, or service compatibility.

The original Web App iframe returned “You don't have access to talk to this bot, contact the owner.” Testing the URL directly showed that the problem extended beyond the floating button. The later implementation replaced the iframe with the authenticated SDK client. The iframe instructions below are retained only as an alternative, not the current delivery path.

One compatibility question remains unresolved: the original runbook identified Ask Kowhai as using the newer Microsoft/GitHub Copilot harness and recorded official SDK support as limited to Standard-harness agents. The later handover reports an SDK implementation but no successful live conversation. Confirm the actual harness and current SDK support before treating this integration as supported or production-ready.

## 2 Environment and configuration inventory

| Item | Recorded value or status |
| --- | --- |
| Tenant | AiSkills |
| Tenant ID | 3d5a2372-e0bb-4405-9831-4d8c4917ffde |
| FrontLine site | https://aiskillsnz.sharepoint.com/sites/FrontLine |
| Site type | Confirm team site or communication site |
| Agent display name | Ask Kowhai |
| Agent schema name | cr02e_askkowhai_t7737d |
| Agent environment | AiSkills (default), Australia |
| Environment ID | Default-3d5a2372-e0bb-4405-9831-4d8c4917ffde |
| Dataverse | Reported installed in Default |
| App registration | AskKowhai SharePoint Chat |
| Client ID | 933a24db-023e-41c1-ab6a-2873aef8c631 |
| SPA redirect URI | https://aiskillsnz.sharepoint.com/sites/FrontLine |
| Access group | Confirm display name and Object ID |
| Azure subscription | AiSkills01 |
| Resource groups | Australia East and New Zealand North reported; one name was rg-aiskills-copilot-dev |
| Azure budget | NZ$50 with an 80% alert; notification rather than a hard cap |
| Initial billing plan | AiSkillsCopilotDev; appeared to use a US/preview region and did not show the required environment |
| Later billing arrangement | Australian arrangement reported created; confirm exact name, portal, scope, and active coverage |
| Other environments | Aziz Khan Developer environment in Australia and a US test environment |
| Original billing error | EnforcementUsageCredits |
| Agent authentication | Implementation requires Authenticate with Microsoft; verify current setting |
| Dependencies | SPFx 1.24.0-rc.0 and a pinned beta agent SDK; preserve package.json and lockfile |

Ask Kowhai remained in the Australian Default environment in the source record. Creating the US test environment did not move the agent. Client ID, tenant ID, schema name, and environment ID identify different resources and are not interchangeable.

## 3 Services portals and administration

### Portal map

Use the same AiSkills work account and confirm the active tenant/directory in every portal.

| Task | Portal |
| --- | --- |
| Buy and assign Microsoft 365 licences, users, roles and current spending policies | [Microsoft 365 admin centre](https://admin.microsoft.com) |
| Create and manage the access group | [Microsoft Entra admin centre](https://entra.microsoft.com) |
| Create and administer the FrontLine site | [SharePoint admin centre](https://admin.microsoft.com/sharepoint) |
| Create the subscription, resource groups, budgets and review costs | [Azure portal](https://portal.azure.com) |
| Create environments, Dataverse, billing plans and inspect Copilot capacity | [Power Platform admin centre](https://admin.powerplatform.microsoft.com) |
| Build, test and publish Ask Kowhai | [Microsoft Copilot Studio](https://copilotstudio.microsoft.com) |
| Develop the SPFx client | [Visual Studio Code](https://code.visualstudio.com) |

### Roles and access

One person can hold several roles during a proof of concept, but use the least-privileged role practical for ongoing operation.

| Work | Typical role needed |
| --- | --- |
| Purchase licences and administer tenant billing | Billing Administrator or applicable billing-account role |
| Add users and assign licences | User Administrator / Licence Administrator |
| Create and manage SharePoint sites | SharePoint Administrator |
| Create Entra groups and membership | Groups Administrator or User Administrator |
| Create Power Platform environments and manage Copilot capacity | Power Platform Administrator |
| Create Azure billing resources | Owner or Contributor on the Azure subscription/resource group |
| Build the agent | Copilot Studio author/maker permission in the selected environment |
| Create Microsoft 365 resource-based spending policies | AI Administrator, or Global Administrator for initial administration |

## 4 Tenant site environment and billing setup

For the existing implementation, verify these prerequisites rather than recreating resources. For a clean rebuild, choose the target environment before building the agent or attaching billing. An Entra tenant contains identities; an app registration identifies the browser client; an Azure subscription provides resource management and billing. Creating any one does not configure the others.

### Obtain Microsoft 365 and SharePoint Online

1. Sign in to the Microsoft 365 admin centre.

2. Go to Billing > Purchase services or work through the organisation's Microsoft reseller/CSP.

3. Obtain a Microsoft 365 business/enterprise subscription that includes SharePoint Online, or the appropriate SharePoint Online plan.

4. Go to Users > Active users and create the required maker, administrator and test-user accounts.

5. Go to Billing > Licences, select the product, and assign a licence to each person who needs SharePoint access.

6. In the licence's app/service settings, confirm that SharePoint Online is enabled.

7. Open the SharePoint admin centre and confirm that the tenant's SharePoint service is provisioned.

Microsoft's current licence-management process is documented at Buy or remove business licences (https://learn.microsoft.com/en-us/office365/admin/subscriptions-and-billing/buy-licenses) and Assign licences to users (https://learn.microsoft.com/en-us/microsoft-365/admin/manage/assign-licenses-to-users).

Evidence to record: tenant name, primary domain, subscription/SKU, licensed users and administrator roles. Do not record passwords or secrets.

### Create the access group in Microsoft Entra ID

For a dedicated audience, create one assigned security group such as Ask Kowhai Users or FrontLine Users.

1. Open the Microsoft Entra admin centre.

2. Go to Entra ID > Groups > All groups > New group.

3. Set Group type to Security.

4. Enter a clear name and description.

5. Set Membership type to Assigned for the proof of concept.

6. Add at least one owner.

7. Add the authorised pilot users as members.

8. Select Create.

9. Record the group's display name and Object ID.

Microsoft documents these exact group steps in Manage Microsoft Entra groups (https://learn.microsoft.com/en-us/entra/fundamentals/how-to-manage-groups).

Use this group as the single audience control where the target service supports Entra security groups. Keep one separate, unapproved test user to prove that access is denied.

### Create the FrontLine SharePoint site

1. Open the SharePoint admin centre.

2. Go to Sites > Active sites > Create.

3. Choose the site type:

- Team site for a collaborating FrontLine group.

- Communication site for a read-focused internal portal.

4. Name the site FrontLine and choose its URL.

5. Select the appropriate regional settings, owners, language and storage settings.

6. Finish site creation and open the site.

7. Create a document library or folder for the future Ask Kowhai source documents.

8. Upload only approved proof-of-concept content.

Microsoft's current creation route is described in Create a SharePoint site (https://learn.microsoft.com/en-gb/sharepoint/create-site-collection).

### Apply SharePoint access

The correct method depends on the site type:

- For a Microsoft 365 group-connected team site, manage normal members through the site's Microsoft 365 group. Microsoft recommends this because group members automatically become site members.

- For a communication site or a dedicated read-only audience, add the Entra security group to the appropriate SharePoint group: Visitors for read access or Members for edit/contribute access.

Process:

1. On the FrontLine site, open Settings > Site permissions.

2. Add the approved group with the intended access level.

3. Keep the owners group small.

4. Test with an approved member.

5. Test with the unapproved account and verify that access is denied.

See Sharing and permissions in modern SharePoint (https://learn.microsoft.com/en-us/sharepoint/modern-experience-sharing-permissions).

### Create the Azure subscription

1. Open the Azure portal using the AiSkills tenant.

2. Search for Subscriptions and select Add.

3. Select the organisation's billing account, billing profile and invoice section as applicable.

4. Name the subscription AiSkills01.

5. Ensure the subscription directory is the same AiSkills Microsoft Entra tenant used by Microsoft 365 and Copilot Studio.

6. Assign an accountable subscription owner and a backup owner.

7. Complete creation and verify that its status is Active.

Azure subscription creation varies by agreement type. Microsoft's current starting point is Create an Azure subscription (https://learn.microsoft.com/en-us/azure/cost-management-billing/manage/create-subscription-request).

### Create the Azure resource group and cost controls

1. In Azure, open Resource groups > Create.

2. Select AiSkills01.

3. Create one clear resource group for the proof of concept, for example rg-aiskills-copilot-dev.

4. Select the region required for the billing resource. Australia is the sensible choice for the current setup.

5. Add tags such as Project=AskKowhai, Owner=Alex/Aziz, Environment=POC and CostCentre=....

6. Under Cost Management + Billing, create a budget and alert recipients.

7. Record that an Azure budget alert is a notification; it does not automatically stop Copilot spending.

The resource group's location stores its metadata and does not automatically determine the region of every connected service. Azure documents this distinction in Manage Azure resource groups (https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/manage-resource-groups-portal).

### Choose the Power Platform environment before building

For a clean rebuild, use one named Australian Sandbox environment for development/testing and include Dataverse. This avoids the ambiguity caused by building in Default and later attempting to attach an ineligible or differently located environment to a billing plan.

1. Open the Power Platform admin centre.

2. Go to Manage > Environments > New.

3. Name it, for example, AiSkills Copilot Dev.

4. Set Region to Australia.

5. Set Type to Sandbox for the proof of concept.

6. Set Add a Dataverse data store to Yes.

7. Set the Dataverse language, currency and security group.

8. Save and wait until provisioning completes successfully.

9. Open the environment and record its environment ID and URL.

Microsoft documents this process at Work with Power Platform environments (https://learn.microsoft.com/en-us/microsoft-copilot-studio/environments-first-run-experience). Standard Power Platform pay-as-you-go association is available for Production and Sandbox environments.

What actually happened in the existing setup: Ask Kowhai was built in the Australian Default environment. The Apps URL proves this because it contains Default-3d5a2372-e0bb-4405-9831-4d8c4917ffde. Keep that fact in the handover; do not say that the agent was moved to the US environment.

### Configure Copilot Credit billing

There are now two administration routes. Select one route for the exact environment and understand the precedence.

#### Recommended route for the existing Default environment agent  Microsoft 365 resource based spending policy

1. Open the Microsoft 365 admin centre.

2. Go to Copilot > Cost Management > Configuration.

3. Select Add spending policy.

4. Give it a clear name, for example Ask Kowhai Australia POC.

5. Set the policy scope to Resources.

6. Choose either:

- Specific resource and select Ask Kowhai, or

- Resource collection > Specific environments and select AiSkills (default).

7. Set a modest monthly policy limit and a smaller per-agent limit suitable for a proof of concept.

8. Configure alert thresholds and recipients.

9. Select the Azure pay-as-you-go billing method linked to AiSkills01.

10. In advanced billing settings, select the Australian billing region and the intended resource group.

11. Create the policy and allow up to 12 minutes for it to apply.

Microsoft confirms that a Microsoft 365 resource-based policy takes precedence over Power Platform capacity allocations and linked billing plans for the covered agent/environment. Identity-based user/group policies are different and are not a substitute for an agent or environment resource policy. See Manage Copilot Studio costs in Microsoft 365 (https://learn.microsoft.com/en-us/copilot/implement/usage-based-billing-manage-copilot-studio-costs).

#### Alternative route for a new eligible Sandbox Production environment  Power Platform billing plan

1. Open the Power Platform admin centre.

2. Go to Licensing > Pay-as-you-go plans > New billing plan.

3. Select the AiSkills01 subscription.

4. Select the intended resource group.

5. Select the Copilot Studio product/meter.

6. In the environment selector, choose Australia.

7. Select the exact Sandbox/Production environment.

8. Save.

9. Go to Licensing > Copilot Studio and configure whether the environment uses allocated capacity, tenant capacity or the pay-as-you-go plan for overage.

Microsoft describes this in Set up Power Platform pay-as-you-go (https://learn.microsoft.com/en-us/power-platform/admin/pay-as-you-go-set-up) and Manage Copilot Credits and capacity (https://learn.microsoft.com/en-us/power-platform/admin/manage-copilot-studio-copilot-credits-capacity).

#### Credit verification

1. In the Power Platform admin centre, go to Licensing > Copilot Studio > Environments.

2. Select the exact environment by ID, not merely by a similar name.

3. Confirm the page shows an active capacity or billing source.

4. Open Manage Agents, find Ask Kowhai and confirm its environment.

5. Set an agent monthly limit and alert.

6. Test the agent.

A spending limit controls consumption; it is not itself a free allocation of credits. If the agent still reports EnforcementUsageCredits, capture the policy name, scope, billing method, environment ID, conversation ID and UTC timestamp for Microsoft support.

## 5 Configure test and publish the agent

Use the existing agent where possible. Confirm its environment ID and schema name against the inventory. Before connecting the SPFx client, confirm that its actual harness supports the selected SDK and authentication flow.

### Create Ask Kowhai in Copilot Studio

1. Open Copilot Studio and use the environment selector to choose the exact Australian environment.

2. Create a new agent named Ask Kowhai.

3. Use a short description such as: “A proof-of-concept assistant demonstrating an AI chatbot launched from the FrontLine SharePoint site.”

4. Add these instructions:

You are Ask Kowhai, a friendly and helpful AI assistant for Uptec.

Your purpose is to demonstrate that an AI chatbot can be launched and used from our SharePoint site.

1. Greet users warmly and introduce yourself as Ask Kowhai.

2. Keep all answers short, simple, and friendly.

3. When a user says "Hi" or "Hello", reply: "Hi! I'm Kowhai, your AiSkills assistant. How can I help you today?"

4. When a user asks "Are you working?", reply: "Yes! Ask Kowhai is working successfully."

5. When a user asks "Where are you running?", reply: "I'm Ask Kowhai, a test agent created using Microsoft Copilot Studio."

6. If you don't know an answer, explain that you're currently a demonstration chatbot.

7. Never pretend to have access to documents or information you haven't been given.

5. Resolve the organisation-name inconsistency: either change “Uptec” to “AiSkills” or change the greeting so both use the same name.

6. For this initial greeting demo, disable/remove Work IQ if the interface allows it. It is unnecessary for scripted responses and uses consumption billing when invoked.

7. Do not connect SharePoint knowledge until the basic billing and response test passes.

### Test before publishing

Ask these questions in the test panel:

1. Hi

2. Are you working?

3. Where are you running?

4. What is your purpose?

5. Can you read our SharePoint documents?

6. What is Uptec's annual leave policy?

Expected result: the first four receive short answers; the last two must not claim access to content that has not been connected.

If EnforcementUsageCredits appears, stop channel work and return to the billing setup in section 4. The prompt is not the cause of that error.

### Publish the agent

1. Select Publish in Copilot Studio.

2. Wait for publishing to complete.

3. Test again using a new session.

4. After later changes, republish; saved draft changes are not automatically delivered to channels.

### Authentication and published access

In Settings > Safety & access, keep Authenticate with Microsoft selected, save, and publish. Ensure intended users have permission to use the published agent. The schema name identifies the agent and differs from its display name. Do not switch off authentication to work around internal-agent access problems.

## 6 Create or restore the SPFx project

For a new project, install VS Code and a supported Node.js version. This project’s package.json supports Node 22.14 or later within v22, plus the specified v24/v26 ranges.

Install the development tools:

npm install --global yo @microsoft/generator-sharepoint @rushstack/heft

Create and open a folder:

mkdir aiskillsahrepoint

cd aiskillsahrepoint

code .

In VS Code’s terminal, run:

yo @microsoft/sharepoint

Choose:

| Generator setting | Selection |
| --- | --- |
| Component type | Extension |
| Extension type | Application Customizer |
| Component name | FloatingChatIcon |

The generator creates the TypeScript project, manifest, and build configuration. SPFx 1.22 and later use the Heft toolchain. Microsoft development setup

For our existing project, do not generate it again. Open the existing folder and use:

npm ci

For exact reproduction, preserve the repository’s package.json and lockfile. The current project uses SPFx 1.24.0-rc.0, which is a release candidate; a freshly generated project may use different versions.

## 7 Configure the Entra browser application

In Microsoft Entra admin center:

1. Select the AiSkills directory.

2. Open Entra ID → App registrations → New registration.

3. Enter AskKowhai SharePoint Chat.

4. Select Accounts in this organizational directory only.

5. Register the application.

Copy these values from Overview:

Application (client) ID:

933a24db-023e-41c1-ab6a-2873aef8c631

Directory (tenant) ID:

3d5a2372-e0bb-4405-9831-4d8c4917ffde

The Object ID is another identifier, but our browser client doesn’t use it.

The registration identifies the application requesting access. It doesn’t automatically grant access to the agent.

### Agent invocation and Graph permissions

Inside that app registration:

1. Open API permissions → Add a permission.

2. Select APIs my organization uses.

3. Search for Power Platform API.

4. Verify its application ID:

8578e004-a5c6-46e7-913e-12f58912df43

5. Select Delegated permissions.

6. Add:

CopilotStudio.Copilots.Invoke

7. Obtain user or administrator consent as required by the tenant’s consent policy.

Delegated means the application acts on behalf of a signed-in user. The SharePoint API permission tile isn’t a substitute for permission to invoke Copilot Studio. Microsoft SDK setup instructions

There are two permission paths in our solution:

| Purpose | How it obtains access |
| --- | --- |
| Check group membership | SPFx’s Microsoft Graph client |
| Invoke the agent | Our Entra app registration and MSAL token |

Our SPFx package requests Graph User.Read. Its permission approval is managed through SharePoint’s API access administration, separately from the custom app registration.

### Browser authentication

In the app registration:

1. Open Authentication → Add a platform.

2. Select Single-page application.

3. Register this exact redirect URI:

https://aiskillsnz.sharepoint.com/sites/FrontLine

4. Use no trailing slash or debug query parameters.

5. Leave the front-channel logout URL blank.

6. Leave both implicit-grant checkboxes unchecked.

7. Save.

Our implementation uses authorization code flow with PKCE. It doesn’t need a client secret.

The callback is the SharePoint site even during local debugging: localhost serves the JavaScript files, while the application runs inside SharePoint. MSAL handles the popup response; we didn’t create a separate callback HTML page. Microsoft SharePoint integration sample

## 8 Implementation configuration and sign in flow

We separated the implementation into these files:

| File | Responsibility |
| --- | --- |
| FloatingChatIconApplicationCustomizer.ts | Validates configuration, checks group membership, mounts and disposes the panel |
| FloatingChatPanel.ts | Creates the icon, panel, close control, sign-in UI, and visible errors |
| FloatingChatPanel.module.scss | Controls appearance and responsive layout |
| AuthenticatedChat.ts | Initializes MSAL, acquires a token, connects the SDK, and mounts WebChat |
| AuthenticatedChat.test.ts | Tests authentication and cleanup behavior |
| scripts/debug-url.cjs | Generates the complete local-testing URL |

The main authentication dependencies are MSAL Browser, the Copilot Studio client, and WebChat.

Tenant-specific settings live in SPFx extension properties, including:

clientId

tenantId

environmentId

schemaName

redirectUri

allowedGroupId

chatTitle

iconUrl

For local testing, those properties are in config/serve.json. Initial site deployment properties are in sharepoint/assets/elements.xml.

The manifest supplies the extension’s identity. It isn’t the runtime configuration store.

### User and token flow

The implemented flow is:

The user opens SharePoint. SPFx checks configured Entra group membership and displays the icon for an eligible user. The user opens the panel and selects Sign in to chat. MSAL obtains an Entra access token, the Copilot Studio SDK connects to the agent, and WebChat displays the conversation.

MSAL first uses a matching cached account when available. When interaction is necessary, the sign-in button opens a popup. The user completes any sign-in, consent, or MFA required by the tenant.

Tokens are cached through MSAL in browser session storage. No token or client secret is stored in the extension configuration.

The group check controls icon visibility. Agent authorization and access to underlying resources remain separate controls.

## 9 Local debugging and functional testing

Trust the development certificate when setting up the machine:

npx heft trust-dev-cert

Start the local server:

npx heft start --nobrowser

Keep that terminal running.

In another terminal, generate the debug URL:

npm run debug:url

This is a project-specific helper we added, not a standard Heft command.

Open the entire printed URL in the Edge profile signed into AiSkills. It includes:

| Query parameter | Purpose |
| --- | --- |
| loadSPFX=true | Requests SPFx loading |
| debugManifestsFile=... | Points SharePoint at the local manifests |
| customActions=... | Supplies the extension ID and current properties |
| noredir=true | Included in the generated debug URL |

The local manifest endpoint is:

https://localhost:4321/temp/build/manifests.js

Accept SharePoint’s Load debug scripts prompt and allow the site’s Local network access request when appropriate. Edge can otherwise block SharePoint from loading localhost resources. Microsoft debugging guidance

Opening only this ordinary URL loads the deployed version:

https://aiskillsnz.sharepoint.com/sites/FrontLine

Regenerate the debug URL whenever configuration changes—old URLs contain old properties.

### Functional checks and troubleshooting

Perform these checks in Edge:

1. Sign into SharePoint as a member of the configured group.

2. Open the newly generated debug URL.

3. Confirm the icon appears.

4. Open it and select Sign in to chat.

5. Complete Microsoft sign-in.

6. Send a harmless question.

7. Send a follow-up to verify conversation context.

8. Close and reopen the panel.

9. Verify a nonmember doesn’t see the icon.

10. Cancel sign-in and verify retry remains available.

Useful troubleshooting distinctions:

| Symptom | What to check |
| --- | --- |
| Debug manifest error | Server, certificate, Edge local-network permission |
| Icon hidden | Group membership, Graph access, extension properties |
| Old “Coming Soon” behavior | Old deployed code or an old extension instance |
| AADSTS50011 | Exact redirect URI match |
| Agent access denied | Published-agent access, signed-in account, tenant, consent |
| Report-only CSP warning | It logs a policy violation but doesn’t itself block that request |

The five passing unit tests cover popup configuration, cached-account selection, interaction retry, cancellation, and disposal during sign-in. They mock Microsoft services and don’t prove a live conversation works.

## 10 Build and deploy

Run:

npm run build

Our script executes:

heft test --clean --production

heft package-solution --production

It produces:

sharepoint/solution/aiskillsahrepoint.sppkg

For deployment:

1. Increase the solution and feature versions when publishing an upgrade.

2. Upload the package to the SharePoint App Catalog.

3. Deploy/enable it.

4. Install or update the app on the target site.

5. Approve any required SPFx API requests.

6. Verify the existing extension registration has the current properties.

7. Test using the normal SharePoint URL without debug parameters.

Our current package requires site installation: skipFeatureDeployment is false.

Replacing the package may retain an existing custom action’s old configuration. Update that registration rather than adding a duplicate extension.

## 11 Channel alternatives and SharePoint knowledge

The source runbook reported Teams/Microsoft Copilot and Web App/Apps as available for this agent, with no native SharePoint tile. It attributed this to the newer harness. Verify the actual harness and channel availability in the portal before choosing an alternative. A Standard-harness agent was the documented route in that runbook for native SharePoint deployment.

| Option | Suitable use | Main consideration |
| --- | --- | --- |
| Current: Entra user sign-in + SDK | Custom floating panel with an authenticated agent | We maintain the client, token lifecycle, and dependencies |
| Built-in SharePoint channel | Standard authenticated SharePoint experience | Less custom UI code; evaluate whether its supported experience meets the requirement |
| Teams / Microsoft 365 channel | Users interact through Microsoft’s standard clients | Avoids maintaining this custom SharePoint chat interface |
| Authenticate manually | Custom OAuth requirements or supported external channels | Requires identity-provider configuration and possibly token-exchange/SSO work |
| No authentication | Public-information agents intended for anonymous access | Anyone with the link can interact; unsuitable as a shortcut for an internal agent |

Copilot Studio’s manual authentication supports Entra configurations and generic OAuth 2.0 providers. Channel compatibility and access to knowledge/tools must be checked before changing modes. Microsoft authentication options

Also distinguish SSO from anonymous access: SSO reuses an authenticated identity where possible. Our current implementation still presents a sign-in button and may require a popup.

### Add the Web App iframe to a SharePoint page

The Apps/Web App panel supplied an iframe URL for the current agent.

1. Open the FrontLine SharePoint page in edit mode.

2. Add the Embed web part.

3. Paste only the iframe element, not the surrounding <!DOCTYPE>, <html> and <body> tags.

4. Use a reasonable height, for example 600 px.

5. Preview the page and test with the authorised account.

6. Save as a draft first.

7. Test the direct iframe URL and the page with the unauthorised account before publishing broadly.

8. If SharePoint reports that embedding is blocked, ask the SharePoint administrator to allow the required copilotstudio.microsoft.com domain under the tenant/site embed policy.

Example shape:

<iframe

src="PASTE-THE-COPILOT-STUDIO-WEBCHAT-URL-HERE"

width="100%"

height="600"

frameborder="0"

style="border:0"

title="Ask Kowhai">

</iframe>

Important: restricting the SharePoint page does not prove that the direct webchat URL is restricted. Test both. Do not turn off authentication merely to make an iframe appear if the agent will access internal content.

### Add SharePoint as knowledge later

“SharePoint knowledge” and “SharePoint channel” are different:

- A knowledge source lets the agent search approved SharePoint content.

- A channel is where the user opens and chats with the agent.

After the basic agent works:

1. Add one narrowly scoped SharePoint site, library, folder or file as knowledge.

2. Sign in with an account that has access to that content.

3. Confirm indexing/readiness.

4. Ask questions whose answers appear only in the test documents.

5. Verify that answers cite the expected source.

6. Test with an approved and an unapproved user.

7. Do not assume adding the agent to a page grants permission to its knowledge. SharePoint permissions remain authoritative.

## 12 Acceptance and production readiness

The SPFx proof of concept has configurable settings, authenticated SDK connection code, group-based icon visibility, cleanup, and passing automated checks as reported in the implementation handover. Complete the following validation and retain evidence before sign-off.

### Tenant billing and access

- Confirm SharePoint licensing, the FrontLine site type, and the approved group’s name and Object ID.

- Verify authorised site access and denial for an unapproved account.

- Confirm Dataverse, the exact agent environment, and the active billing or capacity source.

- Record the Australian billing policy’s name, administration portal, scope, billing method, monthly agent limit, and alert recipients. Capture evidence that it covers the agent or exact environment.

- Confirm usage appears in the relevant Microsoft 365 or Power Platform cost-management view.

### Agent and deployed client

- Confirm the agent harness supports the selected SDK and authentication flow.

- Verify Authenticate with Microsoft, published-agent sharing, and current publication.

- Confirm the scripted greeting in Copilot Studio after the billing change.

- Complete live Microsoft sign-in and verify an agent response plus a contextual follow-up in SharePoint.

- Test close/reopen, cancellation and retry, and the absence of the icon for a nonmember. Icon visibility alone does not prove agent authorization.

- Test the installed package at the normal SharePoint URL with representative users.

- If using an iframe alternative, test both the restricted page and direct iframe URL for unintended access.

- Confirm the agent does not claim knowledge it has not received. When SharePoint knowledge is enabled, verify correct answers, citations, and source permissions.

### Engineering hardening

- Implement active-conversation token refresh. The current workaround is to reload and sign in again after expiry.

- Review the SPFx release candidate and pinned beta SDK before production.

- Review dependency findings and record the final package versions and production deployment result.

## 13 Troubleshooting lessons

Confirm the exact agent environment before creating billing resources. An enabled plan does not prove the agent is in scope; identity-based spending policies and resource-based agent policies serve different purposes. A spending limit is not a free credit allocation, and an Azure budget alert does not itself stop spending.

Separate SharePoint presentation, agent authorization, and access to source documents. A visible icon or accessible SharePoint page does not grant agent access. A working agent channel does not automatically make SharePoint content available as knowledge.

The iframe access failure led to the current SDK implementation, but switching clients does not by itself resolve agent sharing, billing, or harness support. Complete those checks before diagnosing the remaining issue as a UI fault. Work IQ can be deferred until the greeting demonstration works.

## 14 Handover explanation for Alex

We built Ask Kowhai across the AiSkills Microsoft 365 tenant and implemented a configurable SPFx extension on FrontLine. Eligible Entra group members see a floating chat icon. The panel uses MSAL authorization code flow with PKCE and the Copilot Studio SDK to connect to the Microsoft-authenticated agent. SharePoint hosts the client and controls document access; Power Platform hosts the agent environment and Dataverse; billing must cover that exact agent or environment.

The source handover reports a successful build and five passing authentication unit tests. Live sign-in, agent responses, billing coverage, and SDK compatibility with the actual harness still require validation. Local development uses Heft and a generated SharePoint debug URL; deployment uses an SPFx package through the App Catalog. Token refresh, prerelease dependencies, and production deployment checks remain before production sign-off.

## 15 Reference notes

This document consolidates the two supplied handovers dated or provided on 5 November 2026. Source-specific status and unverified observations have been retained as such. Microsoft documentation links in the setup sections are retained from the original runbook; product behavior and portal labels should be checked during reproduction.

Additional references retained from the original runbook:

- Available channels for newer agents: https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/publication-channels-overview

- Native SharePoint publishing: https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-add-bot-to-sharepoint

- Copilot Studio SDK integration and support: https://learn.microsoft.com/en-us/microsoft-365/agents-sdk/integrate-with-mcs

The later implementation text included generic Microsoft reference labels without URLs. Those labels have been omitted rather than converted into unverified links.
