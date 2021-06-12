import { h } from 'dom-chef'
import { Props } from './utils';

export function Card(props?: Props) {
  return <div className="card"></div>
}

interface CardColumnProps extends Props {
  style: any
}
export function CardColumn(props: CardColumnProps) {
  return <div className="card-column"></div>
}
