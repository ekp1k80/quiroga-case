export type ApiAudioFile = { notShowFileViewer?: boolean, id: string; type: "audio"; title: string; url: string; viz?: any | null };
export type ApiDocFile = { notShowFileViewer?: boolean, id: string; type: "doc"; title: string; url: string };
export type ApiImgFile = { notShowFileViewer?: boolean, id: string; type: "img"; title: string; url: string; alt?: string | null; width?: number | null; height?: number | null };

export type ApiPackFile = ApiAudioFile | ApiDocFile | ApiImgFile;

export type ApiPackRes = {
  ok: boolean;
  packId?: string;
  files?: ApiPackFile[];
  error?: string;
  expiresAt?: number;
};
