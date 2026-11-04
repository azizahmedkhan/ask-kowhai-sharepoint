import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';
import { ConnectionSettings, CopilotStudioClient, CopilotStudioWebChat } from '@microsoft/agents-copilotstudio-client';
import type { CopilotStudioWebChatConnection } from '@microsoft/agents-copilotstudio-client';
import ReactWebChat, { ReactWebChatProps } from 'botframework-webchat';
import { createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import type { IFloatingChatIconApplicationCustomizerProperties } from './FloatingChatIconApplicationCustomizer';

/** Tokens stay in MSAL session storage; extension properties contain only public configuration. */
export class AuthenticatedChat {
  private readonly _auth: PublicClientApplication;
  private readonly _connectionSettings: ConnectionSettings;
  private _connection: CopilotStudioWebChatConnection | undefined;
  private _root: Root | undefined;
  private _disposed = false;
  private _interactiveRequired = false;

  public constructor(private readonly _settings: IFloatingChatIconApplicationCustomizerProperties, private readonly _loginHint: string) {
    this._auth = new PublicClientApplication({
      auth: {
        clientId: _settings.clientId,
        authority: `https://login.microsoftonline.com/${_settings.tenantId}`,
        redirectUri: _settings.redirectUri,
        navigateToLoginRequestUrl: false
      },
      cache: { cacheLocation: 'sessionStorage' }
    });
    this._connectionSettings = new ConnectionSettings({
      environmentId: _settings.environmentId,
      schemaName: _settings.schemaName
    });
  }

  public async initialize(): Promise<void> {
    await this._auth.initialize();
  }

  // Invoked directly by the Sign in button, so the popup is associated with a user gesture.
  public async connect(container: HTMLElement): Promise<void> {
    const request = {
      scopes: [CopilotStudioClient.scopeFromSettings(this._connectionSettings)],
      redirectUri: this._settings.redirectUri,
      loginHint: this._loginHint
    };
    const account = this._auth.getAllAccounts().filter(candidate =>
      candidate.username.toLowerCase() === this._loginHint.toLowerCase()
    )[0];
    let token: string;
    if (account && !this._interactiveRequired) {
      try {
        token = (await this._auth.acquireTokenSilent({ ...request, account })).accessToken;
      } catch (error) {
        if (!(error instanceof InteractionRequiredAuthError)) { throw error; }
        // Ask for another click rather than opening a popup after an asynchronous silent failure.
        this._interactiveRequired = true;
        throw new Error('Your sign-in session needs renewal. Select Try sign-in again.');
      }
    } else {
      token = (await this._auth.acquireTokenPopup(request)).accessToken;
    }
    if (this._disposed) { return; }
    this._connection = CopilotStudioWebChat.createConnection(
      new CopilotStudioClient(this._connectionSettings, token),
      { showTyping: true }
    );
    const host = document.createElement('div');
    host.style.height = '100%';
    // Render before removing the sign-in UI so a synchronous failure remains retryable.
    container.appendChild(host);
    this._root = createRoot(host);
    try {
      this._root.render(createElement(ReactWebChat, {
        directLine: this._connection as unknown as ReactWebChatProps['directLine'],
        locale: document.documentElement.lang || 'en-US',
        styleOptions: { hideUploadButton: true }
      }));
      Array.from(container.children).forEach(child => { if (child !== host) { child.remove(); } });
    } catch (error) {
      this._connection.end();
      this._root.unmount();
      host.remove();
      this._root = undefined;
      throw error;
    }
  }

  public dispose(): void {
    this._disposed = true;
    this._connection?.end();
    this._root?.unmount();
    this._root = undefined;
  }
}
