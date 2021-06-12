import { h } from 'dom-chef'
export function modal(content: HTMLElement, title: string) {
  const main = <div className="modal">
    <div className="modal-bg" onClick={() => {
      document.body.removeChild(main);
    }}></div>
    <div className="modal-main">
      <div className="modal-top"><div>{title}</div> <div className="modal-close" onClick={() => document.body.removeChild(main)}></div></div>
      <div className="modal-content citizens-wrapper">
        {content}
      </div>
    </div>
  </div>;
  document.body.appendChild(main);
}
