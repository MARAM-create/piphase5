from flask import Flask, request, jsonify
from flask_cors import CORS
from textblob import TextBlob

app = Flask(__name__)
CORS(app)


def analyze_sentiment(text: str) -> str:
    """Classify text sentiment as POSITIVE, NEGATIVE, or NEUTRAL."""
    polarity = TextBlob(text).sentiment.polarity
    if polarity > 0.1:
        return "POSITIVE"
    elif polarity < -0.1:
        return "NEGATIVE"
    else:
        return "NEUTRAL"


def classify_reclamation(text: str) -> str:
    """Auto-detect complaint category from text."""
    text_lower = text.lower()

    payment_keywords = ["argent", "payer", "paiement", "facture", "remboursement", "facturation", "prix", "coût"]
    cleanliness_keywords = ["sale", "propre", "propreté", "nettoyage", "hygiène", "poussière", "odeur"]
    owner_keywords = ["propriétaire", "proprietaire", "bailleur", "logeur", "proprio"]
    technical_keywords = ["bug", "technique", "panne", "cassé", "fuite", "électricité", "plomberie", "chauffage"]
    fraud_keywords = ["arnaque", "fraude", "escroquerie", "faux", "tromperie", "vol"]

    for kw in fraud_keywords:
        if kw in text_lower:
            return "FRAUD"
    for kw in payment_keywords:
        if kw in text_lower:
            return "PAYMENT"
    for kw in cleanliness_keywords:
        if kw in text_lower:
            return "CLEANLINESS"
    for kw in owner_keywords:
        if kw in text_lower:
            return "OWNER"
    for kw in technical_keywords:
        if kw in text_lower:
            return "TECHNICAL"

    return "OTHER"


def detect_priority(text: str) -> str:
    """Assign urgency level based on text analysis."""
    text_lower = text.lower()

    high_keywords = ["arnaque", "urgent", "fraude", "danger", "escroquerie", "immédiat", "grave", "critique"]
    medium_keywords = ["retard", "problème", "attente", "délai", "lent", "dysfonctionnement"]

    for kw in high_keywords:
        if kw in text_lower:
            return "HIGH"
    for kw in medium_keywords:
        if kw in text_lower:
            return "MEDIUM"

    return "LOW"


@app.route("/sentiment", methods=["POST"])
def sentiment_endpoint():
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field"}), 400

    text = data["text"]
    result = analyze_sentiment(text)
    polarity = TextBlob(text).sentiment.polarity

    return jsonify({
        "sentiment": result,
        "polarity": round(polarity, 4)
    })


@app.route("/classify", methods=["POST"])
def classify_endpoint():
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field"}), 400

    category = classify_reclamation(data["text"])
    return jsonify({"category": category})


@app.route("/priority", methods=["POST"])
def priority_endpoint():
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field"}), 400

    priority = detect_priority(data["text"])
    return jsonify({"priority": priority})


@app.route("/analyze-reclamation", methods=["POST"])
def analyze_reclamation_endpoint():
    """Combined endpoint: classify + priority in one call."""
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "Missing 'text' field"}), 400

    text = data["text"]
    return jsonify({
        "category": classify_reclamation(text),
        "priority": detect_priority(text),
        "sentiment": analyze_sentiment(text)
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "UP"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
