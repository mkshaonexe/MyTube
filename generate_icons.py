from PIL import Image, ImageDraw
import os

# Load the original logo
logo = Image.open('logomytube.png')

# Define the sizes for each density
sizes = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192
}

# Base path for Android resources
base_path = 'android/app/src/main/res'

for density, size in sizes.items():
    # Create directory path
    mipmap_dir = os.path.join(base_path, f'mipmap-{density}')
    
    # Ensure directory exists
    os.makedirs(mipmap_dir, exist_ok=True)
    
    # Create square icon (ic_launcher.png)
    square_icon = logo.resize((size, size), Image.Resampling.LANCZOS)
    square_icon.save(os.path.join(mipmap_dir, 'ic_launcher.png'))
    print(f'Created ic_launcher.png for {density} ({size}x{size})')
    
    # Create rounded icon (ic_launcher_round.png)
    round_icon = logo.resize((size, size), Image.Resampling.LANCZOS)
    # Create a circular mask
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)
    
    # Apply the mask
    round_output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    round_output.paste(round_icon, (0, 0))
    round_output.putalpha(mask)
    round_output.save(os.path.join(mipmap_dir, 'ic_launcher_round.png'))
    print(f'Created ic_launcher_round.png for {density} ({size}x{size})')
    
    # Create foreground icon (ic_launcher_foreground.png)
    # For adaptive icons, foreground should be slightly larger (108dp safe zone)
    # We'll use the same as square for simplicity
    foreground_icon = logo.resize((size, size), Image.Resampling.LANCZOS)
    foreground_icon.save(os.path.join(mipmap_dir, 'ic_launcher_foreground.png'))
    print(f'Created ic_launcher_foreground.png for {density} ({size}x{size})')

print('\nAll icons generated successfully!')
