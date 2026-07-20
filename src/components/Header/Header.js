import React from 'react';
import {
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent,
} from '@carbon/react';
import { UserAvatar } from '@carbon/react/icons';
import './_header.scss';

/**
 * @param {{
 *   activePage: 'browser' | 'formation' | 'compare',
 *   onNavigate: (page: 'browser' | 'formation' | 'compare') => void
 * }} props
 */
const AppHeader = ({ activePage, onNavigate }) => (
  <Header aria-label="Player Dashboard">
    <SkipToContent />
    <HeaderName href="#" prefix="IBM">
      Player Dashboard
    </HeaderName>

    <HeaderNavigation aria-label="Main navigation">
      <HeaderMenuItem
        isCurrentPage={activePage === 'browser'}
        onClick={() => onNavigate('browser')}
      >
        Player Browser
      </HeaderMenuItem>
      <HeaderMenuItem
        isCurrentPage={activePage === 'formation'}
        onClick={() => onNavigate('formation')}
      >
        Team Formation
      </HeaderMenuItem>
      <HeaderMenuItem
        isCurrentPage={activePage === 'compare'}
        onClick={() => onNavigate('compare')}
      >
        Compare Players
      </HeaderMenuItem>
    </HeaderNavigation>

    <HeaderGlobalBar>
      <HeaderGlobalAction aria-label="User Avatar" tooltipAlignment="end">
        <UserAvatar size={20} />
      </HeaderGlobalAction>
    </HeaderGlobalBar>
  </Header>
);

export default AppHeader;
