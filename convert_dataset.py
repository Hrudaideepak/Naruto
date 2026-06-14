import json

jsonl_path = r"C:\Users\PC\.cache\kagglehub\datasets\chirag101exe\naruto-all-jutsus-info-jsnol\versions\1\jutsus.jsonl"
json_path = r"C:\Users\PC\Desktop\hrudai\jutsus.json"

try:
    print("Reading jsonl dataset...")
    jutsus = []
    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                jutsus.append(json.loads(line))
                
    print("Writing json dataset...")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(jutsus, f, indent=2)
        
    print(f"Success! Wrote {len(jutsus)} jutsus to {json_path}")
except Exception as e:
    print("Error during conversion:", e)
