import { describe, expect, it } from "vitest";
import {
  parseVideoUrl,
  youtubeEmbedUrl,
  driveDirectUrl,
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
});
