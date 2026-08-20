import { CircleUserIcon } from "lucide-react";

import { APP_HEADER_REGION } from "@/components/app-header/app-header-region.constant";

interface ISummonerIdentityProps {
	gameName: string;
	tagLine: string;
}

/**
 * Who the profile belongs to: the account's icon, its realm, and the riot id.
 *
 * The icon is a hatched placeholder rather than real art. Riot exposes it as
 * `profileIconId` on the summoner endpoint, which the backend does not serve —
 * so the slot is drawn at its final 62px and left visibly empty, which is
 * honest and keeps the row from reflowing when the art does arrive.
 */
export const SummonerIdentity = (props: ISummonerIdentityProps) => (
	<div className="flex items-center gap-4">
		<div className="tile-stripe grid size-[62px] shrink-0 place-items-center border border-control text-center">
			<div>
				<CircleUserIcon
					className="mx-auto size-5 text-[#5b6560]"
					aria-hidden={true}
				/>
				<div className="mt-0.5 font-mono text-[#5b6560] text-[7px] tracking-[.1em]">
					ICON
				</div>
			</div>
		</div>

		<div className="min-w-0">
			<div className="font-mono text-[10px] text-ink-label tracking-[.2em]">
				{APP_HEADER_REGION}
			</div>
			{/* Baseline aligned, not centred: the tag is a suffix to the name, and
			    centring it on a 32px display size floats it above the letters. */}
			<div className="mt-2 flex items-baseline gap-2.5">
				<h1 className="truncate font-semibold text-[32px] text-ink leading-none tracking-[-.03em]">
					{props.gameName}
				</h1>
				<span className="shrink-0 font-mono text-[12px] text-ink-faint">
					#{props.tagLine}
				</span>
			</div>
		</div>
	</div>
);
