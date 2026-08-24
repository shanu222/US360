import { unzip, strFromU8 } from "fflate";

export interface ExtractedZipChat {
  text: string;
  chatFileName: string;
  entryCount: number;
  mediaFromNames: { photos: number; audio: number; stickers: number; video: number; other: number };
}

function mediaKind(name: string) {
  const n = name.replace(/\\/g, "/").split("/").pop()?.toUpperCase() ?? "";
  if (n.includes("STICKER-")) return "stickers" as const;
  if (n.includes("AUDIO-") || /\.(OPUS|OGG|MP3|M4A|AAC)$/.test(n)) return "audio" as const;
  if (n.includes("VIDEO-") || /\.(MP4|MOV|3GP)$/.test(n)) return "video" as const;
  if (n.includes("PHOTO-") || /\.(JPE?G|PNG|WEBP|HEIC)$/.test(n)) return "photos" as const;
  return "other" as const;
}

export function extractWhatsAppTextFromZip(buffer: ArrayBuffer | Uint8Array): Promise<ExtractedZipChat> {
  return new Promise((resolve, reject) => {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const mediaFromNames = { photos: 0, audio: 0, stickers: 0, video: 0, other: 0 };
    let entryCount = 0;

    unzip(
      bytes,
      {
        filter: (file) => {
          entryCount += 1;
          const base = file.name.replace(/\\/g, "/").split("/").pop() ?? file.name;
          if (!/\.txt$/i.test(base)) {
            mediaFromNames[mediaKind(base)] += 1;
            return false;
          }
          return true;
        },
      },
      (err, files) => {
        if (err) {
          reject(err);
          return;
        }
        const names = Object.keys(files);
        const chatFile =
          names.find((n) => (n.replace(/\\/g, "/").split("/").pop() ?? "").toLowerCase() === "_chat.txt") ||
          names.find((n) => /whatsapp chat/i.test(n) && /\.txt$/i.test(n)) ||
          names.find((n) => /\.txt$/i.test(n));
        if (!chatFile || !files[chatFile]) {
          reject(new Error("NO_CHAT_TXT"));
          return;
        }
        resolve({
          text: strFromU8(files[chatFile]),
          chatFileName: chatFile.replace(/\\/g, "/").split("/").pop() || chatFile,
          entryCount,
          mediaFromNames,
        });
      },
    );
  });
}
