function idle(connected=true,x=0){
  return `<g data-idle="${connected?'silence':'disconnected'}" transform="translate(${x},0)" fill="none" stroke-linecap="round">${connected?'<path d="M26 72H61 M83 72H118" stroke="#292929"/><path d="M72 68L76 72L72 76L68 72Z" stroke="#dedede"/>':'<circle cx="72" cy="72" r="16" stroke="#333333" stroke-width="1.2" stroke-dasharray="78 23" transform="rotate(-35 72 72)"/><circle cx="85" cy="60" r="1.6" fill="#f25623" stroke="none"/>'}</g>`;
}
module.exports={idle};
