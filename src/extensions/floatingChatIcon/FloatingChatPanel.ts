import styles from './FloatingChatPanel.module.scss';
import type { IFloatingChatIconApplicationCustomizerProperties } from './FloatingChatIconApplicationCustomizer';

/** Owns the chat DOM and its event listeners; tenant settings come from SPFx properties. */
export class FloatingChatPanel {
  private static _nextId = 0;
  private _elements: HTMLElement[] = [];
  private _disposeChat: (() => void) | undefined;
  private _disposed = false;

  public static validateUrls(settings: IFloatingChatIconApplicationCustomizerProperties, webUrl: string): { icon: URL } {
    if (!settings.clientId || !settings.tenantId || !settings.environmentId || !settings.schemaName || !settings.redirectUri || !settings.iconUrl) {
      throw new Error('Configure clientId, tenantId, environmentId, schemaName, redirectUri and iconUrl in the extension properties.');
    }
    const redirect = new URL(settings.redirectUri);
    if (redirect.protocol !== 'https:' || redirect.origin !== new URL(webUrl).origin || redirect.search || redirect.hash) {
      throw new Error('The redirect URI must be an HTTPS URL on this SharePoint tenant without query parameters or a fragment.');
    }
    const icon = new URL(settings.iconUrl, webUrl + '/');
    if (icon.protocol !== 'https:' || icon.username || icon.password) {
      throw new Error('Icon URL must use HTTPS.');
    }
    return { icon };
  }

  public constructor(container: HTMLElement, settings: IFloatingChatIconApplicationCustomizerProperties, webUrl: string, loginHint: string) {
    const urls = FloatingChatPanel.validateUrls(settings, webUrl);
    const button = document.createElement('button');
    button.type = 'button';
    button.title = settings.chatTitle;
    button.setAttribute('aria-label', `Open ${settings.chatTitle}`);

    button.className = styles.launcher;

    const image = document.createElement('img');

    image.src = urls.icon.href;

    image.alt = settings.chatTitle;

    image.className = styles.icon;

    button.appendChild(image);

    const panel = document.createElement('section');
    panel.id = `floating-chat-${++FloatingChatPanel._nextId}`;
    panel.hidden = true;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', settings.chatTitle);
    panel.className = styles.panel;

    const header = document.createElement('div');
    header.className = styles.header;
    const title = document.createElement('strong');
    title.textContent = settings.chatTitle;
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Close';
    close.setAttribute('aria-label', `Close ${settings.chatTitle}`);
    header.appendChild(title);
    header.appendChild(close);
    panel.appendChild(header);

    button.setAttribute('aria-controls', panel.id);
    button.setAttribute('aria-expanded', 'false');
    const content = document.createElement('div');
    content.className = styles.frame;
    panel.appendChild(content);
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    const signIn = document.createElement('button');
    signIn.type = 'button';
    signIn.textContent = 'Sign in to chat';
    signIn.disabled = true;
    content.appendChild(status);
    content.appendChild(signIn);
    let started = false;
    let connect: (() => Promise<void>) | undefined;
    signIn.addEventListener('click', () => { if (connect) { connect().catch(error => { status.textContent = String(error); }); } });
    const loadChat = async (): Promise<void> => {
      status.textContent = 'Loading secure chat…';
      try {
        const { AuthenticatedChat } = await import(/* webpackChunkName: 'authenticated-chat' */ './AuthenticatedChat');
        if (this._disposed) { return; }
        const chat = new AuthenticatedChat(settings, loginHint);
        await chat.initialize();
        if (this._disposed) { chat.dispose(); return; }
        this._disposeChat = () => chat.dispose();
        status.textContent = 'Sign in with your work account to start chatting.';
        signIn.disabled = false;
        connect = async (): Promise<void> => {
          signIn.disabled = true;
          status.textContent = 'Signing in…';
          try {
            await chat.connect(content);
          } catch (error) {
            if (!this._disposed) {
              status.textContent = `Unable to connect: ${error instanceof Error ? error.message : String(error)}. Redirect URI: ${settings.redirectUri}`;
              signIn.disabled = false;
              signIn.textContent = 'Try sign-in again';
            }
          }
        };
      } catch (error) {
        if (!this._disposed) {
          status.textContent = `Unable to load chat: ${error instanceof Error ? error.message : String(error)}`;
          started = false;
        }
      }
    };
    const closeChat = (): void => {
      panel.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      button.focus();
    };
    close.addEventListener('click', closeChat);
    panel.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeChat();
      }
    });

    button.addEventListener('click', () => {
      if (!panel.hidden) {
        closeChat();
        return;
      }

      if (!started) {
        started = true;
        loadChat().catch(error => { status.textContent = String(error); });
      }

      panel.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      close.focus();
    });

    container.appendChild(panel);
    container.appendChild(button);
    this._elements = [panel, button];
  }

  public dispose(): void {
    this._disposed = true;
    this._disposeChat?.();
    this._disposeChat = undefined;
    this._elements.forEach(element => element.remove());
    this._elements = [];
  }
}
