#!/usr/bin/env python3
"""Build Bakti.pptx from slides/slides.md source."""

import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

SLIDE_W = Inches(13.33)
SLIDE_H = Inches(7.5)

# Brand palette from app/globals.css tokens
BRAND_BLUE = RGBColor(0x02, 0x84, 0xC7)   # --color-brand-700
INK       = RGBColor(0x0B, 0x1B, 0x2B)   # --color-ink
INK_SOFT  = RGBColor(0x51, 0x61, 0x7A)   # --color-ink-soft
ACCENT    = RGBColor(0xFD, 0xF1, 0xE0)   # --color-accent-50 / warm bg
MIST      = RGBColor(0xF8, 0xF5, 0xF0)   # --color-mist
WHITE     = RGBColor(0xFF, 0xFF, 0xFF)

# Fonts (Manrope + Fraunces from next/font/google)
FONT_HEAD = "Fraunces"
FONT_BODY = "Manrope"


def parse_slides(path: str) -> list[dict]:
    slides = []
    current: dict | None = None
    with open(path) as f:
        for raw in f:
            line = raw.rstrip()
            if not line:
                continue
            if line.startswith("# TITLE"):
                if current:
                    slides.append(current)
                current = {"type": "title", "lines": []}
            elif line.startswith("# THE MOMENT"):
                if current:
                    slides.append(current)
                current = {"type": "moment", "lines": []}
            elif line.startswith("# PROBLEM"):
                if current:
                    slides.append(current)
                current = {"type": "section", "title": "Problem", "lines": []}
            elif line.startswith("# MARKET"):
                if current:
                    slides.append(current)
                current = {"type": "section", "title": "Market", "lines": []}
            elif line.startswith("# CUSTOMER"):
                if current:
                    slides.append(current)
                current = {"type": "section", "title": "Customer", "lines": []}
            elif line.startswith("# SOLUTION"):
                if current:
                    slides.append(current)
                current = {"type": "section", "title": "Solution", "lines": []}
            elif line.startswith("# WHY STELLAR"):
                if current:
                    slides.append(current)
                current = {"type": "section", "title": "Why Stellar", "lines": []}
            elif line.startswith("# FLOW"):
                if current:
                    slides.append(current)
                current = {"type": "section", "title": "Flow", "lines": []}
            elif line.startswith("# LIVE PROOF"):
                if current:
                    slides.append(current)
                current = {"type": "section", "title": "Live Proof", "lines": []}
            elif line.startswith("# WHY US"):
                if current:
                    slides.append(current)
                current = {"type": "section", "title": "Why Us / Why Now", "lines": []}
            elif line.startswith("# BUSINESS MODEL"):
                if current:
                    slides.append(current)
                current = {"type": "section", "title": "Business Model", "lines": []}
            elif line.startswith("# GO-TO-MARKET"):
                if current:
                    slides.append(current)
                current = {"type": "section", "title": "Go-to-Market", "lines": []}
            elif line.startswith("# ANCHOR INTEGRATION"):
                if current:
                    slides.append(current)
                current = {"type": "section", "title": "Anchor Integration", "lines": []}
            elif line.startswith("# TRACTION"):
                if current:
                    slides.append(current)
                current = {"type": "section", "title": "Traction", "lines": []}
            elif line.startswith("# ROADMAP"):
                if current:
                    slides.append(current)
                current = {"type": "section", "title": "Roadmap", "lines": []}
            elif line.startswith("# THE ASK"):
                if current:
                    slides.append(current)
                current = {"type": "section", "title": "The Ask", "lines": []}
            elif line.startswith("# "):
                # Section dividers we don't treat as slides
                if current:
                    slides.append(current)
                    current = None
            else:
                if current is not None:
                    current["lines"].append(line)
    if current:
        slides.append(current)
    return slides


def add_slide(prs: Presentation) -> object:
    layout = prs.slide_layouts[6]  # blank
    return prs.slides.add_slide(layout)


def set_bg(slide, color: RGBColor):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_rect(slide, left, top, width, height, fill_color=None, line_color=None):
    shape = slide.shapes.add_shape(1, left, top, width, height)  # MSO_SHAPE_TYPE.RECTANGLE
    if fill_color:
        shape.fill.solid()
        shape.fill.fore_color.rgb = fill_color
    else:
        shape.fill.background()
    if line_color:
        shape.line.color.rgb = line_color
    else:
        shape.line.fill.background()
    return shape


def add_text(slide, text, left, top, width, height,
             font_size=18, bold=False, color=INK, align=PP_ALIGN.LEFT,
             font_name=FONT_BODY, wrap=True):
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = wrap
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = font_name
    return txBox


def build_title_slide(slide, data):
    set_bg(slide, WHITE)
    # Accent band at top
    add_rect(slide, 0, 0, SLIDE_W, Inches(0.15), fill_color=BRAND_BLUE)
    # Bottom band
    add_rect(slide, 0, Inches(6.5), SLIDE_W, Inches(1.0), fill_color=BRAND_BLUE)

    lines = data["lines"]
    # Line 0 = title, line 1 = subtitle
    title = lines[0] if len(lines) > 0 else "Bakti"
    subtitle = lines[1] if len(lines) > 1 else ""

    add_text(slide, title,
             Inches(0.8), Inches(1.8), Inches(11.5), Inches(2.0),
             font_size=52, bold=True, color=BRAND_BLUE, align=PP_ALIGN.LEFT,
             font_name=FONT_HEAD)

    add_text(slide, subtitle,
             Inches(0.8), Inches(3.8), Inches(11.5), Inches(1.0),
             font_size=22, bold=False, color=INK_SOFT, align=PP_ALIGN.LEFT,
             font_name=FONT_BODY)


def build_moment_slide(slide, data):
    set_bg(slide, ACCENT)
    add_rect(slide, 0, 0, SLIDE_W, Inches(0.12), fill_color=BRAND_BLUE)
    add_rect(slide, 0, Inches(6.5), SLIDE_W, Inches(1.0), fill_color=BRAND_BLUE)

    add_text(slide, "THE MOMENT",
             Inches(0.8), Inches(0.5), Inches(11.5), Inches(0.6),
             font_size=14, bold=True, color=BRAND_BLUE, font_name=FONT_BODY)

    body = "\n\n".join(data["lines"])
    add_text(slide, body,
             Inches(0.8), Inches(1.2), Inches(11.5), Inches(5.0),
             font_size=24, bold=False, color=INK, font_name=FONT_BODY)


def build_section_slide(slide, data):
    set_bg(slide, WHITE)
    add_rect(slide, 0, 0, Inches(0.2), SLIDE_H, fill_color=BRAND_BLUE)
    add_rect(slide, 0, Inches(6.8), SLIDE_W, Inches(0.7), fill_color=BRAND_BLUE)

    title = data.get("title", "")
    add_text(slide, title.upper(),
             Inches(0.7), Inches(0.35), Inches(12.0), Inches(0.7),
             font_size=18, bold=True, color=BRAND_BLUE, font_name=FONT_BODY)

    lines = data["lines"]
    # Split into two columns if many lines
    if len(lines) <= 6:
        body = "\n".join(f"• {l}" for l in lines)
        add_text(slide, body,
                 Inches(0.7), Inches(1.1), Inches(12.0), Inches(5.4),
                 font_size=18, bold=False, color=INK, font_name=FONT_BODY)
    else:
        half = (len(lines) + 1) // 2
        col1 = "\n".join(f"• {l}" for l in lines[:half])
        col2 = "\n".join(f"• {l}" for l in lines[half:])
        add_text(slide, col1,
                 Inches(0.7), Inches(1.1), Inches(5.9), Inches(5.4),
                 font_size=17, bold=False, color=INK, font_name=FONT_BODY)
        add_text(slide, col2,
                 Inches(6.8), Inches(1.1), Inches(5.9), Inches(5.4),
                 font_size=17, bold=False, color=INK, font_name=FONT_BODY)


def build_deck(slides_md: str, output_path: str):
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    slides = parse_slides(slides_md)
    for data in slides:
        slide = add_slide(prs)
        kind = data["type"]
        if kind == "title":
            build_title_slide(slide, data)
        elif kind == "moment":
            build_moment_slide(slide, data)
        else:
            build_section_slide(slide, data)

    prs.save(output_path)
    size = os.path.getsize(output_path)
    print(f"Built {output_path} — {len(slides)} slides, {size // 1024} KB")


if __name__ == "__main__":
    src = os.path.join(os.path.dirname(__file__), "slides.md")
    out = os.path.join(os.path.dirname(__file__), "Bakti.pptx")
    build_deck(src, out)
