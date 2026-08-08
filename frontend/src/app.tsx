// components
import { SummonerName } from "./components/summoner-name";

export const App = () => {
	return (
		<>
			<nav className="flex h-14 items-center border-b border-white/10 px-6">
				<span className="bg-linear-to-r from-cyan-400 to-indigo-400 bg-clip-text text-lg font-extrabold tracking-[0.3em] text-transparent">
					Climb
				</span>
			</nav>
			<SummonerName />
		</>
	);
};
