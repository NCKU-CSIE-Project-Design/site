import requests, base64

async def get_error_img():
    with open("static/error.jpg", "rb") as image_file:
        image_data = image_file.read()
        base64_encoded_data = base64.b64encode(image_data)
        image = base64_encoded_data.decode('utf-8')
        return image
    
async def generate_image_from_sd(prompt, LoRA):
    results = []
    for lora in LoRA:
        if lora == "nolora":
            image = await prompt_to_image(prompt)
        else:
            image = await prompt_to_image(prompt + f" , <lora:{lora}:1>")

        if image == None:
            image = get_error_img()
            print("error on prompt_to_image()")

        results.append({
            "style": lora,
            "image": image
        })

    return results

async def prompt_to_image(prompt):
    URL = "http://140.116.154.71:7860/sdapi/v1/txt2img"
    payload = {
        "prompt": prompt,
        "negative_prompt": "(normal quality), (low quality), (worst quality), Deep_Negative, (3 legs)",
        "seed": 12,
        "sampler_name": "DPM++ SDE",
        "scheduler": "Karras",
        "batch_size": 1,
        "n_iter": 1,
        "steps": 20,
        "cfg_scale": 7,
        "width": 512,
        "height": 768,
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

    return image


async def change_face_from_sd(images, face):
    for image in images:
        image_changed_face = await change_face(image["image"], face)

        if image_changed_face == None:
            image_changed_face = await get_error_img()
            print("error on change_face()")
        
        image["image"] = image_changed_face
    
    return images

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

        response = requests.post(URL, json=payload, headers={'Content-Type': 'application/json'})
        if response.status_code != 200:
            print(f"change_face 請求失敗，狀態碼: {response.status_code}, details: {response}")
            return None
        data = response.json()
        
        image = data["image"]

        return image
    except Exception as e:
        print(f"請求或解碼時發生錯誤: {str(e)}")
        return None
    
