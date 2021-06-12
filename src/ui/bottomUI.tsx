import { h } from 'dom-chef'
import { Props } from './utils';

export function BottomUI(props?: Props) {
  const bottom = <div className="ui-bottom" ></div>;

  bottom.addEventListener('wheel', (e) => {
    e.preventDefault();
    bottom.scrollLeft += e.deltaY
  })

  return bottom
}
