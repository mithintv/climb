/**
 * The region the site serves, shown in the header's status corner and used as
 * the default tag line when a search omits one.
 *
 * A constant rather than a picker because there is genuinely one region: the
 * backend resolves accounts against Riot's americas routing and nothing in the
 * app takes a region parameter. It lives here so the day a second region is
 * served, this is the one place that has to become state.
 */
export const APP_HEADER_REGION = "NA1";
