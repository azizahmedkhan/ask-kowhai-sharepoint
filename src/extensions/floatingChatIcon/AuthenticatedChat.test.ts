jest.mock('@azure/msal-browser', () => ({
  PublicClientApplication: jest.fn(),
  InteractionRequiredAuthError: class extends Error {
    public constructor(message: string) {
      super(message);
      Object.setPrototypeOf(this, new.target.prototype);
    }
  }
}));
jest.mock('@microsoft/agents-copilotstudio-client', () => ({
  ConnectionSettings: jest.fn().mockImplementation(value => value),
  CopilotStudioClient: Object.assign(jest.fn(), { scopeFromSettings: () => 'https://api.powerplatform.com/.default' }),
  CopilotStudioWebChat: { createConnection: jest.fn() }
}));
jest.mock('botframework-webchat', () => ({ __esModule: true, default: () => null }));
jest.mock('react-dom/client', () => ({ createRoot: jest.fn() }));

import { AuthenticatedChat } from './AuthenticatedChat';
import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';
import { CopilotStudioWebChat } from '@microsoft/agents-copilotstudio-client';
import { createRoot } from 'react-dom/client';


const settings = {
  clientId: 'client', tenantId: 'tenant', environmentId: 'environment', schemaName: 'agent',
  redirectUri: 'https://example.sharepoint.com/sites/chat',
  allowedGroupId: 'group', chatTitle: 'Chat', iconUrl: 'SiteAssets/chat.png'
};

describe('AuthenticatedChat', () => {
  const auth = {
    initialize: jest.fn(), getAllAccounts: jest.fn(), acquireTokenSilent: jest.fn(), acquireTokenPopup: jest.fn()
  };
  const connection = { end: jest.fn() };
  const root = { render: jest.fn(), unmount: jest.fn() };
  let host: HTMLElement;
  beforeEach(() => {
    jest.clearAllMocks();
    auth.getAllAccounts.mockReturnValue([]);
    auth.acquireTokenPopup.mockResolvedValue({ accessToken: 'test-token' });
    auth.acquireTokenSilent.mockResolvedValue({ accessToken: 'test-token' });
    (PublicClientApplication as unknown as jest.Mock).mockImplementation(() => auth);
    (CopilotStudioWebChat.createConnection as jest.Mock).mockReturnValue(connection);
    (createRoot as jest.Mock).mockReturnValue(root);
    host = document.createElement('div');
    host.appendChild(document.createElement('button'));
  });

  it('uses the registered SharePoint callback and delegated scope for interactive sign-in', async () => {
    const chat = new AuthenticatedChat(settings, 'user@example.com');
    await chat.initialize();
    await chat.connect(host);
    expect(auth.acquireTokenPopup).toHaveBeenCalledWith(expect.objectContaining({
      redirectUri: settings.redirectUri, scopes: ['https://api.powerplatform.com/.default']
    }));
    expect(root.render).toHaveBeenCalledTimes(1);
    expect(host.querySelector('button')).toBeNull();
    chat.dispose();
    expect(connection.end).toHaveBeenCalledTimes(1);
    expect(root.unmount).toHaveBeenCalledTimes(1);
  });

  it('uses the matching account silently rather than another cached account', async () => {
    const account = { username: 'user@example.com' };
    auth.getAllAccounts.mockReturnValue([{ username: 'other@example.com' }, account]);
    const chat = new AuthenticatedChat(settings, 'user@example.com');
    await chat.connect(host);
    expect(auth.acquireTokenSilent).toHaveBeenCalledWith(expect.objectContaining({ account }));
    expect(auth.acquireTokenPopup).not.toHaveBeenCalled();
    chat.dispose();
  });

  it('requires a fresh click for interaction after silent renewal fails', async () => {
    auth.getAllAccounts.mockReturnValue([{ username: 'user@example.com' }]);
    auth.acquireTokenSilent.mockRejectedValueOnce(new InteractionRequiredAuthError('interaction_required'));
    const chat = new AuthenticatedChat(settings, 'user@example.com');
    await expect(chat.connect(host)).rejects.toThrow('needs renewal');
    expect(auth.acquireTokenPopup).not.toHaveBeenCalled();
    await chat.connect(host);
    expect(auth.acquireTokenPopup).toHaveBeenCalledTimes(1);
    chat.dispose();
  });

  it('keeps sign-in controls when popup sign-in is cancelled', async () => {
    auth.acquireTokenPopup.mockRejectedValueOnce(new Error('user_cancelled'));
    const chat = new AuthenticatedChat(settings, 'user@example.com');
    await expect(chat.connect(host)).rejects.toThrow('user_cancelled');
    expect(host.querySelector('button')).not.toBeNull();
    expect(root.render).not.toHaveBeenCalled();
  });

  it('does not mount a chat after the panel is disposed during sign-in', async () => {
    let finish: (value: { accessToken: string }) => void = () => undefined;
    auth.acquireTokenPopup.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const chat = new AuthenticatedChat(settings, 'user@example.com');
    const pending = chat.connect(host);
    chat.dispose();
    finish({ accessToken: 'test-token' });
    await pending;
    expect(root.render).not.toHaveBeenCalled();
  });
});
