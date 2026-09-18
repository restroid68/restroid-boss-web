/**
 * Boss AI yanıt metni — TTS * ve # gibi işaretleri okumasın.
 * Markdown başlık/liste/vurgu düz paragrafa çevrilir.
 */
export function stripBossAiMarkup(raw: string): string {
  let t = String(raw ?? "").replace(/\r\n/g, "\n")
  if (!t.trim()) return ""

  t = t.replace(/```[\s\S]*?```/g, (block) =>
    block.replace(/^```[^\n]*\n?/, "").replace(/```$/, "").trim(),
  )

  const lines = t.split("\n")
  const out: string[] = []
  for (const line of lines) {
    let L = line.replace(/[ \t]+$/g, "")
    L = L.replace(/^\s{0,3}#{1,6}\s+/, "")
    L = L.replace(/^\s*([-*•]|\d+[.)])\s+/, "")
    L = L.replace(/\*\*([^*]+)\*\*/g, "$1")
    L = L.replace(/__([^_]+)__/g, "$1")
    L = L.replace(/(^|[^\w*])\*([^*\n]+)\*(?!\*)/g, "$1$2")
    L = L.replace(/(^|[^\w_])_([^_\n]+)_(?!_)/g, "$1$2")
    L = L.replace(/[#*]+/g, " ")
    L = L.replace(/[ \t]{2,}/g, " ").trim()
    out.push(L)
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim()
}
