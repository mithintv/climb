import { useState, useEffect, useReducer } from 'react';

import { Champion } from './match/champion';
import { Items } from './match/items';
import { Runes } from './match/runes';
import { SummonerSpells } from './match/summoner-spells';
import { Teams } from './match/teams';
import { Minions } from './match/minions';
import type { MatchDto, MatchNotes, MatchParticipant, MatchState } from '../types/riot';

// ui
import { Button } from '@/ui/button';
import { Label } from '@/ui/label';
import { Textarea } from '@/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3080';

interface MatchAction {
  puuid: string;
  val: MatchDto;
  notes: MatchNotes | null;
}

const matchReducer = (state: MatchState, action: MatchAction): MatchState => {

  const player = action.val.info.participants.find(participant => participant.puuid === action.puuid)!;
  const team1 = action.val.info.participants.filter(participant => participant.teamId === 100);
  const team2 = action.val.info.participants.filter(participant => participant.teamId === 200);

  const byPosition = (team: MatchParticipant[]) => [
    team.find(player => player.teamPosition === 'TOP')!,
    team.find(player => player.teamPosition === 'JUNGLE')!,
    team.find(player => player.teamPosition === 'MIDDLE')!,
    team.find(player => player.teamPosition === 'BOTTOM')!,
    team.find(player => player.teamPosition === 'UTILITY')!
  ];

  return {
    data: true,
    player: player,
    game: {
      gameCreation: action.val.info.gameCreation,
      gameDuration: action.val.info.gameDuration,
      gameStartTimestamp: action.val.info.gameStartTimestamp,
      gameEndTimestamp: action.val.info.gameEndTimestamp,
      gameId: action.val.info.gameId,
      gameMode: action.val.info.gameMode,
      gameVersion: action.val.info.gameVersion,
      mapId: action.val.info.mapId
    },
    team100: byPosition(team1),
    team200: byPosition(team2),
    notes: action.notes
  };
};

interface MatchProps {
  id: string;
  puuid: string;
  summonerName: string;
}

export const Match = (props: MatchProps) => {

  const [showNotes, setNotes] = useState(false);
  const [matchData, setMatchData] = useReducer(matchReducer, {
    data: false,
    player: null,
    game: null,
    team100: [],
    team200: [],
    notes: null
  });

  useEffect(() => {

    const fetchMatchNotes = async () => {
      try {
        const response = await fetch(`${backendUrl}/${encodeURIComponent(props.summonerName)}/${props.id}`);
        const data: MatchDto = await response.json();

        setMatchData(
          {
            puuid: props.puuid,
            val: data,
            notes: null
          }
        );
      } catch (error) {
        console.log(error);
      }
    };
    fetchMatchNotes();
  }, [props.id, props.puuid, props.summonerName]);

  const clickHandler = () => {
    setNotes(prevState => !prevState);
  };

  return (
    <>
      {matchData.data &&
        <div className='flex flex-col'>
          <div className={`box-content flex flex-row m-auto items-center my-2 ${matchData.player.win ? 'bg-indigo-900' : 'bg-pink-900'}`}>
            <div className='w-12 mx-1'>
              <Champion
                id={matchData.player.championId}
                name={matchData.player.championName}
              />
            </div>
            <SummonerSpells
              spell1={matchData.player.summoner1Id}
              spell2={matchData.player.summoner2Id}
            />
            <div className='mx-1 flex flex-col'>
              <Runes
                runes={matchData.player.perks.styles}
                primaryId={matchData.player.perks.styles[0].style}
                secondaryId={matchData.player.perks.styles[1].style}
              />
            </div>
            <div className='flex flex-col'>
              <div className='flex flex-row'>
                <div className='mx-2'>
                  <div className='text-center'>
                    {`${matchData.player.kills} / ${matchData.player.deaths} / ${matchData.player.assists}`}
                  </div>
                  <div className='text-center w-full'>
                    {`${((matchData.player.kills + matchData.player.assists) / matchData.player.deaths).toFixed(1)} KDA`}
                  </div>
                </div>
                <div className='mx-2'>
                  <div className='flex justify-center'>
                    <div className='px-1'>
                      {`${matchData.player.goldEarned.toLocaleString()}`}
                    </div>
                    <img alt="gold icon" className='self-center w-3 h-3' src='https://static.wikia.nocookie.net/leagueoflegends/images/1/10/Gold.png' />
                  </div>
                  <div className='flex justify-center'>
                    <div className='px-1'>
                      {`${matchData.player.challenges.goldPerMinute.toFixed(0)}`}
                    </div>
                    <img alt="gold icon" className='self-center w-3 h-3' src='https://static.wikia.nocookie.net/leagueoflegends/images/1/10/Gold.png' /> / min
                  </div>
                </div>
                <Minions
                  totalCS={matchData.player.totalMinionsKilled + matchData.player.neutralMinionsKilled}
                  gameDurationMin={matchData.game.gameDuration / 60}
                />
              </div>
              <Items
                items={[matchData.player.item0, matchData.player.item1, matchData.player.item2, matchData.player.item3, matchData.player.item4, matchData.player.item5, matchData.player.item6]}
              />
            </div>
            <Teams match={matchData} />
            <button
              onClick={clickHandler}
              className={`px-px self-stretch ${matchData.player.win ? 'bg-indigo-700' : 'bg-pink-700'}`}>
              {!showNotes && <i className="pb-16 px-1 fa-solid fa-chevron-down"></i>}
              {showNotes && <i className="pt-16 px-1 fa-solid fa-chevron-up"></i>}
            </button>
          </div>
          {showNotes &&
            <div className='flex flex-col'>
              <div className='flex flex-row text-center'>
                <div className='w-1/4'>
                  Champion Knowledge
                  <ul>
                    {matchData.notes ? matchData.notes.champion_knowledge.map((note, index) => <li key={index}>{note}</li>) : "..."}
                  </ul>
                </div>
                <div className='w-1/4'>
                  Laning
                </div>
                <div className='w-1/4'>
                  Teamfighting
                </div>
                <div className='w-1/4'>
                  Macro
                </div>
              </div>
              <form className='flex flex-col m-auto mt-2 items-center'>
                <div className='flex flex-row items-center justify-center py-2'>
                  <Label className='px-2 w-20' htmlFor="tags">Category</Label>
                  <Select name="tags" defaultValue="Champion Knowledge">
                    <SelectTrigger id="tags" className='w-64'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Champion Knowledge">Champion Knowledge</SelectItem>
                      <SelectItem value="Laning">Laning</SelectItem>
                      <SelectItem value="Team Fighting">Team Fighting</SelectItem>
                      <SelectItem value="Macro">Macro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='flex flex-row justify-center py-2'>
                  <Label className='px-2 w-20 pt-2' htmlFor="note">Note</Label>
                  <Textarea className='h-20 w-64' name='note' id='note' />
                </div>
                <Button type='button'>Add Note</Button>
              </form>
            </div>
          }
        </div>}
    </>
  );

};
