// @ts-check
// Strips README's leading `# <project name>` H1; TypeDoc already renders project name + version

import * as td from 'typedoc';

/** @param {td.Application} app */
export function load(app) {
  app.converter.on(td.Converter.EVENT_RESOLVE_END, context => {
    const { readme, name } = context.project;
    const first = readme?.[0];
    if (first?.kind !== 'text') return;
    const match = /^#[ \t]+(.+?)[ \t]*(?:\r?\n|$)/.exec(first.text);
    if (match?.[1] !== name) return;
    first.text = first.text.slice(match[0].length).replace(/^\s+/, '');
  });
}
