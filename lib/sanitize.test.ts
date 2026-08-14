import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "./sanitize";

describe("sanitizeHtml (CMS rich-text)", () => {
  const rich = `
    <h1>Title</h1>
    <p style="text-align:center"><span style="color:#dc2626"><u>Underline</u></span>
      and <mark data-color="#fef08a" style="background-color:#fef08a">highlight</mark></p>
    <ul data-type="taskList"><li data-checked="true"><label><input type="checkbox" checked="checked"></label><div><p>Done</p></div></li></ul>
    <table><tbody><tr><th>H</th></tr><tr><td colspan="2">cell</td></tr></tbody></table>
    <div data-youtube-video=""><iframe width="640" height="360" allowfullscreen="true" frameborder="0" src="https://www.youtube-nocookie.com/embed/abc" title="v"></iframe></div>
    <img src="https://www.marwattech.com/x.png" alt="x">
  `;

  it("preserves Tiptap formatting (h1, alignment, color, highlight, underline)", () => {
    const out = sanitizeHtml(rich);
    expect(out).toContain("<h1>");
    expect(out).toContain("text-align:center");
    expect(out).toContain("#dc2626");
    expect(out).toContain("<mark");
    expect(out).toContain("<u>");
  });

  it("preserves task lists, tables and checkboxes", () => {
    const out = sanitizeHtml(rich);
    expect(out).toContain('data-type="taskList"');
    expect(out).toContain("checkbox");
    expect(out).toContain("<table");
    expect(out).toContain("colspan");
  });

  it("preserves YouTube embeds but blocks other iframes", () => {
    const out = sanitizeHtml(
      rich +
        '<iframe src="https://evil.example.com"></iframe>' +
        '<iframe src="https://www.youtube.com/embed/xyz"></iframe>'
    );
    expect(out).toContain("youtube-nocookie.com");
    expect(out).toContain("youtube.com/embed/xyz");
    expect(out).not.toContain("evil.example.com");
  });

  it("strips scripts, event handlers and javascript: URLs", () => {
    const out = sanitizeHtml(
      '<script>alert(1)</script><p onclick="alert(1)">hi</p>' +
        '<a href="javascript:alert(1)">bad</a><img src="javascript:alert(1)">'
    );
    expect(out).not.toContain("<script");
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("javascript:");
  });
});
