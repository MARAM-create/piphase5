from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.getenv('MODEL_PATH', 'furniture_detector.h5')
THRESHOLD = float(os.getenv('THRESHOLD', '0.5'))

print(f'Chargement du modèle depuis {MODEL_PATH}...')

try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print('✅ Modèle chargé')
    print(f'Input shape : {model.input_shape}')
except Exception as e:
    print(f'❌ Erreur chargement modèle : {e}')
    model = None


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img = img.resize((224, 224))
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)


@app.route('/api/furniture/verify', methods=['POST'])
def verify_furniture():
    if model is None:
        return jsonify({
            'error': 'MODEL_NOT_LOADED',
            'message': 'Le modèle IA n’est pas chargé.',
            'isFurniture': False
        }), 500

    # Accepte les deux noms : image ou file
    if 'image' in request.files:
        file = request.files['image']
    elif 'file' in request.files:
        file = request.files['file']
    else:
        return jsonify({
            'error': 'Aucun fichier fourni',
            'message': 'Aucune image reçue.',
            'isFurniture': False
        }), 400

    if file.filename == '':
        return jsonify({
            'error': 'Nom de fichier vide',
            'message': 'Nom de fichier vide.',
            'isFurniture': False
        }), 400

    allowed_types = {'image/jpeg', 'image/jpg', 'image/png', 'image/webp'}

    if file.content_type not in allowed_types:
        return jsonify({
            'error': 'Format non supporté',
            'message': 'Format non supporté. Utilisez JPEG, PNG ou WebP.',
            'isFurniture': False
        }), 415

    try:
        image_bytes = file.read()
        img_array = preprocess_image(image_bytes)

        prediction = float(model.predict(img_array, verbose=0)[0][0])

        # Ici on suppose que :
        # score proche de 1 = meuble
        # score proche de 0 = non-meuble
        is_furniture = prediction > THRESHOLD

        confidence = round(
            prediction * 100 if is_furniture else (1 - prediction) * 100,
            2
        )

        print("=== DEBUG IA ===")
        print(f"Fichier : {file.filename}")
        print(f"Score brut : {prediction}")
        print(f"Is furniture : {is_furniture}")
        print(f"Confidence : {confidence}%")
        print(f"Threshold : {THRESHOLD}")

        return jsonify({
            'isFurniture': is_furniture,
            'confidence': confidence,
            'rawScore': round(prediction, 4),
            'label': 'meuble' if is_furniture else 'non_meuble',
            'message': 'Image valide' if is_furniture else 'Veuillez insérer une image de meuble'
        })

    except Exception as e:
        print(f'Erreur IA : {e}')
        return jsonify({
            'error': str(e),
            'message': 'Erreur lors de la vérification IA.',
            'isFurniture': False
        }), 500


@app.route('/api/furniture/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'model': MODEL_PATH,
        'modelLoaded': model is not None,
        'threshold': THRESHOLD
    })


if __name__ == '__main__':
    print('🚀 Serveur sur http://localhost:5001')
    app.run(host='0.0.0.0', port=5001, debug=False)
