import React from "react";

import summonerSpellLibrary from "../../assets/summoner.json";

const SummonerSpells = props => {

  const summonerSpellImage = spell => {
    return `https://ddragon.leagueoflegends.com/cdn/12.13.1/img/spell/${spell.image.full}`;
  };

  // retuns summoner spell object given spell ID
  const fetchSpell = (spellId) => {
    for (const spell in summonerSpellLibrary.data) {
      if (parseInt(summonerSpellLibrary.data[spell].key) === spellId) {
        return summonerSpellLibrary.data[spell];
      };
    }
  };

  const spell1 = fetchSpell(props.spell1);
  const spell2 = fetchSpell(props.spell2);

  return (
    <React.Fragment>
      <div className='my-px space-y-2'>
        <img className='w-5'
          src={summonerSpellImage(spell1)}
        />
        <img className='w-5'
          src={summonerSpellImage(spell2)}
        />
      </div>
    </React.Fragment>
  );
};

export default SummonerSpells;