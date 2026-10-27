p = r"c:\Entwicklung\deutschland-flieht-aktuell\webseiten\deutschland-flieht-entwurf\styles.css"
text = open(p, encoding="utf-8").read()
print("len", len(text), "lines", text.count("\n") + 1)
i = 0
depth = 0
line = 1
in_str = None
in_comment = False
bad = []
while i < len(text):
    c = text[i]
    if c == "\n":
        line += 1
    if in_comment:
        if c == "*" and i + 1 < len(text) and text[i + 1] == "/":
            in_comment = False
            i += 2
            continue
        i += 1
        continue
    if in_str:
        if c == "\\":
            i += 2
            continue
        if c == in_str:
            in_str = None
        i += 1
        continue
    if c == "/" and i + 1 < len(text) and text[i + 1] == "*":
        in_comment = True
        i += 2
        continue
    if c in ("\"", "'"):
        in_str = c
        i += 1
        continue
    if c == "{":
        depth += 1
    elif c == "}":
        depth -= 1
        if depth < 0:
            bad.append(line)
            depth = 0
    i += 1
print("depth", depth, "unclosed_comment", in_comment, "bad_close_lines", bad[:20])
