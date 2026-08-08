import runesLibrary from "@assets/runesReforged.json";
import type { PerkStyle } from "../../types/riot";

interface Rune {
  id: number;
  icon: string;
}

const runeImage = (rune: Rune) => {
  return `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`;
};

interface RunesProps {
  runes: PerkStyle[];
  primaryId: number;
  secondaryId: number;
}

export const Runes = (props: RunesProps) => {

  // return rune object from static assets given the ID of a given rune tree
  const fetchRuneObject = (runeTreeId: number) => {
    return runesLibrary.find(runeTree => runeTree.id === runeTreeId);
  };

  // return specific rune slot object from static assets given the string 'primary' or 'secondary' and rune slot number
  const fetchRuneSlot = (tree: 'primary' | 'secondary', runeSlot: number) => {
    const runeTree = fetchRuneObject(tree === 'primary' ? props.primaryId : props.secondaryId);
    const j = tree === 'primary' ? 0 : 1;
    if (!runeTree) return;
    for (let i = 0; i < 4; i++) {
      const rune = runeTree.slots[i].runes.find(slot => slot.id === props.runes[j].selections[runeSlot - 1].perk);
      if (rune) return rune;
    }
  };

  // return array of rune slot objects from static assets given the string 'primary' or 'secondary'
  const createRuneArray = (tree: 'primary' | 'secondary') => {
    const slotNumber = tree === 'primary' ? 4 : 2;
    const array: Rune[] = [];
    for (let i = 1; i < slotNumber + 1; i++) {
      const rune = fetchRuneSlot(tree, i);
      if (rune) array.push(rune);
    }
    return array;
  };

  const primaryRuneArray = createRuneArray('primary');
  const secondaryRuneArray = createRuneArray('secondary');

  return (
    <>
      <div className='flex flex-row'>
        {primaryRuneArray.map(rune => {
          return (
            <img className='w-6'
              key={rune.id}
              src={runeImage(rune)}
            />
          );
        })}
      </div>
      <div className='flex flex-row'>
        {secondaryRuneArray.map(rune => {
          return (
            <img className='w-6'
              key={rune.id}
              src={runeImage(rune)}
            />
          );
        })}
      </div>
    </>
  );
};
