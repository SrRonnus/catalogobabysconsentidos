#!/usr/bin/env python3
from pathlib import Path
from subprocess import run, CalledProcessError

IMAGE_EXTENSIONS = {'.svg', '.png', '.jpg', '.jpeg', '.webp'}
FRONTEND_DIR = Path(__file__).resolve().parent.parent
IMAGES_DIR = FRONTEND_DIR / 'images'
OUTPUT_FILE = FRONTEND_DIR / 'src' / 'sectionImages.js'


def is_image_file(name: str) -> bool:
    return Path(name).suffix.lower() in IMAGE_EXTENSIONS


def convert_to_webp(src: Path, dest: Path) -> None:
    try:
        run(['cwebp', '-q', '80', str(src), '-o', str(dest)], check=True, capture_output=True)
    except CalledProcessError as exc:
        raise RuntimeError(f'cwebp failed for {src}: {exc.stderr.decode().strip()}') from exc


def main() -> None:
    section_images = {}

    for section_dir in sorted([p for p in IMAGES_DIR.iterdir() if p.is_dir()], key=lambda p: p.name):
        image_files = [p.name for p in sorted(section_dir.iterdir()) if p.is_file() and p.name.lower() != 'index.json' and is_image_file(p.name)]
        section_list = []

        for index, original_name in enumerate(image_files):
            original_path = section_dir / original_name
            ext = original_path.suffix.lower()
            if ext in {'.jpg', '.jpeg'}:
                target_name = f'p{index}.webp'
                target_path = section_dir / target_name
                convert_to_webp(original_path, target_path)
                original_path.unlink()
            else:
                target_name = f'p{index}{ext}'
                target_path = section_dir / target_name
                if original_path.name != target_name:
                    original_path.rename(target_path)

            section_list.append(target_name)

        section_images[section_dir.name] = section_list

    output_text = f"const sectionImages = {section_images!r};\nexport default sectionImages;\n"
    # Convert Python quote style to valid JS JSON-like output
    output_text = output_text.replace("'", '"')
    OUTPUT_FILE.write_text(output_text, encoding='utf-8')
    print(f'Generated {OUTPUT_FILE}')


if __name__ == '__main__':
    main()
