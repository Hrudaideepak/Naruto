import kagglehub

try:
    print("Downloading Naruto Jutsus dataset via kagglehub...")
    path = kagglehub.dataset_download("chirag101exe/naruto-all-jutsus-info-jsnol")
    print("Download complete!")
    print("Path to dataset files:", path)
except Exception as e:
    print("Error during download:", e)
