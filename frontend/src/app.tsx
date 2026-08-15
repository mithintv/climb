// components
import { SummonerName } from "./components/summoner-name";

export const App = () => {
	return (
		<>
			<nav className="flex h-14 items-center border-white/10 border-b px-6">
				<span className="bg-linear-to-r from-cyan-400 to-indigo-400 bg-clip-text font-extrabold text-lg text-transparent tracking-[0.3em]">
					Climb
				</span>
			</nav>
			<SummonerName />
		</>
	);
};
