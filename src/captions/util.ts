export const ensureZero = input => (`${input}`.length === 1 ? '0' : '') + input

/**
 *
 * @param lines should include the timecodespan as the first element
 * @param langs
 */
export const distributeLanguages = (lines: string[], langs: string[]) => {
  const linesCount = (lines.length) / langs.length // number of lines
  if (parseInt(linesCount.toString()) !== linesCount) {
    console.error('incorrect lines count at')
    console.log(lines)
    process.exit(1)
  }

  const text = {}
  let hideCount = 0, lang
  for (let i = 0; i < langs.length; ++i) {
    lang = langs[i]
    if (lang === 'hide') {
      hideCount++
      lang = `hide${hideCount}`
    }
    text[lang] = lines
      .slice(i * linesCount, (i * linesCount) + linesCount)
      .join('\n')
  }
  return text
}