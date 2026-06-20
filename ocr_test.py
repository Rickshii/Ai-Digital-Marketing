import subprocess
import os

def run_ocr(image_path):
    abs_path = os.path.abspath(image_path)
    ps_script = f"""
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$el = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$el = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$el = [Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType = WindowsRuntime]

$file = [Windows.Storage.StorageFile]::GetFileFromPathAsync("{abs_path}").GetResults()
$stream = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read).GetResults()
$decoder = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream).GetResults()
$bitmap = $decoder.GetSoftwareBitmapAsync().GetResults()
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
$result = $engine.RecognizeAsync($bitmap).GetResults()
Write-Output $result.Text
"""
    temp_ps1 = "temp_ocr.ps1"
    with open(temp_ps1, "w", encoding="utf-8") as f:
        f.write(ps_script)
    try:
        res = subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", temp_ps1], capture_output=True, text=True)
        return res.stdout.strip()
    finally:
        if os.path.exists(temp_ps1):
            os.remove(temp_ps1)

if __name__ == "__main__":
    print("OCR Result:")
    print(run_ocr("test_qr.png"))
