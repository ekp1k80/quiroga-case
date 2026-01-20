// src/lib/levels.ts

export const STORY_FLOW = [
  { name: 'prologue-1', deps: [] }, // default level before watch prologue of the prologue
  { name: 'res-prologue', deps: ['prologue-1'] }, // able to watch restaurant prologue
  { name: 'hospital', deps: ['res-prologue'] }, // able to watch act 1 hospital
  { name: 'hector-house', deps: ['hospital'] }, // able to watch act 2 Hector's house
  { name: 'the-horror', deps: ['hector-house'] }, // able to watch act 2 The horror
  { name: 'act2-sofia', deps: ['the-horror'] },  // able to watch act 2 Sofia
  { name: 'act2-the-camera', deps: ['act2-sofia'] },  // able to watch act 2 The Camera
  { name: 'chat-to-school', deps: ['act2-the-camera'] }, // show the player the first puzzle
  { name: 'the-radio', deps: ['chat-to-school'] }, // able to watch act 3 The radio
  { name: 'chat-qr1', deps: ['the-radio'] }, // the play scan the first QR and after that the are redirected to the chat with the teacher of Santa Veronica
  { name: 'qr2', deps: ['chat-qr1'] }, // all the file of the Sofia case are unlocked
  { name: 'eduardo-house-chat', deps: ['qr2'] }, // story telling of arrive to Eduardo's house
  { name: 'eduardo-house-board', deps: ['eduardo-house-chat'] }, // all the file of the Eduardo's house board are available
  { name: 'eduardo-house-next-chat', deps: ['eduardo-house-chat'] }, // after user see all the board files they are able to continue to Maria Cordoba house
  { name: 'casa-maria-cordoba', deps: ['eduardo-house-chat'] }, // able to watch maria cordoba
  { name: 'casa-maria-cordoba', deps: ['eduardo-house-chat'] }, // able to watch maria cordoba

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
