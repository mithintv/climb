import {
	Injectable,
	Logger,
	type OnApplicationShutdown,
	type OnModuleInit,
} from "@nestjs/common";
import { filter, Subject } from "rxjs";

import { ACCOUNT_MATCH_WORKER_TICK_MS } from "./account-match-sync.constant.ts";
import {
	AccountMatchSyncService,
	type IAccountSyncProgress,
} from "./account-match-sync.service.ts";

/** One chunk's progress, tagged with the account it belongs to. */
export interface IAccountProgressEvent extends IAccountSyncProgress {
	puuid: string;
}

/**
 * Finishes what a press of update starts: the deep history and the payloads,
 * a chunk at a time, on a timer.
 *
 * An account's history is hundreds of Riot calls. Doing them inside the request
 * would hold it open for minutes; making the reader press a button per chunk
 * makes them do the scheduling by hand. So the request does the head — their
 * newest games — and this drains the rest behind them.
 *
 * One chunk at a time across every account, deliberately: the pacing is the rate
 * limit, and two accounts filling in at once would double a figure chosen to sit
 * inside it.
 *
 * The queue is in memory and seeded from the database at startup, so a restart
 * resumes rather than waiting to be asked again. Nothing is lost if it does not:
 * what has been fetched is on disk, and what has not is derivable from it.
 */
@Injectable()
export class AccountMatchBackfillWorker
	implements OnModuleInit, OnApplicationShutdown
{
	private readonly logger = new Logger(AccountMatchBackfillWorker.name);
	private readonly sync: AccountMatchSyncService;
	/** Round robin, so a long history cannot starve an account queued behind it. */
	private queue: string[] = [];
	private timer: NodeJS.Timeout | null = null;
	/** A tick is running; the next one is skipped rather than overlapped. */
	private working = false;
	/**
	 * Every chunk's result, for whoever is watching an account fill in.
	 *
	 * A plain subject with no replay: a subscriber gets what happens from the
	 * moment it arrives, and where the account already stood is a database read
	 * the stream does for itself on subscribe.
	 */
	private readonly progress = new Subject<IAccountProgressEvent>();

	constructor(sync: AccountMatchSyncService) {
		this.sync = sync;
	}

	/** The chunks landing for one account, as they land. */
	progressFor(puuid: string) {
		return this.progress.pipe(filter((event) => event.puuid === puuid));
	}

	async onModuleInit() {
		try {
			this.queue = await this.sync.listAccountsNeedingWork();
			this.logger.log(`${this.queue.length} accounts to finish syncing`);
		} catch (error) {
			// A database that is not up yet must not stop the app booting; the queue
			// refills from the next press of update.
			this.logger.warn("Could not read the accounts needing work", error);
		}

		this.timer = setInterval(() => {
			void this.tick();
		}, ACCOUNT_MATCH_WORKER_TICK_MS);
		// Nothing should be held open by a timer that only does background work.
		this.timer.unref();
	}

	onApplicationShutdown() {
		if (this.timer) clearInterval(this.timer);
		this.timer = null;
		// Completing it closes every open stream, rather than leaving readers
		// holding a connection to a worker that has stopped.
		this.progress.complete();
	}

	/** Queues an account, if it is not already waiting. Called on every sync. */
	enqueue(puuid: string) {
		if (this.queue.includes(puuid)) return;
		this.queue.push(puuid);
	}

	/**
	 * One chunk for the account at the front of the queue.
	 *
	 * The account goes to the back when there is more to do and is dropped when
	 * there is not. A chunk that throws drops it too: the work is resumable from
	 * what is on disk, and an account that fails every tick would otherwise hold
	 * the queue against every other one.
	 */
	private async tick() {
		if (this.working) return;
		const puuid = this.queue.shift();
		if (!puuid) return;

		this.working = true;
		try {
			const progress = await this.sync.advance(puuid);
			if (!progress.done) this.queue.push(puuid);
			this.progress.next({ puuid, ...progress });

			this.logger.debug(
				`${puuid}: +${progress.indexed} ids, +${progress.ingested} payloads, ${progress.pending} left`,
			);
		} catch (error) {
			this.logger.warn(`Dropped ${puuid} from the sync queue`, error);
			// Reported as done, because as far as this process is concerned it is:
			// nothing else will move it, so a client waiting on the stream should
			// stop waiting rather than sit on an account that is no longer queued.
			this.progress.next({
				puuid,
				indexed: 0,
				ingested: 0,
				pending: 0,
				backfillComplete: false,
				done: true,
			});
		} finally {
			this.working = false;
		}
	}
}
