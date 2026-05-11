from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import tensorflow as tf
import numpy as np
from PIL import Image
from io import BytesIO
import json
import os

MODEL_PATH = os.getenv("MODEL_PATH", "model_output/furniture_classifier.keras")
LABELS_PATH = os.getenv("LABELS_PATH", "model_output/labels.json")
IMG_SIZE = int(os.getenv("IMG_SIZE", "224"))
THRESHOLD = float(os.getenv("THRESHOLD", "0.80"))

app = FastAPI(title="Locavia ML API")

model = tf.keras.models.load_model(MODEL_PATH)

with open(LABELS_PATH, "r", encoding="utf-8") as f:
    labels = json.load(f)

label_0 = labels.get("0", labels.get(0, "furniture"))
label_1 = labels.get("1", labels.get(1, "not_furniture"))

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    img = Image.open(BytesIO(image_bytes)).convert("RGB")
    img = img.resize((IMG_SIZE, IMG_SIZE))
    arr = np.array(img, dtype=np.float32) / 255.0
    arr = np.expand_dims(arr, axis=0)
    return arr

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Le fichier envoyé n'est pas une image")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Image vide")

    try:
        x = preprocess_image(image_bytes)
        raw_score = float(model.predict(x, verbose=0)[0][0])

        # sigmoid => probabilité de la classe 1
        prob_1 = raw_score
        prob_0 = 1.0 - raw_score

        if label_1 == "furniture":
            furniture_score = prob_1
            not_furniture_score = prob_0
        else:
            furniture_score = prob_0
            not_furniture_score = prob_1

        predicted_class = "furniture" if furniture_score >= not_furniture_score else "not_furniture"
        accepted = predicted_class == "furniture" and furniture_score >= THRESHOLD

        return JSONResponse({
            "furniture": accepted,
            "predictedClass": predicted_class,
            "furnitureScore": round(furniture_score, 6),
            "notFurnitureScore": round(not_furniture_score, 6),
            "rawScore": round(raw_score, 6),
            "threshold": THRESHOLD,
            "message": "Image valide" if accepted else "L'image ne semble pas représenter un meuble"
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur pendant la prédiction: {str(e)}")