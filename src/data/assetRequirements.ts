// src\data\assetRequirements.ts
export type AssetReq = {
  public?: string[];        // paths dentro de /public, ej "/ViajeCentragolo.mp3"
  packs?: string[];         // packIds privados, ej "eduardo-house"
};

export const ASSET_REQ_BY_NODE: Record<string, AssetReq> = {
  "prologue-1": {
    public: ["/media/prologue/prologo_del_prologo.mp3"],
  },
  "res-prologue": {
    public: ["/media/prologue/prologo_restaurante.mp3"],
  },
  "hector-mom-call": {
    public: [
			"/media/act1/llamada/after_llamada_mama_hector.mp3",
			"/media/act1/llamada/colgar_llamada.mp3",
			"/media/act1/llamada/incoming_call.mp3",
			"/media/act1/llamada/llamada_mama_hector.mp3",
			"/media/act1/llamada/notification_phone_msg.mp3",
			"/media/act1/llamada/spam_religioso.mp3",
    ],
    packs: [], // si querés calentar evidencia inicial
    // packs: ["intro"], // si querés calentar evidencia inicial
  },
  "viaje-centragolo-hospital": {
    public: ["/media/act1/hospital.mp3", "/media/act1/viaje_centragolo.mp3"],
  },
  "hector-house": {
    public: ["/media/act2/la_casa.mp3"],
  },
  "the-horror": {
    public: ["/media/act2/el_horror.mp3"],
  },
  "act2-sofia": {
    public: ["/media/act2/sofia.mp3"],
  },
  "act2-the-camera-audio": {
    public: ["/media/act2/la_camara.mp3"],
  },
  "the-radio-audio": {
    packs: ["the-radio-audio"],
  },
  "casa-maria-cordoba": {
    packs: ["casa-maria-cordoba"],
  },
  "recapitulacion-maria": {
    packs: ["recapitulacion-maria"],
  },
  "llegada-casa-beatriz": {
    packs: ["llegada-casa-beatriz"],
  },
  "beatriz-abre-puerta": {
    packs: ["beatriz-abre-puerta"],
  },
  "martin-entra-habitacion-eduardo": {
    packs: ["martin-entra-habitacion-eduardo"],
  },
  "hector-mom-final-call": {
    packs: ["hector-mom-final-call"],
    public: [
			"/media/act1/llamada/colgar_llamada.mp3",
			"/media/act1/llamada/incoming_call.mp3",
    ],
  },
  "eduardo-leaked": {
    packs: ["eduardo-leaked"],
  },
};