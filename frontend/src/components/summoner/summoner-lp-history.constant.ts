/**
 * A stand-in LP series, and the only mock data on the profile.
 *
 * Nothing serves this. Riot has no LP-history endpoint at all — a tracker that
 * charts LP builds the series itself by sampling `league-v4` over time and
 * storing it, which is a backend feature this app does not have yet. The chart
 * is built against `number[]` so the day those samples exist, this constant is
 * swapped for them and nothing else changes.
 *
 * The values are the design prototype's own: 20 games climbing from 1,247 to
 * 1,359, chosen to exercise the chart's shape rather than to describe anyone.
 */
export const SUMMONER_LP_HISTORY_PLACEHOLDER = [
	1247, 1259, 1241, 1261, 1283, 1267, 1291, 1310, 1290, 1316, 1337, 1355, 1341,
	1363, 1388, 1369, 1392, 1330, 1354, 1359,
];
