import { describe, expect, it } from "vitest";

import {
	mergeBackfillPage,
	mergeHeadPage,
} from "./account-match-merge.utils.ts";

const PAGE_SIZE = 20;

/** A page of `count` ids, counting down from `from` the way Riot orders them. */
const page = (from: number, count: number) =>
	Array.from({ length: count }, (_, offset) => `NA1_${from - offset}`);

describe("mergeHeadPage", () => {
	it("takes only the ids the index does not hold", () => {
		const merge = mergeHeadPage(new Set(["NA1_3", "NA1_2"]), page(4, 4), {
			pageSize: PAGE_SIZE,
			syncedCount: 2,
		});

		expect(merge.fresh).toEqual(["NA1_4", "NA1_1"]);
	});

	it("stops at the first known id, which is the join with the cached set", () => {
		const fetched = [...page(100, 2), ...page(80, 18)];

		const merge = mergeHeadPage(new Set(["NA1_80"]), fetched, {
			pageSize: PAGE_SIZE,
			syncedCount: 40,
		});

		expect(merge.keepPaging).toBe(false);
	});

	it("keeps paging on a page of nothing but new ids", () => {
		// More games were played than the window covers, so nothing here proves
		// the page joins the cached set — a gap may sit just past it.
		const merge = mergeHeadPage(new Set(), page(100, PAGE_SIZE), {
			pageSize: PAGE_SIZE,
			syncedCount: 40,
		});

		expect(merge.fresh).toHaveLength(PAGE_SIZE);
		expect(merge.keepPaging).toBe(true);
	});

	it("stops on a short page, which is the end of Riot's list", () => {
		const merge = mergeHeadPage(new Set(), page(100, 7), {
			pageSize: PAGE_SIZE,
			syncedCount: 40,
		});

		expect(merge.keepPaging).toBe(false);
	});

	it("takes one page when the index is empty and leaves the rest to backfill", () => {
		// Every page would be all-new, so the rule above would walk the entire
		// history inside a head refresh.
		const merge = mergeHeadPage(new Set(), page(100, PAGE_SIZE), {
			pageSize: PAGE_SIZE,
			syncedCount: 0,
		});

		expect(merge.fresh).toHaveLength(PAGE_SIZE);
		expect(merge.keepPaging).toBe(false);
	});
});

describe("mergeBackfillPage", () => {
	it("accepts a page whose overlap with the index materialised", () => {
		const fetched = page(50, 10);

		const merge = mergeBackfillPage(new Set(fetched.slice(0, 5)), fetched, {
			startOffset: 40,
			requested: 10,
		});

		expect(merge.overlapSeen).toBe(true);
		expect(merge.fresh).toEqual(fetched.slice(5));
	});

	it("refuses a page whose first id is unknown, since a gap would open", () => {
		// Games played since the last sync shifted every offset right by more than
		// the overlap covers, so the ids between this page and the index would
		// never be fetched.
		const merge = mergeBackfillPage(new Set(["NA1_20"]), page(50, 10), {
			startOffset: 40,
			requested: 10,
		});

		expect(merge.overlapSeen).toBe(false);
	});

	it("needs no overlap at offset 0, where nothing precedes the page", () => {
		const merge = mergeBackfillPage(new Set(), page(50, 10), {
			startOffset: 0,
			requested: 10,
		});

		expect(merge.overlapSeen).toBe(true);
	});

	it("reports the tail when Riot returns fewer ids than asked for", () => {
		const fetched = page(50, 3);

		const merge = mergeBackfillPage(new Set([fetched[0]]), fetched, {
			startOffset: 40,
			requested: 10,
		});

		expect(merge.complete).toBe(true);
	});

	it("does not report the tail on a full page", () => {
		const fetched = page(50, 10);

		const merge = mergeBackfillPage(new Set([fetched[0]]), fetched, {
			startOffset: 40,
			requested: 10,
		});

		expect(merge.complete).toBe(false);
	});

	it("treats an empty page as the tail rather than a missing overlap", () => {
		const merge = mergeBackfillPage(new Set(), [], {
			startOffset: 40,
			requested: 10,
		});

		expect(merge.overlapSeen).toBe(true);
		expect(merge.complete).toBe(true);
	});
});
