/**
 * Facade service layer where all UI requests are routed. The UI never calls Claude directly.
 * Owner: Developer 1 (Frontend UI) & Developer 2 (Claude API) Collaboration
 */
import * as claudeService from './claudeService';
import * as sessionService from './sessionService';

export const api = {
  claude: claudeService,
  session: sessionService
};
