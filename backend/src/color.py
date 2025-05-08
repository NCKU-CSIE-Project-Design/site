from sklearn.cluster import KMeans
import cv2
import numpy as np
import dlib
import os
from datetime import datetime

COLOR_DIR = "ImgBackup/Colors"

def get_dominant_color(img, mask=None):
    if mask is not None:
        img = cv2.bitwise_and(img, img, mask=mask)
    pixels = img.reshape(-1, 3)
    if mask is not None:
        pixels = pixels[pixels.sum(axis=1) > 0]
    if len(pixels) == 0:
        return np.array([0, 0, 0])
    kmeans = KMeans(n_clusters=1, n_init=10)
    kmeans.fit(pixels)
    dominant_color = kmeans.cluster_centers_[0]
    return np.uint8(dominant_color)

def get_hair_color(img, face):
    face_top = face.top()
    face_width = face.right() - face.left()
    hair_height = face_width // 2
    hair_top = max(0, face_top - hair_height)
    hair_region = img[hair_top:face_top, face.left():face.right()]
    hsv_hair = cv2.cvtColor(hair_region, cv2.COLOR_RGB2HSV)
    lower_hair = np.array([0, 20, 50])   
    upper_hair = np.array([180, 255, 255])
    mask = cv2.inRange(hsv_hair, lower_hair, upper_hair)
    dominant_color = get_dominant_color(hair_region, mask)
    return rgb_to_hex(dominant_color)

def get_skin_color(img, face):
    face_region = img[face.top():face.bottom(), face.left():face.right()]
    hsv_face = cv2.cvtColor(face_region, cv2.COLOR_RGB2HSV)
    lower_skin = np.array([0, 20, 70])
    upper_skin = np.array([20, 255, 255])
    mask = cv2.inRange(hsv_face, lower_skin, upper_skin)
    dominant_color = get_dominant_color(face_region, mask)
    return rgb_to_hex(dominant_color)

def get_lip_color(img, landmarks):
    # Create a mask of the same size as the original image (initially all black)
    mask = np.zeros(img.shape[:2], dtype=np.uint8)
    
    # Get outer lip contour points (excluding inner lip)
    outer_lip = []
    for i in range(48, 60):
        outer_lip.append([landmarks.part(i).x, landmarks.part(i).y])
    
    # Convert to numpy array
    outer_lip = np.array([outer_lip], dtype=np.int32)
    cv2.fillPoly(mask, outer_lip, 255)

    # Get lip bounding box for ROI extraction
    x_coords = outer_lip[0][:, 0]
    y_coords = outer_lip[0][:, 1]
    x1, x2 = min(x_coords), max(x_coords)
    y1, y2 = min(y_coords), max(y_coords)

    # Extract ROI (lip region)
    padding = 5  # Adjust as needed
    roi = img[max(0, y1-padding):min(img.shape[0], y2+padding),
              max(0, x1-padding):min(img.shape[1], x2+padding)]
    mask_roi = mask[max(0, y1-padding):min(img.shape[0], y2+padding),
                    max(0, x1-padding):min(img.shape[1], x2+padding)]

    # Get main lip color
    dominant_color = get_dominant_color(roi, mask_roi)
    
    return rgb_to_hex(dominant_color)

def rgb_to_hex(rgb):
    return '#{:02x}{:02x}{:02x}'.format(int(rgb[0]), int(rgb[1]), int(rgb[2]))

def visualize_facial_regions(img, face, landmarks, save_path='facial_regions.jpg'):
    img_copy = img.copy()
    cv2.rectangle(img_copy, 
                 (face.left(), face.top()),
                 (face.right(), face.bottom()),
                 (0, 255, 0), 2)
    
    face_width = face.right() - face.left()
    hair_height = face_width // 2
    hair_top = max(0, face.top() - hair_height)
    cv2.rectangle(img_copy,
                 (face.left(), hair_top),
                 (face.right(), face.top()),
                 (255, 0, 0), 2)
    
    lips = []
    for i in range(48, 60):
        lips.append((landmarks.part(i).x, landmarks.part(i).y))
        cv2.circle(img_copy, (landmarks.part(i).x, landmarks.part(i).y), 2, (0, 255, 0), -1)
    
    x_coords = [x for x, y in lips]
    y_coords = [y for x, y in lips]
    x1, x2 = min(x_coords), max(x_coords)
    y1, y2 = min(y_coords), max(y_coords)
    padding = 5
    
    cv2.rectangle(img_copy,
                 (x1 - padding, y1 - padding),
                 (x2 + padding, y2 + padding),
                 (255, 255, 0), 2)
    
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(img_copy, 'Hair', (face.left(), hair_top - 10), font, 0.5, (255, 0, 0), 2)
    cv2.putText(img_copy, 'Face', (face.left(), face.top() - 10), font, 0.5, (0, 255, 0), 2)
    cv2.putText(img_copy, 'Lips', (x1 - padding, y1 - padding - 10), font, 0.5, (255, 255, 0), 2)
    
    img_bgr = cv2.cvtColor(img_copy, cv2.COLOR_RGB2BGR)
    cv2.imwrite(save_path, img_bgr)

def get_color(filepath):
    with open(filepath, "rb") as f:
        contents = f.read()

    # Use OpenCV to read image for color analysis
    img_cv = cv2.imdecode(np.frombuffer(contents, np.uint8), cv2.IMREAD_COLOR)
    img_cv = cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB)
    
    # Initialize face detector and landmark detector
    detector = dlib.get_frontal_face_detector()
    predictor = dlib.shape_predictor('docs/shape_predictor_68_face_landmarks.dat')
    
    # Detect faces
    faces = detector(img_cv)
    if len(faces) == 0:
        return {
            "error": "Unable to detect face, please upload a clear front-facing face photo."
        }
    
    face = faces[0]
    landmarks = predictor(img_cv, face)
    
    # Analyze colors (add error checking)
    try:
        colors = {
            'hair': get_hair_color(img_cv, face),
            'skin': get_skin_color(img_cv, face),
            'lips': get_lip_color(img_cv, landmarks)
        }
    except Exception as e:
        return {
            "error": "Unable to correctly analyze facial features, please ensure the face is clearly visible in the photo."
        }
    
    # Generate visual image

    if not os.path.exists(COLOR_DIR):
        os.makedirs(COLOR_DIR)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}.jpg"
    filepath = os.path.join(COLOR_DIR, filename)
    visualize_facial_regions(img_cv, face, landmarks, filepath)

    return colors