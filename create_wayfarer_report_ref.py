import os
import re
import html
import math
from collections import Counter

import pymupdf
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
    Flowable, LongTable, TableStyle, Preformatted, KeepTogether,
)
from reportlab.lib.utils import ImageReader

SRC = "/home/user/uploads/WAYFARER_PROJECT_REPORT_REVISED (1).pdf"
SAMPLE = "/home/user/uploads/Store_Management_System_Report_Revised.pdf"
OUT = "/home/user/WAYFARER_Report_Formatted.pdf"
TMP = "/home/user/work"
os.makedirs(TMP, exist_ok=True)

# Extract the exact embedded Times New Roman family used by the supplied sample.
sample_doc = pymupdf.open(SAMPLE)
for xref, name in [(84, "TimesNewRoman.ttf"), (123, "TimesNewRoman-Bold.ttf")]:
    font_name, ext, kind, data = sample_doc.extract_font(xref)
    if not data:
        raise RuntimeError(f"Could not extract sample font xref {xref}")
    with open(os.path.join(TMP, name), "wb") as f:
        f.write(data)

pdfmetrics.registerFont(TTFont("TNR", os.path.join(TMP, "TimesNewRoman.ttf")))
pdfmetrics.registerFont(TTFont("TNR-Bold", os.path.join(TMP, "TimesNewRoman-Bold.ttf")))
pdfmetrics.registerFontFamily(
    "TNR", normal="TNR", bold="TNR-Bold", italic="Times-Italic", boldItalic="Times-BoldItalic"
)
# A small code-style fallback for directory trees containing box-drawing glyphs.
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
if os.path.exists(MONO):
    pdfmetrics.registerFont(TTFont("WayfarerMono", MONO))
else:
    pdfmetrics.registerFont(TTFont("WayfarerMono", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))

# Extract the college logo used on the sample's cover and certificate.
logo_path = os.path.join(TMP, "college_logo.png")
for im in sample_doc[0].get_images(full=True):
    img = sample_doc.extract_image(im[0])
    with open(logo_path, "wb") as f:
        f.write(img["image"])
    break

# Extract the two diagrams already embedded in the Wayfarer PDF.
wayfarer_doc = pymupdf.open(SRC)
image_paths = {}
for page_index, key in [(8, "class"), (11, "er")]:
    page = wayfarer_doc[page_index]
    imgs = page.get_images(full=True)
    if imgs:
        img = wayfarer_doc.extract_image(imgs[0][0])
        path = os.path.join(TMP, f"wayfarer_{key}.{img['ext']}")
        with open(path, "wb") as f:
            f.write(img["image"])
        image_paths[key] = path

PAGE_W, PAGE_H = A4
BORDER = colors.HexColor("#777777")
TABLE_HEADER = colors.HexColor("#D9E2F3")
TABLE_GRID = colors.HexColor("#999999")

styles = {}
styles["body"] = ParagraphStyle(
    "BodyTNR", fontName="TNR", fontSize=12, leading=17.28,
    alignment=TA_JUSTIFY, spaceAfter=4.2, allowWidows=0, allowOrphans=0,
)
styles["chapter"] = ParagraphStyle(
    "ChapterTitle", fontName="TNR-Bold", fontSize=16.08, leading=24.8,
    alignment=TA_CENTER, spaceBefore=0, spaceAfter=12.0, keepWithNext=True,
)
styles["section"] = ParagraphStyle(
    "SectionHeading", fontName="TNR-Bold", fontSize=12.96, leading=15.4,
    alignment=TA_LEFT, spaceBefore=7.0, spaceAfter=5.0, keepWithNext=True,
)
styles["minor"] = ParagraphStyle(
    "MinorHeading", fontName="TNR-Bold", fontSize=11.5, leading=14.0,
    alignment=TA_LEFT, spaceBefore=5.5, spaceAfter=3.5, keepWithNext=True,
)
styles["body_bullet"] = ParagraphStyle(
    "BulletBody", parent=styles["body"], leftIndent=36, firstLineIndent=0,
    bulletIndent=18, bulletFontName="TNR", bulletFontSize=12,
    spaceAfter=2.4,
)
styles["body_number"] = ParagraphStyle(
    "NumberedBody", parent=styles["body"], leftIndent=27, firstLineIndent=0,
    bulletIndent=0, spaceAfter=2.2,
)
styles["caption"] = ParagraphStyle(
    "Caption", fontName="TNR-Bold", fontSize=11.2, leading=14.0,
    alignment=TA_CENTER, spaceBefore=4.0, spaceAfter=5.0,
)
styles["instruction"] = ParagraphStyle(
    "Instruction", fontName="Times-Italic", fontSize=11.2, leading=14.0,
    alignment=TA_CENTER, spaceBefore=3.0, spaceAfter=6.0,
)
styles["placeholder"] = ParagraphStyle(
    "ScreenshotPlaceholder", fontName="Times-Italic", fontSize=10.6, leading=13.0,
    alignment=TA_CENTER, spaceBefore=2.0, spaceAfter=2.0,
)
styles["table_cell"] = ParagraphStyle(
    "TableCell", fontName="TNR", fontSize=10.4, leading=12.4,
    alignment=TA_LEFT, spaceAfter=0,
)
styles["table_header"] = ParagraphStyle(
    "TableHeader", fontName="TNR-Bold", fontSize=11.0, leading=12.8,
    alignment=TA_LEFT, spaceAfter=0,
)
styles["toc_title"] = ParagraphStyle(
    "TOCTitle", fontName="TNR-Bold", fontSize=13.92, leading=17.0,
    alignment=TA_CENTER, spaceAfter=0,
)

CHAPTERS = [
    (1, "INTRODUCTION"),
    (2, "OBJECTIVES"),
    (3, "DESCRIPTION"),
    (4, "CLASS DIAGRAM"),
    (5, "TABLE STRUCTURES"),
    (6, "ER DIAGRAM"),
    (7, "TECH STACK"),
    (8, "MODULES"),
    (9, "CONCLUSION"),
]
CHAPTER_PAGE_INDEX = {
    3: (1, "INTRODUCTION"),
    4: (2, "OBJECTIVES"),
    5: (3, "DESCRIPTION"),
    7: (4, "CLASS DIAGRAM"),
    9: (5, "TABLE STRUCTURES"),
    11: (6, "ER DIAGRAM"),
    12: (7, "TECH STACK"),
    13: (8, "MODULES"),
    28: (9, "CONCLUSION"),
}


def top_y(top):
    return PAGE_H - top


def draw_centered(c, text, top_baseline, font, size):
    c.setFont(font, size)
    c.drawCentredString(PAGE_W / 2, top_y(top_baseline), text)


def draw_cover(c):
    """Cover page laid out to match the sample's centered title-page hierarchy."""
    c.saveState()
    c.setFillColor(colors.black)
    # Title uses the same two-line wrap as the Wayfarer source document.
    draw_centered(c, "WAYFARER – TOUR AND TRAVEL BOOKING MANAGEMENT", 117.5, "TNR-Bold", 13.92)
    draw_centered(c, "SYSTEM", 135.0, "TNR-Bold", 13.92)
    draw_centered(c, "23CS54C – MODERN WEB TECHNOLOGIES", 157.0, "TNR", 12.0)
    draw_centered(c, "Submitted by", 190.5, "Times-BoldItalic", 12.0)
    draw_centered(c, "[STUDENT NAME] – [REGISTER NUMBER]", 219.5, "TNR-Bold", 12.0)
    draw_centered(c, "In partial fulfillment for the award of the degree", 252.5, "Times-Italic", 12.0)
    draw_centered(c, "of", 276.2, "Times-Italic", 12.0)
    draw_centered(c, "BACHELOR OF ENGINEERING / TECHNOLOGY", 300.0, "Times-BoldItalic", 12.0)
    draw_centered(c, "in", 323.8, "Times-BoldItalic", 12.0)
    draw_centered(c, "COMPUTER SCIENCE AND ENGINEERING / INFORMATION TECHNOLOGY", 347.6, "Times-BoldItalic", 12.0)
    # Same 96 x 122 pt college emblem as the sample.
    if os.path.exists(logo_path):
        c.drawImage(logo_path, 249.65, PAGE_H - 360.0 - 122.25,
                    width=96.0, height=122.25, preserveAspectRatio=True, mask="auto")
    draw_centered(c, "NATIONAL ENGINEERING COLLEGE", 500.0, "TNR-Bold", 12.0)
    draw_centered(c, "(An Autonomous Institution affiliated to Anna University, Chennai)", 513.6, "TNR-Bold", 12.0)
    draw_centered(c, "K.R. NAGAR, KOVILPATTI – 628503", 537.4, "TNR-Bold", 12.0)
    draw_centered(c, "OCTOBER – 2026", 561.2, "TNR-Bold", 12.0)
    c.restoreState()


def draw_border_and_footer(c, page_num):
    c.saveState()
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.55)
    c.rect(24, 24, PAGE_W - 48, PAGE_H - 48, stroke=1, fill=0)
    if page_num >= 2:
        c.setFillColor(colors.black)
        c.setFont("TNR", 10.08)
        # The cover is unnumbered, so page 2 is numbered 1.
        c.drawRightString(524, PAGE_H - 806.5, str(page_num - 1))
    c.restoreState()


def draw_certificate(c):
    c.saveState()
    c.setFillColor(colors.black)
    draw_centered(c, "NATIONAL ENGINEERING COLLEGE", 91.7, "TNR-Bold", 12.0)
    draw_centered(c, "(An Autonomous Institution affiliated to Anna University, Chennai)", 105.3, "TNR-Bold", 12.0)
    draw_centered(c, "K.R. NAGAR, KOVILPATTI – 628503", 119.3, "TNR-Bold", 12.0)
    if os.path.exists(logo_path):
        c.drawImage(logo_path, 249.65, PAGE_H - 129.4 - 122.25,
                    width=96.0, height=122.25, preserveAspectRatio=True, mask="auto")
    draw_centered(c, "BONAFIDE CERTIFICATE", 283.5, "TNR-Bold", 12.0)

    cert_text = (
        "This is to certify that this project report, “Wayfarer – Tour and Travel Booking "
        "Management System”, is the bonafide work of [STUDENT NAME] ([REGISTER NUMBER]), "
        "who carried out the project work under my supervision."
    )
    cert_style = ParagraphStyle("CertText", fontName="TNR", fontSize=12, leading=20.6,
                                alignment=TA_JUSTIFY, spaceAfter=0)
    cert_p = Paragraph(html.escape(cert_text), cert_style)
    w, h = cert_p.wrap(451, 150)
    cert_p.drawOn(c, 72, PAGE_H - 300 - h)
    # Keep the instructor/signature area visually open, as in the sample.
    c.setFont("TNR-Bold", 12)
    c.drawRightString(503.5, PAGE_H - 390, "Course Instructor / Guide")

    viva_text = (
        "Submitted to the 23CS54C – MODERN WEB TECHNOLOGIES Viva-Voce examination held at "
        "National Engineering College, K.R. Nagar, Kovilpatti on ____________."
    )
    viva = Paragraph(html.escape(viva_text), cert_style)
    vw, vh = viva.wrap(451, 90)
    viva.drawOn(c, 72, PAGE_H - 435 - vh)
    c.setFont("TNR-Bold", 12)
    c.drawString(72, PAGE_H - 500, "Internal Examiner")
    c.drawRightString(523.5, PAGE_H - 500, "Co Examiner")
    c.restoreState()


class ChapterTitle(Paragraph):
    def __init__(self, number, title):
        self.chapter_number = number
        self.chapter_title = title
        text = f"CHAPTER {number}<br/>{html.escape(title.upper())}"
        super().__init__(text, styles["chapter"])


class ContentsRows(Flowable):
    def __init__(self, entries, width=451.2):
        super().__init__()
        self.entries = entries
        self.width = width
        self.height = 250

    def wrap(self, availWidth, availHeight):
        self.width = availWidth
        return self.width, self.height

    def draw(self):
        c = self.canv
        c.saveState()
        x_no, x_title = 0, 55
        page_right = self.width
        header_y = self.height - 12
        c.setFillColor(colors.black)
        c.setFont("TNR-Bold", 12)
        c.drawString(x_no, header_y, "CH NO")
        c.drawString(x_title, header_y, "TITLE")
        c.drawRightString(page_right, header_y, "PAGE NO")
        # Dotted leader in the TOC header, matching the sample's leader treatment.
        page_label_w = pdfmetrics.stringWidth("PAGE NO", "TNR-Bold", 12)
        dot_start = x_title + pdfmetrics.stringWidth("TITLE", "TNR-Bold", 12) + 8
        dot_end = page_right - page_label_w - 10
        self._dots(c, dot_start, dot_end, header_y, "TNR-Bold", 12)
        y = header_y - 25
        for chapter_num, title, page in self.entries:
            c.setFont("TNR", 12)
            c.drawString(x_no, y, str(chapter_num))
            c.drawString(x_title, y, title.upper())
            page_text = str(page)
            page_w = pdfmetrics.stringWidth(page_text, "TNR", 12)
            title_w = pdfmetrics.stringWidth(title.upper(), "TNR", 12)
            self._dots(c, x_title + title_w + 7, page_right - page_w - 8, y, "TNR", 12)
            c.drawRightString(page_right, y, page_text)
            y -= 22
        c.restoreState()

    @staticmethod
    def _dots(c, x0, x1, y, font, size):
        if x1 <= x0:
            return
        dot_w = pdfmetrics.stringWidth(".", font, size)
        count = max(0, int((x1 - x0) / max(2.4, dot_w * 1.9)))
        if count:
            c.setFont(font, size)
            c.drawString(x0, y, "." * count)


class ReportDoc(BaseDocTemplate):
    def __init__(self, filename, **kwargs):
        self.chapter_pages = {}
        super().__init__(filename, pagesize=A4, **kwargs)
        cover_frame = Frame(0, 0, PAGE_W, PAGE_H, id="cover_frame",
                            leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        body_frame = Frame(72, 50, PAGE_W - 144, PAGE_H - 120, id="body_frame",
                           leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates([
            PageTemplate(id="cover", frames=[cover_frame], onPage=self._on_cover),
            PageTemplate(id="standard", frames=[body_frame], onPage=self._on_standard),
        ])

    def _on_cover(self, canvas, doc):
        canvas.setTitle("Wayfarer – Tour and Travel Booking Management System")
        canvas.setAuthor("National Engineering College")
        draw_cover(canvas)

    def _on_standard(self, canvas, doc):
        draw_border_and_footer(canvas, doc.page)
        if doc.page == 2:
            draw_certificate(canvas)
        canvas.setTitle("Wayfarer – Tour and Travel Booking Management System")
        canvas.setAuthor("National Engineering College")

    def afterFlowable(self, flowable):
        if isinstance(flowable, ChapterTitle):
            # Printed numbering omits the cover page.
            self.chapter_pages[flowable.chapter_number] = self.page - 1


class RawTable(Flowable):
    def __init__(self, rows, ncols, context=""):
        super().__init__()
        self.rows = rows
        self.ncols = ncols
        self.context = context


def table_is_header(row):
    if not row:
        return False
    first = [re.sub(r"\s+", " ", x or "").strip().lower() for x in row]
    headers = {"field", "method", "layer", "component", "relationship", "figure"}
    return first[0] in headers


def infer_headers(rows, ncols, context):
    if not rows:
        return rows
    first = [re.sub(r"\s+", " ", x or "").strip() for x in rows[0]]
    if table_is_header(first):
        return rows
    ctx = (context or "").upper()
    if ncols == 3:
        if "API DESIGN" in ctx:
            header = ["Method", "Endpoint", "Purpose"]
        elif "ENTITY RELATIONSHIP" in ctx:
            header = ["Relationship", "Cardinality"]
        elif "TABLE STRUCTURES" in ctx or "USERS" in ctx or "PACKAGES" in ctx or "DESTINATIONS" in ctx or "BOOKINGS" in ctx or "ADMINISTRATORS" in ctx:
            header = ["Field", "Data Type", "Description"]
        elif "TECH STACK" in ctx or "TECHNOLOGY STACK" in ctx:
            header = ["Layer", "Technology", "Purpose"]
        else:
            values = " ".join(first).lower()
            if any(m in values for m in ["string", "number", "array", "date"]):
                header = ["Field", "Data Type", "Description"]
            else:
                header = ["Layer", "Technology", "Purpose"]
    elif ncols == 2:
        if "ENTITY RELATIONSHIP" in ctx:
            header = ["Relationship", "Cardinality"]
        elif "IMPLEMENTATION RESULTS" in ctx:
            header = ["Figure", "Screenshot"]
        elif "TECH" in ctx:
            header = ["Component", "Technology"]
        else:
            header = ["Item", "Details"]
    else:
        header = ["Field"] + [f"Column {i}" for i in range(2, ncols + 1)]
    header = (header + [""] * ncols)[:ncols]
    return [header] + rows


def prepare_table(raw):
    rows = [list(r) for r in raw.rows if any((x or "").strip() for x in r)]
    # Remove duplicate headers when source table fragments continue across pages.
    compact = []
    for row in rows:
        if compact and table_is_header(row) and table_is_header(compact[-1]):
            continue
        compact.append(row)
    rows = infer_headers(compact, raw.ncols, raw.context)
    if raw.ncols == 2:
        ctx = (raw.context or "").upper()
        if "IMPLEMENTATION RESULTS" in ctx:
            widths = [125, PAGE_W - 144 - 125]
        elif "ENTITY RELATIONSHIP" in ctx:
            widths = [185, PAGE_W - 144 - 185]
        else:
            widths = [175, PAGE_W - 144 - 175]
    elif raw.ncols == 3:
        ctx = (raw.context or "").upper()
        if "API DESIGN" in ctx:
            widths = [52, 177, PAGE_W - 144 - 52 - 177]
        elif "TECH STACK" in ctx or "TECHNOLOGY STACK" in ctx:
            widths = [112, 142, PAGE_W - 144 - 112 - 142]
        elif "TABLE STRUCTURES" in ctx or any(x in ctx for x in ["USERS", "PACKAGES", "DESTINATIONS", "BOOKINGS", "ADMINISTRATORS"]):
            widths = [119, 95, PAGE_W - 144 - 119 - 95]
        else:
            widths = [112, 142, PAGE_W - 144 - 112 - 142]
    else:
        widths = [ (PAGE_W - 144) / raw.ncols ] * raw.ncols
    data = []
    for r_i, row in enumerate(rows):
        converted = []
        for cell in (row + [""] * raw.ncols)[:raw.ncols]:
            cell = re.sub(r"\s+", " ", (cell or "")).strip()
            cell_html = html.escape(cell, quote=False)
            sty = styles["table_header"] if r_i == 0 else styles["table_cell"]
            converted.append(Paragraph(cell_html, sty))
        data.append(converted)
    t = LongTable(data, colWidths=widths, repeatRows=1, hAlign="LEFT", splitByRow=1)
    t.spaceBefore = 4.0
    t.spaceAfter = 7.0
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
        ("GRID", (0, 0), (-1, -1), 0.45, TABLE_GRID),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5.3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5.3),
        ("TOPPADDING", (0, 0), (-1, -1), 3.6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.6),
    ]))
    return t


def normalize_plain(text):
    text = text.replace("\u00a0", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def span_markup(span, strip_leading=0):
    text = span.get("text", "")
    if strip_leading:
        text = text[strip_leading:]
    escaped = html.escape(text, quote=False)
    flags = span.get("flags", 0)
    if flags & 16:
        escaped = f"<b>{escaped}</b>"
    if flags & 2:
        escaped = f"<i>{escaped}</i>"
    return escaped


def line_plain(line):
    return normalize_plain("".join(s.get("text", "") for s in line.get("spans", [])))


def line_markup(line, remove_bullet=False):
    spans = [dict(s) for s in line.get("spans", []) if s.get("text", "")]
    if remove_bullet:
        for s in spans:
            raw = s.get("text", "")
            stripped = raw.lstrip()
            if stripped:
                lead_spaces = len(raw) - len(stripped)
                if stripped.startswith("•"):
                    s["text"] = raw[:lead_spaces] + stripped[1:]
                    remove_bullet = False
                break
    # Trim exterior whitespace without changing internal emphasis runs.
    for s in spans:
        if s.get("text", "").strip():
            s["text"] = s["text"].lstrip()
            break
    for s in reversed(spans):
        if s.get("text", "").strip():
            s["text"] = s["text"].rstrip()
            break
    out = "".join(span_markup(s) for s in spans)
    out = re.sub(r"\s+", " ", out).strip()
    return out


def rich_join_lines(lines):
    out = ""
    previous_plain = ""
    for line in lines:
        m = line_markup(line)
        p = line_plain(line)
        if not m:
            continue
        if out:
            sep = "" if previous_plain.endswith("-") else " "
            out += sep
        out += m
        previous_plain = p
    return out


def line_top(line):
    return line.get("bbox", [0, 0, 0, 0])[1]


def is_small_table_line(line):
    spans = [s for s in line.get("spans", []) if s.get("text", "").strip()]
    if not spans:
        return False
    return all(("Times New Roman" in s.get("font", "")) and s.get("size", 12) <= 10.6 for s in spans)


def cluster_anchors(spans, tol=5.0):
    xs = sorted(s["bbox"][0] for s in spans if s.get("text", "").strip())
    anchors = []
    for x in xs:
        if not anchors or abs(x - anchors[-1]) > tol:
            anchors.append(x)
        else:
            anchors[-1] = (anchors[-1] + x) / 2
    return anchors


def parse_table_lines(lines, context=""):
    spans = [s for ln in lines for s in ln.get("spans", []) if s.get("text", "").strip()]
    anchors = cluster_anchors(spans, 6.0)
    if len(anchors) < 2:
        return None
    # Most report tables have two or three columns; noisy x coordinates are collapsed.
    if len(anchors) > 3:
        compact = []
        for x in anchors:
            if not compact or x - compact[-1] > 35:
                compact.append(x)
        anchors = compact
    if len(anchors) < 2:
        return None
    ncols = len(anchors)

    # Rebuild table text lines, mapping each span to the closest column start.
    line_records = []
    for ln in lines:
        y = line_top(ln)
        cells = [[], []] if ncols == 2 else [[] for _ in range(ncols)]
        for s in ln.get("spans", []):
            txt = s.get("text", "")
            if not txt.strip():
                continue
            x = s["bbox"][0]
            idx = min(range(ncols), key=lambda i: abs(anchors[i] - x))
            cells[idx].append((x, txt))
        celltxt = []
        for col in cells:
            celltxt.append(normalize_plain(" ".join(t for _, t in sorted(col))))
        line_records.append((y, celltxt))
    line_records.sort(key=lambda x: x[0])

    # A row starts wherever the first two table columns begin together.
    starts = []
    for y, cells in line_records:
        if len(cells) >= 2 and cells[0] and cells[1]:
            if not starts or abs(y - starts[-1]) > 3:
                starts.append(y)
    if not starts:
        return None
    if len(starts) == 1 and len(line_records) > 3:
        # A conservative fallback for lines with awkward extraction grouping.
        starts = [y for y, cells in line_records if cells[0] and (cells[1] if len(cells) > 1 else "")]

    row_cells = [[[] for _ in range(ncols)] for _ in starts]
    for y, cells in line_records:
        # Assign wrapped cell lines to the closest row start; ties favor the earlier row.
        idx = min(range(len(starts)), key=lambda i: (abs(starts[i] - y), i))
        for col_i in range(ncols):
            if col_i < len(cells) and cells[col_i]:
                row_cells[idx][col_i].append((y, cells[col_i]))
    rows = []
    for row in row_cells:
        rows.append([normalize_plain(" ".join(txt for _, txt in sorted(col))) for col in row])
    rows = [r for r in rows if any(x for x in r)]
    if not rows:
        return None
    return RawTable(rows, ncols, context)


def split_block_into_segments(block):
    """Split mixed blocks into table-line runs and ordinary text-line runs."""
    lines = [ln for ln in block.get("lines", []) if line_plain(ln)]
    if not lines:
        return []
    segments = []
    current_kind = None
    current_lines = []
    for ln in lines:
        kind = "table" if is_small_table_line(ln) else "text"
        if kind != current_kind and current_lines:
            segments.append((current_kind, current_lines))
            current_lines = []
        current_kind = kind
        current_lines.append(ln)
    if current_lines:
        segments.append((current_kind, current_lines))
    # A single small-font caption or stray token isn't a table; it falls back to text.
    out = []
    for kind, seg_lines in segments:
        if kind == "table":
            parsed = parse_table_lines(seg_lines)
            if parsed is not None:
                out.append(("table", parsed, seg_lines))
            else:
                out.append(("text", seg_lines, None))
        else:
            out.append(("text", seg_lines, None))
    return out


def all_spans(block):
    return [s for line in block.get("lines", []) for s in line.get("spans", []) if s.get("text", "").strip()]


def block_plain(lines):
    return normalize_plain(" ".join(line_plain(ln) for ln in lines if line_plain(ln)))


def is_all_bold(lines):
    spans = [s for ln in lines for s in ln.get("spans", []) if s.get("text", "").strip()]
    return bool(spans) and all(s.get("flags", 0) & 16 for s in spans)


def source_font_code(lines):
    spans = [s for ln in lines for s in ln.get("spans", []) if s.get("text", "").strip()]
    return bool(spans) and any("Consolas" in s.get("font", "") for s in spans)


def paragraph_chunks(lines):
    chunks = []
    cur = []
    prev_y = None
    for ln in lines:
        txt = line_plain(ln)
        if not txt:
            if cur:
                chunks.append(cur)
                cur = []
                prev_y = None
            continue
        y = line_top(ln)
        if cur and prev_y is not None and (y - prev_y) > 16.7:
            chunks.append(cur)
            cur = []
        cur.append(ln)
        prev_y = y
    if cur:
        chunks.append(cur)
    return chunks


def make_bullet_paragraph(markup):
    return Paragraph(markup, styles["body_bullet"], bulletText="•")


def make_number_paragraph(number, markup):
    return Paragraph(markup, styles["body_number"], bulletText=f"{number}.")


def body_items_from_text_lines(lines, current_context=""):
    elems = []
    clean_lines = [ln for ln in lines if line_plain(ln)]
    if not clean_lines:
        return elems
    plain = block_plain(clean_lines)

    # Screenshot placeholders retained from the source report, formatted as figure captions.
    if re.match(r"^Fig\s*8\.10\.\d+", plain, re.I) and "[Actual project screenshot to be inserted]" in plain:
        title = plain.split("[Actual project screenshot to be inserted]")[0].strip()
        elems.append(Paragraph(html.escape(title), styles["caption"]))
        elems.append(Paragraph("[Actual project screenshot to be inserted]", styles["placeholder"]))
        elems.append(Spacer(1, 52))
        return elems

    # Figure captions and diagram instructions.
    if re.match(r"^(Figure|Fig\.)\s", plain, re.I):
        elems.append(Paragraph(html.escape(plain), styles["caption"]))
        return elems

    if plain.startswith("Insert "):
        elems.append(Paragraph(html.escape(plain), styles["instruction"]))
        return elems

    # A captured image is inserted immediately after its caption in the source order.
    if plain.startswith("Figure 4.1") and "class" in image_paths:
        pass

    # Keep source code directory trees intact; the supplied sample uses serif type for prose.
    if source_font_code(clean_lines):
        code = "\n".join(line_plain(ln) for ln in clean_lines)
        code_style = ParagraphStyle("CodeTree", fontName="WayfarerMono", fontSize=8.0,
                                    leading=10.4, leftIndent=0, spaceBefore=2, spaceAfter=5)
        elems.append(Preformatted(code, code_style))
        return elems

    # Bullet lists. Continuation lines stay with their bullet item.
    has_bullets = any(line_plain(ln).lstrip().startswith("•") for ln in clean_lines)
    if has_bullets:
        before = []
        items = []
        active = None
        for ln in clean_lines:
            raw = line_plain(ln)
            if raw.lstrip().startswith("•"):
                if active is not None:
                    items.append(active)
                active = [ln]
            elif active is not None:
                active.append(ln)
            else:
                before.append(ln)
        if active is not None:
            items.append(active)
        if before:
            for chunk in paragraph_chunks(before):
                m = rich_join_lines(chunk)
                if m:
                    elems.append(Paragraph(m, styles["body"]))
        for item in items:
            m = rich_join_lines_with_bullet_removed(item)
            if m:
                elems.append(make_bullet_paragraph(m))
        return elems

    # Numbered list lines (e.g. sizing/design steps and workflow sequences).
    numbered_candidates = []
    for ln in clean_lines:
        plain_line = line_plain(ln)
        m = re.match(r"^\s*(\d+)\.\s+", plain_line)
        numbered_candidates.append((ln, m))
    if numbered_candidates and all(m for _, m in numbered_candidates) and not is_all_bold(clean_lines):
        for ln, m in numbered_candidates:
            markup = line_markup_after_prefix(ln, m.group(0))
            elems.append(make_number_paragraph(m.group(1), markup))
        return elems

    # Bold short blocks are section/subsection headings, which are uppercased like the sample.
    if is_all_bold(clean_lines) and len(plain) <= 150:
        heading_text = plain.upper()
        if plain.startswith(("Root Project Structure", "Public Folder", "Routes Folder", "Database Folder", "Services Folder",
                             "Model Layer", "View Layer", "Controller / Route Layer", "Service Layer")):
            elems.append(Paragraph(html.escape(heading_text), styles["minor"]))
        else:
            elems.append(Paragraph(html.escape(heading_text), styles["section"]))
        return elems

    # Preserve general emphasis inside prose and split paragraph groups by source paragraph gaps.
    for chunk in paragraph_chunks(clean_lines):
        m = rich_join_lines(chunk)
        if m:
            # A bare body-level layer/flow label is stronger when set as a centered callout.
            if "→" in normalize_plain(" ".join(line_plain(ln) for ln in chunk)) and len(m) < 450:
                pstyle = ParagraphStyle("FlowLine", parent=styles["body"], alignment=TA_CENTER, fontSize=11.2)
                elems.append(Paragraph(m, pstyle))
            else:
                elems.append(Paragraph(m, styles["body"]))
    return elems


def rich_join_lines_with_bullet_removed(lines):
    parts = []
    previous_plain = ""
    for i, ln in enumerate(lines):
        m = line_markup(ln, remove_bullet=(i == 0))
        p = line_plain(ln)
        if i == 0:
            p = p.lstrip()
            if p.startswith("•"):
                p = p[1:].strip()
        if not m:
            continue
        if parts:
            parts.append("" if previous_plain.endswith("-") else " ")
        parts.append(m)
        previous_plain = p
    return re.sub(r"\s+", " ", "".join(parts)).strip()


def line_markup_after_prefix(line, prefix):
    # Remove the numbered marker while retaining any bold/italic spans that follow it.
    spans = [dict(s) for s in line.get("spans", []) if s.get("text", "")]
    remaining = prefix
    for s in spans:
        raw = s.get("text", "")
        if not remaining:
            break
        n = min(len(raw), len(remaining))
        # remove as much of the prefix as this run contains
        s["text"] = raw[n:]
        remaining = remaining[n:]
    return line_markup({"spans": spans})


def merge_adjacent_tables(elements):
    merged = []
    for el in elements:
        if isinstance(el, RawTable) and merged and isinstance(merged[-1], RawTable) and merged[-1].ncols == el.ncols:
            prev = merged[-1]
            # If this fragment begins with a repeated header, omit it.
            rows = list(el.rows)
            if rows and table_is_header(rows[0]) and prev.rows and table_is_header(prev.rows[-1]):
                rows = rows[1:]
            prev.rows.extend(rows)
            if not prev.context and el.context:
                prev.context = el.context
        else:
            merged.append(el)
    return merged


def build_elements_from_source():
    elements = []
    current_context = ""
    for page_index in range(3, len(wayfarer_doc)):
        page = wayfarer_doc[page_index]
        if page_index in CHAPTER_PAGE_INDEX:
            chapter_number, chapter_title = CHAPTER_PAGE_INDEX[page_index]
            if chapter_number != 1:
                elements.append(PageBreak())
            elements.append(ChapterTitle(chapter_number, chapter_title))
            current_context = f"CHAPTER {chapter_number} {chapter_title}"

        # Pages 1-3 are reconstructed separately; skip source chapter title blocks.
        blocks = sorted([b for b in page.get_text("dict")["blocks"] if "lines" in b], key=lambda b: (b["bbox"][1], b["bbox"][0]))
        for block in blocks:
            y0 = block["bbox"][1]
            lines = [ln for ln in block.get("lines", []) if line_plain(ln)]
            if not lines:
                continue
            plain_all = block_plain(lines)
            if not plain_all:
                continue
            # Discard source footer page numbers.
            if y0 > 780 and re.fullmatch(r"\d+", plain_all):
                continue
            # Discard source chapter title lines; replacement title is centered in the sample style.
            if re.match(r"^CHAPTER\s+\d+\b", plain_all, re.I) and y0 < 125:
                continue
            if page_index in CHAPTER_PAGE_INDEX and y0 < 125:
                _, title = CHAPTER_PAGE_INDEX[page_index]
                if plain_all.upper() == title.upper():
                    continue

            for kind, payload, seg_lines in split_block_into_segments(block):
                if kind == "table":
                    # Context-aware header inference and column widths are applied at build time.
                    payload.context = current_context
                    elements.append(payload)
                    continue

                text = block_plain(payload)
                if not text:
                    continue
                # Maintain context for table labeling when a section heading occurs.
                all_bold = is_all_bold(payload)
                if all_bold and len(text) <= 150 and not text.startswith(("Figure ", "Fig ")):
                    current_context = text
                subitems = body_items_from_text_lines(payload, current_context)
                elements.extend(subitems)
                # Insert images already present in the source report directly after their captions.
                if text.startswith("Figure 4.1") and "class" in image_paths:
                    im = ImageReader(image_paths["class"])
                    iw, ih = im.getSize()
                    maxw = PAGE_W - 144
                    scale = min(maxw / iw, 180 / ih, 1.0)
                    from reportlab.platypus import Image
                    elements.append(Image(image_paths["class"], width=iw * scale, height=ih * scale))
                elif text.startswith("Figure 6.1") and "er" in image_paths:
                    im = ImageReader(image_paths["er"])
                    iw, ih = im.getSize()
                    maxw = PAGE_W - 144
                    scale = min(maxw / iw, 210 / ih, 1.0)
                    from reportlab.platypus import Image
                    elements.append(Image(image_paths["er"], width=iw * scale, height=ih * scale))
    return merge_adjacent_tables(elements)


BODY_ELEMENTS = build_elements_from_source()


def make_story(toc_pages):
    story = [
        Spacer(1, 1),
        # Change to the report-body template after the title page.
        __import__("reportlab.platypus", fromlist=["NextPageTemplate"]).NextPageTemplate("standard"),
        PageBreak(),             # certificate page, drawn in the page callback
        PageBreak(),             # table of contents page
        Spacer(1, 24),
        Paragraph("TABLE OF CONTENTS", styles["toc_title"]),
        Spacer(1, 16),
    ]
    toc_entries = []
    for n, title in CHAPTERS:
        toc_entries.append((n, title, toc_pages.get(n, "00")))
    story.append(ContentsRows(toc_entries, PAGE_W - 144))
    story.append(PageBreak())
    for elem in BODY_ELEMENTS:
        if isinstance(elem, RawTable):
            story.append(prepare_table(elem))
        else:
            story.append(elem)
    return story


# First pass determines the actual printed page for each chapter; second pass inserts it into the TOC.
class _NoOp:
    pass

draft_path = os.path.join(TMP, "wayfarer_draft.pdf")
draft_doc = ReportDoc(draft_path, title="Wayfarer – Tour and Travel Booking Management System", author="National Engineering College")
draft_doc.build(make_story({}))
chapter_pages = dict(draft_doc.chapter_pages)

final_doc = ReportDoc(OUT, title="Wayfarer – Tour and Travel Booking Management System", author="National Engineering College")
final_doc.build(make_story(chapter_pages))
print(f"Wrote {OUT}")
print(f"Pages: {pymupdf.open(OUT).page_count}")
print(f"Chapter pages (printed numbering): {chapter_pages}")
