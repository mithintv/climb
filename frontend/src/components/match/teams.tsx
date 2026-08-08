import { Participant } from "./participant";
import type { MatchState } from "../../types/riot";

interface TeamsProps {
  match: MatchState;
}

export const Teams = (props: TeamsProps) => {

  return (
    <>
      <div className="flex flex-row justify-center my-1">
        <div className='flex flex-col'>
          {props.match.data && props.match.team100.map(player => {
            return (
              <Participant
                key={player.summonerId}
                player={player}
              />
            );
          })}
        </div>
        <div className="w-7">
          <img key={0} className='w-4/12 pt-1 m-auto' alt="lane position" src="https://cdn.mobalytics.gg/assets/common/icons/lol-roles/16-top-faded.svg" />
          <img key={1} className='w-5/12 pt-1 m-auto' alt="lane position" src="https://cdn.mobalytics.gg/assets/common/icons/lol-roles/16-jg-faded.svg" />
          <img key={2} className='w-4/12 pt-1.5 m-auto' alt="lane position" src="https://cdn.mobalytics.gg/assets/common/icons/lol-roles/16-mid-faded.svg" />
          <img key={3} className='w-5/12 pt-1.5 m-auto' alt="lane position" src="https://cdn.mobalytics.gg/assets/common/icons/lol-roles/16-bot-faded.svg" />
          <img key={4} className='w-6/12 pt-1.5 m-auto' alt="lane position" src="https://cdn.mobalytics.gg/assets/common/icons/lol-roles/16-sup-faded.svg" />
        </div>
        <div className='flex flex-col'>
          {props.match.data && props.match.team200.map(player => {
            return (
              <Participant
                key={player.summonerId}
                player={player}
              />
            );
          })}
        </div>
      </div>
    </>
  );
};
