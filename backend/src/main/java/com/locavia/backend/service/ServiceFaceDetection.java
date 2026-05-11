package com.locavia.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.opencv.core.*;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import org.opencv.objdetect.CascadeClassifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;

@Service
@Slf4j
public class ServiceFaceDetection {

    private static final String CASCADE_FILE    = "haarcascade_frontalface_default.xml";
    private static final double MIN_FACE_RATIO  = 0.04;   // face must cover ≥ 4% of image
    private static final int    MAX_FACES       = 3;
    private static final long   MAX_SIZE_BYTES  = 5L * 1024 * 1024;
    private static final List<String> ALLOWED_TYPES =
            List.of("image/jpeg", "image/jpg", "image/png", "image/webp");

    private CascadeClassifier faceDetector;

    // ── Result record ────────────────────────────────────────────────────────

    public record FaceDetectionResult(boolean accepted, int facesFound, String rejectionReason) {
        public static FaceDetectionResult ok(int faces) {
            return new FaceDetectionResult(true, faces, null);
        }
        public static FaceDetectionResult reject(int faces, String reason) {
            return new FaceDetectionResult(false, faces, reason);
        }
    }

    // ── Init ─────────────────────────────────────────────────────────────────

    @PostConstruct
    public void init() {
        try {
            nu.pattern.OpenCV.loadLocally();
            log.info("✅ [FACE] OpenCV loaded");
            Path tmp = extractCascadeFile();
            faceDetector = new CascadeClassifier(tmp.toString());
            if (faceDetector.empty()) {
                throw new RuntimeException("Impossible de charger le classificateur de visage");
            }
            log.info("✅ [FACE] Detector initialized");
        } catch (Exception e) {
            log.error("❌ [FACE] Init error: {}", e.getMessage(), e);
            faceDetector = null;
        }
    }

    // ── Public API ───────────────────────────────────────────────────────────

    /** Backward-compatible boolean shortcut. */
    public boolean detectFace(MultipartFile file) {
        return analyzePhoto(file).accepted();
    }

    /**
     * Full validation: format, size, face presence, face-to-image ratio,
     * and group-photo guard.
     */
    public FaceDetectionResult analyzePhoto(MultipartFile file) {
        log.info("🔍 [FACE] Analyzing: {} ({} bytes)", file.getOriginalFilename(), file.getSize());

        // 1. MIME type
        String mime = file.getContentType();
        if (mime == null || !ALLOWED_TYPES.contains(mime.toLowerCase())) {
            return FaceDetectionResult.reject(0,
                    "Format non supporté. Utilisez JPG, PNG ou WebP.");
        }

        // 2. File size
        if (file.getSize() > MAX_SIZE_BYTES) {
            return FaceDetectionResult.reject(0,
                    "La photo dépasse 5 MB.");
        }

        try {
            Mat image = convertToMat(file);
            if (image.empty()) {
                return FaceDetectionResult.reject(0,
                        "Image illisible. Réessayez avec un autre fichier.");
            }

            double totalPixels = (double) image.rows() * image.cols();

            // 3. Grayscale + histogram equalization
            Mat gray = new Mat();
            Mat eq   = new Mat();
            Imgproc.cvtColor(image, gray, Imgproc.COLOR_BGR2GRAY);
            Imgproc.equalizeHist(gray, eq);

            // 4. Detect faces
            MatOfRect faces = new MatOfRect();
            faceDetector.detectMultiScale(
                    eq,
                    faces,
                    1.08,             // fine scale steps → higher recall
                    4,                // min neighbors → fewer false positives
                    0,
                    new Size(40, 40), // ignore tiny faces
                    new Size()
            );

            List<Rect> faceList = faces.toList();
            int count = faceList.size();

            image.release(); gray.release(); eq.release(); faces.release();

            log.info("🔎 [FACE] Faces found: {}", count);

            // 5. No face
            if (count == 0) {
                return FaceDetectionResult.reject(0,
                        "Aucun visage détecté. Uploadez une photo de profil claire avec votre visage bien visible.");
            }

            // 6. Group photo guard
            if (count > MAX_FACES) {
                return FaceDetectionResult.reject(count,
                        "Plusieurs visages détectés (" + count + "). Uploadez une photo individuelle.");
            }

            // 7. Face-to-image ratio — largest face must be visible enough
            Rect largest = faceList.stream()
                    .max((a, b) -> Double.compare(a.area(), b.area()))
                    .orElse(faceList.get(0));

            double ratio = largest.area() / totalPixels;
            log.debug("🔎 [FACE] Ratio: {}", String.format("%.3f", ratio));

            if (ratio < MIN_FACE_RATIO) {
                return FaceDetectionResult.reject(count,
                        "Votre visage est trop petit dans la photo. Rapprochez-vous de la caméra.");
            }

            log.info("✅ [FACE] Accepted — {} face(s), ratio {}", count, String.format("%.3f", ratio));
            return FaceDetectionResult.ok(count);

        } catch (Exception e) {
            log.error("❌ [FACE] Error: {}", e.getMessage(), e);
            return FaceDetectionResult.reject(0,
                    "Erreur lors de l'analyse. Réessayez.");
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Mat convertToMat(MultipartFile file) throws Exception {
        File tmp = File.createTempFile("face-", ".tmp");
        tmp.deleteOnExit();
        try (FileOutputStream fos = new FileOutputStream(tmp)) {
            fos.write(file.getBytes());
        }
        Mat mat = Imgcodecs.imread(tmp.getAbsolutePath());
        tmp.delete();
        return mat;
    }

    private Path extractCascadeFile() throws Exception {
        Path tmp = Files.createTempFile("haarcascade", ".xml");
        tmp.toFile().deleteOnExit();
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(CASCADE_FILE)) {
            if (is == null) {
                throw new RuntimeException("Fichier cascade introuvable: " + CASCADE_FILE);
            }
            Files.copy(is, tmp, StandardCopyOption.REPLACE_EXISTING);
        }
        return tmp;
    }
}
