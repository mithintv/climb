import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * A match payload as Riot sent it, read as text rather than imported.
 *
 * Both fixtures are real Match-V5 responses, captured from the live API with
 * only the identifiers of real people replaced: puuids and summoner ids by
 * same-length stand-ins, riot ids by `PlayerN#NA1`. Nothing else is touched, so
 * the field sets, the value ranges and the quirks are Riot's own rather than
 * something an author thought to model — which is the point of capturing them.
 * The hand-built set these replaced quietly disagreed with the real thing about
 * `placement`, and the test built on it passed.
 *
 * The stamp in each name is the date the game was played, not the date it was
 * captured — a payload's shape is fixed by the patch it was played on, so that
 * is what dates the evidence. It is also what makes the pairing legible:
 *
 * - `queue-420-ranked-20260724` — patch 16.14, the current field set. 155
 *   participant keys, `roleBoundItem` present, `bountyLevel` gone.
 * - `queue-1700-arena-20250414` — patch 15.7, fifteen months earlier and the
 *   reverse: 145 keys, `bountyLevel` present, no `roleBoundItem`. Also the
 *   Arena shape — 16 participants, no lanes, a placement each.
 *
 * Between them they cover both participant field sets Riot has served. Add a
 * new capture rather than replacing one when the shape changes again; the old
 * file is the only record of what the old shape was.
 *
 * The text is the point: the response body is saved byte-exact, so a test that
 * started from a parsed object could not tell a codec that round-trips from one
 * that quietly reformats. Resolved from this module because the working
 * directory differs between `pnpm test` and `pnpm --filter backend test`.
 */
export const readMatchFixture = (name: string) =>
	readFileSync(
		fileURLToPath(new URL(`./${name}.json`, import.meta.url)),
		"utf8",
	);
