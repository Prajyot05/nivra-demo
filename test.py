import zipfile
import xml.etree.ElementTree as ET
import glob

def extract_text(path):
    try:
        with zipfile.ZipFile(path) as docx:
            content = docx.read('word/document.xml')
            root = ET.fromstring(content)
            text = ' '.join(node.text for node in root.iter() if node.tag.endswith('t') and node.text)
            return text
    except Exception as e:
        return str(e)

for file in glob.glob('docs/Reports/*.docx'):
    print(f"\n--- {file} ---")
    print(extract_text(file)[:2000])
