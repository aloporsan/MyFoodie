"""
Genera el set de iconos de Expo a partir de assets/images/logo-myfoodie.png.

Uso (desde la carpeta frontend/):
    pip install pillow
    python scripts/gen_icons.py

Regenera:
    assets/images/icon.png                    1024x1024, fondo blanco, logo al 80%
    assets/images/android-icon-foreground.png  1024x1024, transparente, logo al 55%
                                               (cabe en la safe zone del adaptive icon)
    assets/images/favicon.png                  48x48, fondo blanco
    assets/images/splash-icon.png              1024x1024, transparente, logo al 70%

El fondo del adaptive icon de Android se define como color solido en app.json
(android.adaptiveIcon.backgroundColor = "#FFFFFF"), no como imagen.
"""
from PIL import Image
import pathlib

ASSETS = pathlib.Path("assets/images")
SRC = ASSETS / "logo-myfoodie.png"
WHITE = (255, 255, 255, 255)

logo = Image.open(SRC).convert("RGBA")
logo = logo.crop(logo.getbbox())  # recorta el margen transparente
lw, lh = logo.size


def scaled(max_frac, canvas):
    """Logo escalado para caber en un cuadrado (canvas*max_frac) manteniendo proporcion."""
    target = int(canvas * max_frac)
    ratio = min(target / lw, target / lh)
    return logo.resize((max(1, round(lw * ratio)), max(1, round(lh * ratio))), Image.Resampling.LANCZOS)


def centered(sprite, canvas, bg):
    img = Image.new("RGBA", (canvas, canvas), bg)
    sw, sh = sprite.size
    img.alpha_composite(sprite, ((canvas - sw) // 2, (canvas - sh) // 2))
    return img


# icon.png -> fondo blanco opaco (iOS ignora alpha), logo al ~80%
centered(scaled(0.80, 1024), 1024, WHITE).convert("RGB").save(ASSETS / "icon.png")

# android-icon-foreground.png -> transparente, logo dentro de la safe zone del adaptive icon
centered(scaled(0.55, 1024), 1024, (0, 0, 0, 0)).save(ASSETS / "android-icon-foreground.png")

# favicon.png -> 48, fondo blanco, logo al ~92%
centered(scaled(0.92, 48), 48, WHITE).convert("RGB").save(ASSETS / "favicon.png")

# splash-icon.png -> transparente, logo al ~70%
centered(scaled(0.70, 1024), 1024, (0, 0, 0, 0)).save(ASSETS / "splash-icon.png")

for name in ("icon.png", "android-icon-foreground.png", "favicon.png", "splash-icon.png"):
    im = Image.open(ASSETS / name)
    print(f"{name:34} {im.size} {im.mode}")
