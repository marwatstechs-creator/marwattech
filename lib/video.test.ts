import { describe, expect, it } from "vitest";
import {
  parseVideoUrl,
  youtubeEmbedUrl,
  driveDirectUrl,
  driveFallbackUrl,
  extractDriveConfirmToken,
  inferVideoContentType,
  formatContentRange,
} from "./video";

describe("parseVideoUrl — YouTube", () => {
  it("parses watch?v= links", () => {
    expect(parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      kind: "youtube",
      id: "dQw4w9WgXcQ",
    });
  });

  it("parses watch?v= with extra params", () => {
    expect(
      parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42&feature=share")
    ).toEqual({ kind: "youtube", id: "dQw4w9WgXcQ" });
  });

  it("parses youtu.be short links", () => {
    expect(parseVideoUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      kind: "youtube",
      id: "dQw4w9WgXcQ",
    });
  });

  it("parses /embed/ links", () => {
    expect(parseVideoUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toEqual({
      kind: "youtube",
      id: "dQw4w9WgXcQ",
    });
  });

  it("parses /shorts/ links", () => {
    expect(parseVideoUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toEqual({
      kind: "youtube",
      id: "dQw4w9WgXcQ",
    });
  });
});

describe("parseVideoUrl — Google Drive", () => {
  it("parses file/d/<id>/view links", () => {
    const id = "1AbCdEfGhIjKlMnOpQrStUvWxYz";
    expect(parseVideoUrl(`https://drive.google.com/file/d/${id}/view`)).toEqual({
      kind: "drive",
      id,
    });
  });

  it("parses file/d/<id>/preview links", () => {
    const id = "1AbCdEfGhIjKlMnOpQrStUvWxYz";
    expect(parseVideoUrl(`https://drive.google.com/file/d/${id}/preview`)).toEqual({
      kind: "drive",
      id,
    });
  });

  it("parses open?id= links", () => {
    const id = "1AbCdEfGhIjKlMnOpQrStUvWxYz";
    expect(parseVideoUrl(`https://drive.google.com/open?id=${id}`)).toEqual({
      kind: "drive",
      id,
    });
  });

  it("parses uc?export=download&id= links", () => {
    const id = "1AbCdEfGhIjKlMnOpQrStUvWxYz";
    expect(parseVideoUrl(`https://drive.google.com/uc?export=download&id=${id}`)).toEqual({
      kind: "drive",
      id,
    });
  });
});

describe("parseVideoUrl — invalid", () => {
  it("returns null for garbage", () => {
    expect(parseVideoUrl("not a url")).toBeNull();
    expect(parseVideoUrl("https://example.com/video.mp4")).toBeNull();
    expect(parseVideoUrl("")).toBeNull();
    expect(parseVideoUrl(null)).toBeNull();
    expect(parseVideoUrl(undefined)).toBeNull();
  });

  it("returns null for empty ids", () => {
    expect(parseVideoUrl("https://www.youtube.com/watch?v=")).toBeNull();
  });
});

describe("URL builders", () => {
  it("builds a minimal nocookie YouTube embed", () => {
    const url = youtubeEmbedUrl("dQw4w9WgXcQ");
    expect(url).toContain("www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(url).toContain("rel=0");
    expect(url).toContain("modestbranding=1");
    expect(url).toContain("playsinline=1");
  });

  it("builds a direct Drive download URL with confirm token", () => {
    const url = driveDirectUrl("1AbCdEfGhIjKlMnOpQrStUvWxYz");
    expect(url).toContain("drive.usercontent.google.com/download");
    expect(url).toContain("id=1AbCdEfGhIjKlMnOpQrStUvWxYz");
    expect(url).toContain("confirm=t");
  });

  it("builds a classic fallback Drive URL", () => {
    expect(driveFallbackUrl("1AbCdEfGhIjKlMnOpQrStUvWxYz")).toContain(
      "drive.google.com/uc?export=download&id=1AbCdEfGhIjKlMnOpQrStUvWxYz"
    );
  });
});

describe("extractDriveConfirmToken", () => {
  it("extracts the uuid token from a Google virus-scan interstitial", () => {
    const html = `<html><body><form id="download-form" action="https://drive.usercontent.google.com/download">
      <input type="hidden" name="uuid" value="AbC123XyZ-_456">
      <button type="submit">Download anyway</button></form></body></html>`;
    expect(extractDriveConfirmToken(html)).toBe("AbC123XyZ-_456");
  });

  it("handles value-before-name markup", () => {
    const html = `<input value="QrSt987UvWx" name="uuid" type="hidden">`;
    expect(extractDriveConfirmToken(html)).toBe("QrSt987UvWx");
  });

  it("returns null when no token is present", () => {
    expect(extractDriveConfirmToken("<html><body>file unavailable</body></html>")).toBeNull();
    expect(extractDriveConfirmToken("")).toBeNull();
    expect(extractDriveConfirmToken(null as unknown as string)).toBeNull();
  });
});

describe("inferVideoContentType", () => {
  it("prefers an upstream video/* content type", () => {
    expect(inferVideoContentType("video/webm")).toBe("video/webm");
    expect(inferVideoContentType("Video/MP4")).toBe("video/mp4");
  });

  it("sniffs the filename extension when content type is not a video", () => {
    expect(inferVideoContentType("application/octet-stream", 'attachment; filename="lesson.webm"')).toBe("video/webm");
    expect(inferVideoContentType("application/octet-stream", 'attachment; filename="clip.mov"')).toBe("video/quicktime");
    expect(inferVideoContentType("application/octet-stream", 'attachment; filename="vid.ogg"')).toBe("video/ogg");
    expect(inferVideoContentType("application/octet-stream", "video.mp4")).toBe("video/mp4");
  });

  it("defaults to video/mp4 for unknown inputs", () => {
    expect(inferVideoContentType(null)).toBe("video/mp4");
    expect(inferVideoContentType(undefined)).toBe("video/mp4");
    expect(inferVideoContentType("application/octet-stream", null)).toBe("video/mp4");
  });
});

describe("formatContentRange", () => {
  it("formats a byte range header", () => {
    expect(formatContentRange(0, 1023, 4096)).toBe("bytes 0-1023/4096");
    expect(formatContentRange(1048576, 2097151, 5242880)).toBe("bytes 1048576-2097151/5242880");
  });
});
