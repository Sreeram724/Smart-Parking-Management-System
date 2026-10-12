from PIL import Image, ImageDraw, ImageFont
import os

def render_vscode_tree(output_path, root_name, items, width=642, height=1408):
    # Dark VS Code background
    img = Image.new("RGB", (width, height), color=(24, 24, 27))
    draw = ImageDraw.Draw(img)
    
    # Try standard system fonts
    font = None
    bold_font = None
    for font_name in ["consola.ttf", "arial.ttf", "segoeui.ttf"]:
        try:
            font = ImageFont.truetype(font_name, 26)
            bold_font = ImageFont.truetype(font_name, 28)
            break
        except Exception:
            pass
    if font is None:
        font = ImageFont.load_default()
        bold_font = font

    # Top header bar
    draw.rectangle([0, 0, width, 60], fill=(30, 30, 36))
    draw.text((25, 16), root_name.upper(), fill=(160, 160, 175), font=bold_font)
    draw.line([0, 60, width, 60], fill=(45, 45, 55), width=2)
    
    y = 85
    line_height = 44
    
    for indent_level, icon_type, name, is_dir, is_open in items:
        x = 25 + indent_level * 28
        
        # Chevron for folders
        if is_dir:
            chevron = "v" if is_open else ">"
            draw.text((x - 18, y + 2), chevron, fill=(130, 130, 145), font=font)
            
            # Folder icon representation
            folder_color = (229, 192, 123) if is_open else (209, 154, 102)
            draw.text((x + 6, y), "[D]", fill=folder_color, font=font)
            draw.text((x + 48, y), name, fill=(230, 230, 235), font=bold_font)
        else:
            # File color by extension
            if name.endswith(".py"):
                f_color = (78, 201, 176)
                icon = "[PY]"
            elif name.endswith(".jsx") or name.endswith(".js"):
                f_color = (255, 215, 0)
                icon = "[JS]"
            elif name.endswith(".css"):
                f_color = (86, 156, 214)
                icon = "[#]"
            elif name.endswith(".html"):
                f_color = (228, 77, 38)
                icon = "[<>]"
            elif name.endswith(".json") or name.endswith(".env") or name.endswith(".txt"):
                f_color = (206, 145, 120)
                icon = "[*]"
            else:
                f_color = (156, 220, 254)
                icon = "[-]"
                
            draw.text((x + 6, y), icon, fill=f_color, font=font)
            draw.text((x + 55, y), name, fill=(205, 210, 218), font=font)
            
        y += line_height
        if y > height - 30:
            break
            
    img.save(output_path, quality=95)
    print(f"Generated {output_path}")

# Left Tree Items
items_left = [
    (0, "dir", "backend-flask", True, True),
    (1, "dir", "middleware", True, False),
    (1, "dir", "routes", True, False),
    (1, "dir", "utils", True, False),
    (1, "file", ".env", False, False),
    (1, "file", ".env.example", False, False),
    (1, "file", "app.py", False, False),
    (1, "file", "config.py", False, False),
    (1, "file", "database.py", False, False),
    (1, "file", "requirements.txt", False, False),
    (1, "file", "seed_data.py", False, False),
    (0, "dir", "realtime-service", True, True),
    (1, "dir", "node_modules", True, False),
    (1, "file", ".env.example", False, False),
    (1, "file", "package.json", False, False),
    (1, "file", "server.js", False, False),
    (0, "dir", "frontend-react", True, True),
    (1, "dir", "public", True, False),
    (1, "dir", "src", True, False),
    (1, "file", "index.html", False, False),
    (1, "file", "package.json", False, False),
    (1, "file", "postcss.config.js", False, False),
    (1, "file", "tailwind.config.js", False, False),
    (1, "file", "vite.config.js", False, False),
    (0, "file", "README.md", False, False),
    (0, "file", "start_all.bat", False, False),
    (0, "file", "start_all.ps1", False, False),
]

# Right Tree Items (Submodule breakdown)
items_right = [
    (0, "dir", "backend-flask / routes", True, True),
    (1, "file", "admin_routes.py", False, False),
    (1, "file", "auth_routes.py", False, False),
    (1, "file", "booking_routes.py", False, False),
    (1, "file", "spot_routes.py", False, False),
    (0, "dir", "backend-flask / middleware", True, True),
    (1, "file", "auth_middleware.py", False, False),
    (0, "dir", "backend-flask / utils", True, True),
    (1, "file", "notifier.py", False, False),
    (0, "dir", "frontend-react / src", True, True),
    (1, "dir", "components", True, True),
    (2, "file", "AdminPanel.jsx", False, False),
    (2, "file", "BookingModal.jsx", False, False),
    (2, "file", "DigitalPassModal.jsx", False, False),
    (2, "file", "LoginModal.jsx", False, False),
    (2, "file", "MyBookings.jsx", False, False),
    (2, "file", "Navbar.jsx", False, False),
    (2, "file", "ParkingGrid.jsx", False, False),
    (2, "file", "QRCodeView.jsx", False, False),
    (1, "dir", "context", True, True),
    (2, "file", "AuthContext.jsx", False, False),
    (2, "file", "SocketContext.jsx", False, False),
    (1, "dir", "services", True, True),
    (2, "file", "api.js", False, False),
    (1, "file", "App.jsx", False, False),
    (1, "file", "index.css", False, False),
    (1, "file", "main.jsx", False, False),
]

assets_dir = r"c:\Users\Lenovo\Downloads\WAYFARER-main\WFP NOSQL\report_assets"
render_vscode_tree(os.path.join(assets_dir, "fig_2_1_tree_left.png"), "ParkPulse - Root Structure", items_left)
render_vscode_tree(os.path.join(assets_dir, "fig_2_1_tree_right.png"), "ParkPulse - App Modules", items_right)
