/**
 * A match's `info` block without its participants — what a card needs to label
 * the game once the two teams have been split out of the payload.
 */
export interface IGameInfo {
	gameCreation: number;
	gameDuration: number;
	gameStartTimestamp: number;
	gameEndTimestamp: number;
	gameId: number;
	gameMode: string;
	gameVersion: string;
	mapId: number;
	queueId: number;
}
