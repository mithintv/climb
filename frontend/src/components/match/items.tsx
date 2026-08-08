const itemImage = (item: number) => {
  return `https://ddragon.leagueoflegends.com/cdn/16.15.1/img/item/${item}.png`;
};

const fillerImage = () => {
  return `https://ddragon.leagueoflegends.com/cdn/16.15.1/img/item/7050.png`;
};

interface ItemsProps {
  items: number[];
}

export const Items = (props: ItemsProps) => {

  return (
    <div className='flex flex-row m-auto space-x-1 pt-2'>
      {props.items.map((item, index) => {
        if (item === 0) {
          return (
            <img
              key={item + index}
              src={fillerImage()}
              width='30px'
            />
          );
        } else {
          return (
            <div
              key={item + index}
              className='p-0'
            >
              <img
                key={item}
                src={itemImage(item)}
                width='30px'
              />
            </div>
          );
        }
      })}
    </div>
  );

};
