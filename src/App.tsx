/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SettingsProvider } from './contexts/SettingsContext';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <SettingsProvider>
      <AppRoutes />
    </SettingsProvider>
  );
}
