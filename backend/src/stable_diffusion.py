import requests
import base64
from datetime import datetime
import json
GenImg_DIR = "ImgBackup/GenImg"


async def generate_image(prompt, face):
    image = await prompt_to_image(prompt)
    if image == None:
        with open("image/error.jpg", "rb") as image_file:
            image_data = image_file.read()
            base64_encoded_data = base64.b64encode(image_data)
            image = base64_encoded_data.decode('utf-8')
            return image


    image_change_face = await change_face(image, face)
    if image_change_face == None:
        return image

    return image_change_face

async def prompt_to_image(prompt):
    try:
        prompt = "full-body shot, head-to-toe shot, " + prompt
        print(prompt)

        URL = "http://140.116.154.71:7860/sdapi/v1/txt2img"
        payload = {
            "prompt": prompt,
            "negative_prompt": "(normal quality), (low quality), (worst quality), Deep_Negative, (3 legs)",
            "seed": -1,
            "sampler_name": "DPM++ SDE",
            "scheduler": "Karras",
            "batch_size": 1,
            "n_iter": 1,
            "steps": 20,
            "cfg_scale": 7,
            "width": 768,
            "height": 1152,
            "send_images": "true",
            "save_images": "false",
            "clip_skip": 2,
            "override_settings": {
                "sd_model_checkpoint": "ChilloutRealistic"
            }
        }
        print(payload)
        response = requests.post(URL, json=payload, headers={'Content-Type': 'application/json'})
        if response.status_code != 200:
            return {"error": f"prompt_to_image 請求失敗，狀態碼: {response.status_code}", "details": response}
        data = response.json()
        image = data["images"][0]
        decoded_img_data = base64.b64decode(image)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = f"{GenImg_DIR}/output_{timestamp}.png"
        with open(output_path, "wb") as f:
            f.write(decoded_img_data)

        return image
    except Exception as e:
        print(f"請求或解碼時發生錯誤: {str(e)}")
        return None


async def change_face(image, face):
    try:
        URL = "http://140.116.154.71:7860/roop/image" 
        payload = {
            "source_image": face,
            "target_image": image,
            "face_index": [
                0
            ],
            "scale": 1,
            "upscale_visibility": 1,
            "face_restorer": "None",
            "restorer_visibility": 1,
            "model": "inswapper_128.onnx"
        }

        # with open("payload.json", "w", encoding="utf-8") as f:
        #     json.dump(payload, f, ensure_ascii=False, indent=4)

        response = requests.post(URL, json=payload, headers={'Content-Type': 'application/json'})
        if response.status_code != 200:
            print(f"change_face 請求失敗，狀態碼: {response.status_code}, details: {response}")
            return None
        data = response.json()
        
        image = data["image"]
        decoded_img_data = base64.b64decode(image)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = f"{GenImg_DIR}/output_changed_face_{timestamp}.png"
        with open(output_path, "wb") as f:
            f.write(decoded_img_data)

        return image
    except Exception as e:
        print(f"請求或解碼時發生錯誤: {str(e)}")
        return None
    