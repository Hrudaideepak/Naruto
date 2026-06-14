import kagglehub

try:
    print("Downloading Naruto Hand Sign dataset via kagglehub...")
    path = kagglehub.dataset_download("vikranthkanumuru/naruto-hand-sign-dataset")
    print("Download complete!")
    print("Path to dataset files:", path)
except Exception as e:
    print("Error during download:", e)
