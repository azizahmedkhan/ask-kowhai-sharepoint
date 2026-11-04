
import { Log } from '@microsoft/sp-core-library';

import {
  BaseApplicationCustomizer,
  PlaceholderContent,
  PlaceholderName
} from '@microsoft/sp-application-base';

import { FloatingChatPanel } from './FloatingChatPanel';

const LOG_SOURCE = 'FloatingChatIcon';

export interface IFloatingChatIconApplicationCustomizerProperties {
  clientId: string;
  tenantId: string;
  environmentId: string;
  schemaName: string;
  redirectUri: string;
  allowedGroupId: string;
  chatTitle: string;
  iconUrl: string;
}

export default class FloatingChatIconApplicationCustomizer
  extends BaseApplicationCustomizer<IFloatingChatIconApplicationCustomizerProperties> {

  private _bottomPlaceholder: PlaceholderContent | undefined;

  private _chatPanel: FloatingChatPanel | undefined;

  // Start the extension
  public async onInit(): Promise<void> {
    if (!this.properties.allowedGroupId || !this.properties.chatTitle) {
      Log.error(LOG_SOURCE, new Error('Chat title and allowed group ID must be configured.'));
      return;
    }
    try {
      FloatingChatPanel.validateUrls(this.properties, this.context.pageContext.web.absoluteUrl);
    } catch (error) {
      Log.error(LOG_SOURCE, error as Error);
      return;
    }
    Log.info(LOG_SOURCE, 'Floating chat initialized');

    try {
      const graph = await this.context.msGraphClientFactory
        .getClient('3');

      const result: { value: string[] } = await graph
        .api('/me/checkMemberGroups')
        .post({
          groupIds: [this.properties.allowedGroupId]
        });

      // indexOf works with the project's current TS settings
      const isFrontlineUser =
        result.value.indexOf(this.properties.allowedGroupId) !== -1;

      if (!isFrontlineUser) {
        console.log('Not a frontline user. Chat hidden.');
        return;
      }

      console.log('Frontline user. Showing chat icon.');

      this.context.placeholderProvider.changedEvent.add(
        this,
        this._renderChatIcon
      );

      this._renderChatIcon();

    } catch (error) {
      console.error('Group membership check failed:', error);
      // Fail closed: do not show the icon.
    }
  }

  // Render the floating chat icon
  private _renderChatIcon(): void {

    if (this._bottomPlaceholder) {
      return;
    }

    this._bottomPlaceholder =
      this.context.placeholderProvider.tryCreateContent(
        PlaceholderName.Bottom,
        { onDispose: () => {
          this._chatPanel?.dispose();
          this._chatPanel = undefined;
          this._bottomPlaceholder = undefined;
        } }
      );

    if (!this._bottomPlaceholder) {
      return;
    }

    this._chatPanel = new FloatingChatPanel(
      this._bottomPlaceholder.domElement,
      this.properties,
      this.context.pageContext.web.absoluteUrl,
      this.context.pageContext.user.email || this.context.pageContext.user.loginName.split('|').pop() || ''
    );
  }

  // Clean up
  protected onDispose(): void {
    this.context.placeholderProvider.changedEvent.remove(
      this,
      this._renderChatIcon
    );

    this._chatPanel?.dispose();
    this._chatPanel = undefined;
    if (this._bottomPlaceholder) {
      this._bottomPlaceholder.dispose();
      this._bottomPlaceholder = undefined;
    }
  }
}
