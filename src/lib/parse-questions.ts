export type ParsedQuestion = {
  text: string;
  explanation: string;
  multiple: boolean;
  options: { text: string; isCorrect: boolean }[];
  warning?: string;
};

const MARK = "(?:[A-Ha-h]|[কখগঘঙচছজ])";
const OPT_START = new RegExp(`^\\(?(${MARK})[\\).]\\s*(.*)$`);
const OPT_SPLIT = new RegExp(`\\s+(?=\\(?${MARK}\\)\\s*\\S)`);
const Q_NUM = /^\s*(?:Q|প্রশ্ন)?\s*[0-9০-৯]+\s*[.)।:]\s*/i;
const ANS = /^(?:সঠিক\s*উত্তর|উত্তর|ans(?:wer)?|correct)\s*[:：-]\s*(.*)$/i;
const EXP = /^(?:ব্যাখ্যা|explanation|exp)\s*[:：-]\s*(.*)$/i;

const markIndex = (m: string) => {
  const bn = "কখগঘঙচছজ".indexOf(m);
  return bn >= 0 ? bn : "abcdefgh".indexOf(m.toLowerCase());
};

export function parseQuestions(raw: string): ParsedQuestion[] {
  const lines = raw.replace(/\r/g, "").replace(/\*\*|__|`/g, "").split("\n");

  // split into blocks: by numbered lines, else by blank lines
  const blocks: string[][] = [];
  if (lines.some((l) => Q_NUM.test(l))) {
    for (const l of lines) {
      if (Q_NUM.test(l)) blocks.push([l]);
      else if (blocks.length && l.trim()) blocks[blocks.length - 1].push(l);
    }
  } else {
    for (const b of raw.split(/\n\s*\n/)) {
      const bl = b.split("\n").filter((x) => x.trim());
      if (bl.length) blocks.push(bl);
    }
  }

  const result: ParsedQuestion[] = [];

  for (const block of blocks) {
    let text = "";
    let explanation = "";
    const options: string[] = [];
    let correct: number[] = [];
    let mode: "q" | "opt" | "exp" | "ans" = "q";

    block.forEach((rawLine, i) => {
      let line = rawLine.trim();
      if (!line) return;
      if (i === 0) line = line.replace(Q_NUM, "");

      let m = line.match(ANS);
      if (m) {
        correct = [
          ...new Set(
            m[1]
              .split(/[,\s&]+/)
              .map((t) => t.replace(/[().]/g, ""))
              .filter((t) => t.length === 1)
              .map(markIndex)
              .filter((n) => n >= 0)
          ),
        ];
        mode = "ans";
        return;
      }
      m = line.match(EXP);
      if (m) {
        explanation = m[1];
        mode = "exp";
        return;
      }
      if (OPT_START.test(line)) {
        mode = "opt";
        for (const part of line.split(OPT_SPLIT)) {
          const om = part.trim().match(OPT_START);
          if (om) options.push(om[2].trim());
        }
        return;
      }
      if (mode === "exp") explanation += " " + line;
      else if (mode === "opt" && options.length)
        options[options.length - 1] += " " + line;
      else if (mode === "q") text += (text ? "\n" : "") + line;
    });

    if (!text.trim() || options.length < 2) continue;

    const valid = correct.filter((n) => n < options.length);
    result.push({
      text: text.trim(),
      explanation: explanation.trim(),
      multiple: valid.length > 1,
      options: options.map((t, idx) => ({
        text: t,
        isCorrect: valid.includes(idx),
      })),
      warning: valid.length === 0 ? "No correct answer found" : undefined,
    });
  }

  return result;
}