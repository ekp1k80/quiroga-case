// src/lib/levels.ts

export const STORY_FLOW = [
  { name: 'prologue-1', deps: [] }, // default level before watch prologue of the prologue
  { name: 'res-prologue', deps: ['prologue-1'] }, // able to watch restaurant prologue
  { name: 'hector-mom-call', deps: ['res-prologue'] }, // able to watch act 1 Hector's mom call
  { name: 'viaje-centragolo-hospital', deps: ['hector-mom-call'] }, // able to watch act 1 viaje Centragolo and Hospital
  { name: 'hector-house', deps: ['viaje-centragolo-hospital'] }, // able to watch act 2 Hector's house
  { name: 'the-horror', deps: ['hector-house'] }, // able to watch act 2 The horror
  { name: 'act2-sofia', deps: ['the-horror'] },  // able to watch act 2 Sofia
  { name: 'act2-the-camera-game', deps: ['act2-sofia'] },  // able to watch act 2 The Camera game
  { name: 'act2-the-camera-audio', deps: ['act2-the-camera-game'] },  // able to watch act 2 The Camera audio
  { name: 'chat-to-school-1', deps: ['act2-the-camera-audio'] }, // show the player the first puzzle
  { name: 'chat-to-school-2', deps: ['chat-to-school-1'] }, // show the player the first puzzle
  { name: 'the-radio-chat', deps: ['chat-to-school-2'] }, // able to watch act 3 The radio chat to reproduce the radio audio
  { name: 'the-radio-audio', deps: ['the-radio-chat'] }, // able to watch act 3 The radio audio
  { name: 'before-scan-qr1-chat', deps: ['the-radio-audio'] }, // the player receive instructios that they need to scan a QR near a real addres to continue
  { name: 'chat-qr1', deps: ['before-scan-qr1-chat'] }, // the player scan the first QR and after that the are redirected to the chat with the teacher of Santa Veronica
  { name: 'before-scan-qr2-chat', deps: ['chat-qr1'] }, // the player receive instructions that they need to scan a QR in the host house
  { name: 'qr2-chat', deps: ['before-scan-qr2-chat'] }, // chat to unlock Sofia files
  { name: 'qr2-puzzle', deps: ['qr2-chat'] }, // all the file of the Sofia case are unlocked
  { name: 'eduardo-house-chat', deps: ['qr2-puzzle'] }, // story telling of arrive to Eduardo's house
  { name: 'eduardo-house-board-chat', deps: ['eduardo-house-chat'] }, // all the file of the Eduardo's house board are available
  { name: 'eduardo-house-next-chat', deps: ['eduardo-house-board-chat'] }, // after user see all the board files they are able to continue to Maria Cordoba house
  { name: 'after-casa-eduardo', deps: ['eduardo-house-next-chat'] }, // able to watch maria cordoba
  { name: 'casa-maria-cordoba', deps: ['after-casa-eduardo'] }, // able to watch maria cordoba
  { name: 'recapitulacion-maria', deps: ['casa-maria-cordoba'] }, // able to watch recapitulacion maria cordoba
  { name: 'llegada-casa-beatriz', deps: ['recapitulacion-maria'] }, // able to watch llegada a la casa de beatriz
  { name: 'beatriz-abre-puerta', deps: ['llegada-casa-beatriz'] }, // able to watch beatriz abre la puerta
  { name: 'martin-entra-habitacion-eduardo', deps: ['beatriz-abre-puerta'] }, // able to watch martin entra habitacion eduardo
  { name: 'before-scan-qr3-chat', deps: ['martin-entra-habitacion-eduardo'] }, // Final puzzle with all the files available
  { name: 'qr3', deps: ['martin-entra-habitacion-eduardo'] }, // Final puzzle with all the files available
  { name: 'hector-mom-final-call', deps: ['martin-entra-habitacion-eduardo'] }, // able to watch hector's mom final call
  { name: 'social-app-noise', deps: ['hector-mom-final-call'] }, // able to watch hector's mom final call
  { name: 'eduardo-leaked-1', deps: ['social-app-noise'] }, // able to watch Eduardo leakead audio 1
  { name: 'eduardo-leaked-2', deps: ['eduardo-leaked-1'] }, // able to watch Eduardo leakead audio 2
  { name: 'eduardo-leaked-3', deps: ['eduardo-leaked-2'] }, // able to watch Eduardo leakead audio 3
  { name: 'sinclair-event', deps: ['eduardo-leaked-3'] }, // able to watch Eduardo leakead audio 3
  { name: 'investigation-open', deps: ['sinclair-event'] }, // able to watch Eduardo leakead audio 3
  { name: 'congressman', deps: ['investigation-open'] }, // able to watch Eduardo leakead audio 3
  { name: 'investigation-close', deps: ['congressman'] }, // able to watch Eduardo leakead audio 3
  { name: 'final-interview', deps: ['investigation-close'] }, // able to watch Eduardo leakead audio 3
]

export type StoryNode = (typeof STORY_FLOW)[number]['name']
type StoryEntry = Readonly<{ name: StoryNode; deps: readonly StoryNode[] }>

export const DEFAULT_STORY_NODE: StoryNode = STORY_FLOW[0].name

const STORY_BY_NAME: Record<StoryNode, StoryEntry> = Object.fromEntries(
  STORY_FLOW.map(e => [e.name, e as unknown as StoryEntry])
) as Record<StoryNode, StoryEntry>

const STORY_ORDER_INDEX: Record<StoryNode, number> = Object.fromEntries(
  STORY_FLOW.map((e, i) => [e.name, i])
) as Record<StoryNode, number>

export function storyReached(current: StoryNode, required: StoryNode): boolean {
  if (current === required) return true
  if (STORY_ORDER_INDEX[current] < STORY_ORDER_INDEX[required]) return false

  const visited = new Set<StoryNode>()
  function dfs(node: StoryNode): boolean {
    if (node === required) return true
    if (visited.has(node)) return false
    visited.add(node)
    for (const dep of STORY_BY_NAME[node].deps) {
      if (dfs(dep)) return true
    }
    return false
  }
  return dfs(current)
}

export type PlayerProgress = {
  storyNode: StoryNode
  flags?: string[] | Set<string>
  tags?: string[] | Set<string>
}

export type Requirement =
  | { type: 'story'; node: StoryNode }
  | { type: 'flag'; flag: string }
  | { type: 'tag'; tag: string }

export type AccessRule =
  | Requirement
  | { all: Requirement[] } // AND
  | { any: Requirement[] } // OR

function asSet(v?: string[] | Set<string>): Set<string> {
  if (!v) return new Set()
  return v instanceof Set ? v : new Set(v)
}

function checkReq(progress: PlayerProgress, req: Requirement): boolean {
  switch (req.type) {
    case 'story':
      return storyReached(progress.storyNode, req.node)
    case 'flag':
      return asSet(progress.flags).has(req.flag)
    case 'tag':
      return asSet(progress.tags).has(req.tag)
  }
}

export function canAccess(progress: PlayerProgress, rule?: AccessRule | null): boolean {
  // No rule => allowed (útil para packs públicos)
  if (!rule) return true

  if ('all' in rule) return rule.all.every(r => checkReq(progress, r))
  if ('any' in rule) return rule.any.some(r => checkReq(progress, r))
  return checkReq(progress, rule)
}
