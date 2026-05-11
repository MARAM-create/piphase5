from app import analyze_sentiment, classify_reclamation, detect_priority

passed = 0
failed = 0

# Sentiment tests
tests = [
    ("Excellent service, tres satisfait!", "POSITIVE"),
    ("Terrible, sale et bruyant", "NEGATIVE"),
    ("Appartement correct", "NEUTRAL"),
]
print("=== Sentiment Analysis ===")
for text, expected in tests:
    result = analyze_sentiment(text)
    status = "PASS" if result == expected else "FAIL"
    if status == "PASS":
        passed += 1
    else:
        failed += 1
    print(f"  [{status}] '{text}' -> {result} (expected {expected})")

# Classification tests
print("\n=== Reclamation Classification ===")
cls_tests = [
    ("Je veux un remboursement, probleme de paiement", "PAYMENT"),
    ("Appartement tres sale", "CLEANLINESS"),
    ("Le proprietaire ne repond pas", "OWNER"),
    ("Bug dans application", "TECHNICAL"),
    ("C est une arnaque totale", "FRAUD"),
]
for text, expected in cls_tests:
    result = classify_reclamation(text)
    status = "PASS" if result == expected else "FAIL"
    if status == "PASS":
        passed += 1
    else:
        failed += 1
    print(f"  [{status}] '{text}' -> {result} (expected {expected})")

# Priority tests
print("\n=== Priority Detection ===")
pri_tests = [
    ("Arnaque urgente!", "HIGH"),
    ("Retard de livraison", "MEDIUM"),
    ("Question simple", "LOW"),
]
for text, expected in pri_tests:
    result = detect_priority(text)
    status = "PASS" if result == expected else "FAIL"
    if status == "PASS":
        passed += 1
    else:
        failed += 1
    print(f"  [{status}] '{text}' -> {result} (expected {expected})")

print(f"\n=== Results: {passed} passed, {failed} failed out of {passed+failed} ===")
