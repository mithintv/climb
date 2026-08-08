import { Match } from './match';

interface MatchListProps {
  puuid: string;
  summonerName: string;
  matches: string[];
}

export const MatchList = (props: MatchListProps) => {

  return (
    <div className='my-4'>
      {props.matches.map(match => {
        return (
          <Match
            key={match}
            puuid={props.puuid}
            summonerName={props.summonerName}
            id={match}
          />
        );
      })}
    </div>
  );

};
